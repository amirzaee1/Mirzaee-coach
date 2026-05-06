import { RankedPerson, AppSettings, Person, EventType } from '../types';
import { RANK_BADGES, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../constants';
import { getTodayJalali } from './date';

const SZ = 1080;
const FONT = 'Vazirmatn, Tahoma, Arial';

// ── Font loading ──────────────────────────────────────────────────────────────

async function ensureFonts(): Promise<void> {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`400 40px Vazirmatn`),
      document.fonts.load(`700 40px Vazirmatn`),
    ]);
  } catch { /* fallback to system fonts */ }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function makeCanvas(w = SZ, h = SZ): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.direction = 'rtl';
  return [c, ctx];
}

function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number, style: 'dark' | 'gold' | 'green' = 'dark') {
  let g: CanvasGradient;
  if (style === 'gold') {
    g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1c0f00'); g.addColorStop(0.6, '#2d1a00'); g.addColorStop(1, '#0f0900');
  } else if (style === 'green') {
    g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#001a10'); g.addColorStop(0.6, '#00261a'); g.addColorStop(1, '#001208');
  } else {
    g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0d0b1e'); g.addColorStop(0.5, '#130f2e'); g.addColorStop(1, '#0a0818');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // subtle grid
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.globalAlpha = 1;

  // glow
  ctx.globalAlpha = 0.10;
  const accent = style === 'gold' ? '#f59e0b' : style === 'green' ? '#10b981' : '#7c3aed';
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, Math.min(w, h) * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.15, h * 0.88, Math.min(w, h) * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

// Use Western digits in canvas for reliable rendering
function num(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en');
  return n.toFixed(1).replace(/\.?0+$/, '');
}

function txt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight: '400' | '700' = '400'
) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string, stroke?: string
) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function divider(ctx: CanvasRenderingContext2D, y: number, w: number, color = '#7c3aed', alpha = 0.5) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(w - 80, y); ctx.stroke();
  ctx.globalAlpha = 1;
}

function watermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  rr(ctx, w / 2 - 120, h - 56, 240, 40, 20, 'rgba(124,58,237,0.25)');
  txt(ctx, 'Mirzaee Coach', w / 2, h - 36, 24, '#c4b5fd', 'center', '700');
}

function dl(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

// ── Top 10 ────────────────────────────────────────────────────────────────────

export async function exportTopTenImage(
  ranked: RankedPerson[],
  period: 'today' | 'week' | 'month',
  settings?: AppSettings
): Promise<void> {
  await ensureFonts();
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, SZ, SZ);

  const periodLabel = period === 'today' ? 'امروز' : period === 'week' ? 'هفته' : 'ماه';
  const prizes =
    period === 'week'  ? (settings?.prizes.weekly  ?? {}) :
    period === 'month' ? (settings?.prizes.monthly ?? {}) :
    {} as Record<number, number>;
  const date = getTodayJalali();
  const top10 = ranked.slice(0, 10);

  // Header
  rr(ctx, 0, 0, SZ, 130, 0, 'rgba(124,58,237,0.18)');
  txt(ctx, '🏆', 80, 65, 52, '#f59e0b', 'left');
  txt(ctx, `Top 10 ${periodLabel}`, SZ / 2 + 10, 48, 46, '#f8fafc', 'center', '700');
  txt(ctx, date, SZ / 2 + 10, 98, 28, '#94a3b8', 'center');

  divider(ctx, 130, SZ);

  const rowH = 88;
  const startY = 142;

  top10.forEach((rp, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const score = period === 'today' ? rp.todayScore : period === 'week' ? rp.weekScore : rp.monthScore;
    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    const badge = RANK_BADGES[rank] ?? '';

    const rowBg =
      rank === 1 ? 'rgba(245,158,11,0.18)' :
      rank <= 3  ? 'rgba(124,58,237,0.14)' :
      i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    rr(ctx, 50, y + 3, SZ - 100, rowH - 6, 14, rowBg);

    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    txt(ctx, badge || String(rank), 110, y + rowH / 2, rank <= 3 ? 32 : 24, rankColor, 'center', '700');

    const nameColor = rank === 1 ? '#fef3c7' : rank <= 3 ? '#f1f5f9' : '#cbd5e1';
    txt(ctx, name, SZ - 155, y + rowH / 2 - (prizes[rank] ? 12 : 0), 30, nameColor, 'right', rank <= 3 ? '700' : '400');
    txt(ctx, `${num(score)} pt`, SZ - 155, y + rowH / 2 + (prizes[rank] ? 14 : 0), 22, '#a78bfa', 'right');

    if (prizes[rank]) {
      rr(ctx, 130, y + rowH / 2 - 18, 170, 36, 18, 'rgba(245,158,11,0.15)');
      txt(ctx, `${num(prizes[rank])} T`, 218, y + rowH / 2, 20, '#fbbf24', 'center');
    }
  });

  watermark(ctx, SZ, SZ);
  dl(canvas, `top10-${period}.png`);
}

// ── Best Today ────────────────────────────────────────────────────────────────

export async function exportBestTodayImage(rp: RankedPerson): Promise<void> {
  await ensureFonts();
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, SZ, SZ, 'gold');

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(SZ / 2, 310, 300, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  txt(ctx, '👑', SZ / 2, 140, 100, '#f59e0b');
  txt(ctx, 'بیشترین اقدام امروز', SZ / 2, 264, 46, '#fef3c7', 'center', '700');
  txt(ctx, date, SZ / 2, 316, 28, '#92400e', 'center');

  divider(ctx, 350, SZ, '#f59e0b', 0.6);

  // Avatar
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.arc(SZ / 2, 450, 90, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(SZ / 2, 450, 90, 0, Math.PI * 2); ctx.stroke();
  txt(ctx, rp.person.firstName[0], SZ / 2, 455, 80, '#fff', 'center', '700');

  txt(ctx, name, SZ / 2, 575, 56, '#ffffff', 'center', '700');
  if (rp.person.team) txt(ctx, rp.person.team, SZ / 2, 628, 28, '#a16207', 'center');

  rr(ctx, 140, 668, SZ - 280, 140, 24, 'rgba(245,158,11,0.2)', '#f59e0b');
  txt(ctx, 'امتیاز امروز', SZ / 2, 710, 30, '#fde68a', 'center');
  txt(ctx, num(rp.todayScore), SZ / 2, 774, 72, '#f59e0b', 'center', '700');

  if (rp.todayPV > 0) {
    rr(ctx, 280, 828, SZ - 560, 58, 28, 'rgba(16,185,129,0.2)', '#10b981');
    txt(ctx, `PV: ${num(rp.todayPV)}`, SZ / 2, 857, 28, '#6ee7b7', 'center', '700');
  }

  txt(ctx, `Afarin ${rp.person.firstName}!`, SZ / 2, 960, 34, '#fef3c7', 'center', '700');
  txt(ctx, 'Olgooye team bash!', SZ / 2, 1006, 28, '#a16207', 'center');

  watermark(ctx, SZ, SZ);
  dl(canvas, 'best-today.png');
}

// ── Person card ───────────────────────────────────────────────────────────────

export async function exportPersonCard(rp: RankedPerson): Promise<void> {
  await ensureFonts();
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, SZ, SZ, rp.rank === 1 ? 'gold' : 'dark');

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();
  const badge = RANK_BADGES[rp.rank];
  const accentColor = rp.rank === 1 ? '#f59e0b' : rp.rank <= 3 ? '#a78bfa' : '#64748b';

  rr(ctx, 0, 0, SZ, 110, 0, 'rgba(255,255,255,0.04)');
  const rankStr = badge ? `${badge}  Rotbeh ${rp.rank}` : `Rotbeh ${rp.rank}`;
  txt(ctx, rankStr, SZ / 2, 55, 42, accentColor, 'center', '700');
  txt(ctx, date, SZ - 56, 55, 24, '#475569', 'right');

  divider(ctx, 110, SZ, accentColor);

  ctx.fillStyle = rp.rank === 1 ? '#92400e' : '#4c1d95';
  ctx.beginPath(); ctx.arc(SZ / 2, 248, 100, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = accentColor; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(SZ / 2, 248, 100, 0, Math.PI * 2); ctx.stroke();
  txt(ctx, rp.person.firstName[0], SZ / 2, 252, 85, '#fff', 'center', '700');

  txt(ctx, name, SZ / 2, 388, 54, '#f8fafc', 'center', '700');
  if (rp.person.team) txt(ctx, rp.person.team, SZ / 2, 443, 28, '#94a3b8', 'center');

  divider(ctx, 480, SZ, accentColor, 0.4);

  const stats = [
    { label: 'Emtiaz Kol',   val: num(rp.totalScore),  color: '#a78bfa' },
    { label: 'Emtiaz Hafte', val: num(rp.weekScore),   color: '#34d399' },
    { label: 'Emtiaz Emruz', val: num(rp.todayScore),  color: '#fbbf24' },
    { label: 'PV Kol',       val: num(rp.totalPV),     color: '#60a5fa' },
  ];

  const cellW = (SZ - 100) / 2;
  const cellH = 160;
  const gx = 50, gy = 500;

  stats.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * cellW, y = gy + row * cellH;
    rr(ctx, x + 8, y + 8, cellW - 16, cellH - 16, 20, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.07)');
    txt(ctx, s.val, x + cellW / 2, y + cellH / 2 - 16, 48, s.color, 'center', '700');
    txt(ctx, s.label, x + cellW / 2, y + cellH / 2 + 32, 24, '#94a3b8', 'center');
  });

  watermark(ctx, SZ, SZ);
  dl(canvas, `card-${rp.person.firstName}.png`);
}

// ── Rankings ──────────────────────────────────────────────────────────────────

export async function exportRankingsImage(ranked: RankedPerson[], title: string): Promise<void> {
  await ensureFonts();
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, SZ, SZ);

  const rows = ranked.slice(0, 10);

  rr(ctx, 0, 0, SZ, 120, 0, 'rgba(124,58,237,0.18)');
  txt(ctx, '🏆', 80, 60, 48, '#f59e0b', 'left');
  txt(ctx, title, SZ / 2 + 20, 50, 42, '#f8fafc', 'center', '700');
  txt(ctx, getTodayJalali(), SZ / 2 + 20, 92, 24, '#94a3b8', 'center');

  divider(ctx, 120, SZ);

  const rowH = 90, startY = 132;
  rows.forEach((rp, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const badge = RANK_BADGES[rank];
    const rowBg =
      rank === 1 ? 'rgba(245,158,11,0.15)' :
      rank <= 3  ? 'rgba(124,58,237,0.12)' :
      i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    rr(ctx, 50, y + 4, SZ - 100, rowH - 8, 14, rowBg);

    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    txt(ctx, badge ?? String(rank), 108, y + rowH / 2, rank <= 3 ? 32 : 24, rankColor, 'center', '700');

    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    txt(ctx, name, SZ - 155, y + rowH / 2 - 12, 28, rank <= 3 ? '#f1f5f9' : '#cbd5e1', 'right', rank <= 3 ? '700' : '400');
    txt(ctx, `${num(rp.totalScore)} pt`, SZ - 155, y + rowH / 2 + 14, 22, '#a78bfa', 'right');
  });

  watermark(ctx, SZ, SZ);
  dl(canvas, 'rankings.png');
}

// ── Activity Stats card ───────────────────────────────────────────────────────

export interface ActivityStat {
  type: EventType;
  count: number;
  totalScore: number;
  totalToman: number;
}

export async function exportActivityStatsImage(
  person: Person,
  stats: ActivityStat[],
  period: 'all' | 'today' | 'week' | 'month'
): Promise<void> {
  await ensureFonts();

  const periodLabel =
    period === 'all' ? 'کل' : period === 'today' ? 'امروز' : period === 'week' ? 'هفته' : 'ماه';

  const activeStats = stats.filter(s => s.count > 0);
  const rows = activeStats.length;
  const H = Math.max(SZ, 200 + rows * 110 + 120);
  const [canvas, ctx] = makeCanvas(SZ, H);
  drawBg(ctx, SZ, H);

  // Header
  rr(ctx, 0, 0, SZ, 130, 0, 'rgba(124,58,237,0.18)');
  txt(ctx, `${person.firstName} ${person.lastName}`, SZ / 2, 52, 44, '#f8fafc', 'center', '700');
  txt(ctx, `Faaliatha - ${periodLabel} | ${getTodayJalali()}`, SZ / 2, 98, 26, '#94a3b8', 'center');

  divider(ctx, 130, SZ);

  if (activeStats.length === 0) {
    txt(ctx, 'Hanooz Sabet Nashode', SZ / 2, 300, 36, '#64748b', 'center');
  } else {
    activeStats.forEach((s, i) => {
      const y = 150 + i * 110;
      rr(ctx, 50, y, SZ - 100, 100, 16, i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)');

      // icon + type name
      txt(ctx, EVENT_TYPE_ICONS[s.type], SZ - 90, y + 50, 36, '#fff', 'right');
      txt(ctx, EVENT_TYPE_LABELS[s.type], SZ - 130, y + 36, 28, '#e2e8f0', 'right', '700');
      txt(ctx, `${s.count}x`, SZ - 130, y + 68, 24, '#94a3b8', 'right');

      // score
      txt(ctx, `${num(s.totalScore)} pt`, 380, y + 50, 36, '#a78bfa', 'center', '700');

      // toman if applicable
      if (s.totalToman > 0) {
        txt(ctx, `${num(s.totalToman / 1_000_000)}M T`, 160, y + 50, 30, '#34d399', 'center', '700');
      }
    });
  }

  // totals bar
  const totalScore = activeStats.reduce((s, a) => s + a.totalScore, 0);
  const totalToman = activeStats.reduce((s, a) => s + a.totalToman, 0);
  const barY = 150 + rows * 110 + 20;
  rr(ctx, 50, barY, SZ - 100, 80, 16, 'rgba(124,58,237,0.2)', 'rgba(124,58,237,0.4)');
  txt(ctx, `Jam: ${num(totalScore)} emtiaz`, SZ / 2, barY + 28, 30, '#a78bfa', 'center', '700');
  if (totalToman > 0) txt(ctx, `Forush: ${num(totalToman / 1_000_000)}M T`, SZ / 2, barY + 60, 26, '#34d399', 'center');

  watermark(ctx, SZ, H);
  dl(canvas, `stats-${person.firstName}.png`);
}

// ── Top 10 sales (by toman) ───────────────────────────────────────────────────

export async function exportTopTenSalesImage(
  data: { person: Person; totalSales: number; count: number }[]
): Promise<void> {
  await ensureFonts();
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, SZ, SZ, 'green');

  rr(ctx, 0, 0, SZ, 130, 0, 'rgba(16,185,129,0.15)');
  txt(ctx, '💰', 80, 65, 52, '#10b981', 'left');
  txt(ctx, 'Top 10 Sales', SZ / 2 + 10, 48, 46, '#f8fafc', 'center', '700');
  txt(ctx, getTodayJalali(), SZ / 2 + 10, 98, 28, '#94a3b8', 'center');

  divider(ctx, 130, SZ, '#10b981');

  const rowH = 88, startY = 142;
  data.slice(0, 10).forEach((d, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const badge = RANK_BADGES[rank] ?? '';
    const rowBg =
      rank === 1 ? 'rgba(16,185,129,0.18)' :
      rank <= 3  ? 'rgba(16,185,129,0.10)' :
      i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    rr(ctx, 50, y + 3, SZ - 100, rowH - 6, 14, rowBg);

    const rankColor = rank === 1 ? '#10b981' : rank <= 3 ? '#34d399' : '#64748b';
    txt(ctx, badge || String(rank), 110, y + rowH / 2, rank <= 3 ? 32 : 24, rankColor, 'center', '700');

    const name = `${d.person.firstName} ${d.person.lastName}`;
    txt(ctx, name, SZ - 155, y + rowH / 2 - 12, 30, rank <= 3 ? '#f1f5f9' : '#cbd5e1', 'right', rank <= 3 ? '700' : '400');
    txt(ctx, `${num(d.totalSales / 1_000_000)}M T`, SZ - 155, y + rowH / 2 + 14, 22, '#34d399', 'right');
  });

  watermark(ctx, SZ, SZ);
  dl(canvas, 'top10-sales.png');
}

// ── Web Share API / download fallback ─────────────────────────────────────────

export async function shareCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  text: string
): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(); return; }
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); } catch { /* cancelled */ }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      resolve();
    }, 'image/png');
  });
}
