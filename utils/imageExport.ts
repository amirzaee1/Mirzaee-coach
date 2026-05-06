import { RankedPerson, AppSettings } from '../types';
import { RANK_BADGES } from '../constants';
import { getTodayJalali, formatNumber, formatToman } from './date';

const SZ = 1080; // all images are 1080×1080
const FONT = 'Vazirmatn, Tahoma, Arial';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SZ;
  c.height = SZ;
  const ctx = c.getContext('2d')!;
  ctx.direction = 'rtl';
  return [c, ctx];
}

function drawBg(ctx: CanvasRenderingContext2D, style: 'dark' | 'gold' | 'green' = 'dark') {
  let g: CanvasGradient;
  if (style === 'gold') {
    g = ctx.createLinearGradient(0, 0, SZ, SZ);
    g.addColorStop(0, '#1c0f00');
    g.addColorStop(0.6, '#2d1a00');
    g.addColorStop(1, '#0f0900');
  } else if (style === 'green') {
    g = ctx.createLinearGradient(0, 0, SZ, SZ);
    g.addColorStop(0, '#001a10');
    g.addColorStop(0.6, '#00261a');
    g.addColorStop(1, '#001208');
  } else {
    g = ctx.createLinearGradient(0, 0, SZ, SZ);
    g.addColorStop(0, '#0d0b1e');
    g.addColorStop(0.5, '#130f2e');
    g.addColorStop(1, '#0a0818');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SZ, SZ);

  // subtle grid pattern
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let x = 0; x <= SZ; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke();
  }
  for (let y = 0; y <= SZ; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // glow circles
  ctx.globalAlpha = 0.10;
  const accent = style === 'gold' ? '#f59e0b' : style === 'green' ? '#10b981' : '#7c3aed';
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(SZ * 0.85, SZ * 0.12, 260, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(SZ * 0.15, SZ * 0.88, 200, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function txt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight: '400' | '700' = '400'
) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string, strokeColor?: string
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function divider(ctx: CanvasRenderingContext2D, y: number, color = '#7c3aed', alpha = 0.5) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(SZ - 80, y); ctx.stroke();
  ctx.globalAlpha = 1;
}

function watermark(ctx: CanvasRenderingContext2D) {
  txt(ctx, '🔥 میرزایی کوچ', SZ / 2, SZ - 36, 26, '#ffffff', 'center', '700');
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath(); ctx.roundRect(SZ / 2 - 120, SZ - 56, 240, 40, 20); ctx.fill();
  ctx.globalAlpha = 1;
}

function download(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

// ── Top 10 — 1080×1080 ───────────────────────────────────────────────────────

export function exportTopTenImage(
  ranked: RankedPerson[],
  period: 'today' | 'week' | 'month',
  settings?: AppSettings
): void {
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, 'dark');

  const periodLabel = period === 'today' ? 'امروز' : period === 'week' ? 'هفته' : 'ماه';
  const prizes =
    period === 'week'  ? (settings?.prizes.weekly  ?? {}) :
    period === 'month' ? (settings?.prizes.monthly ?? {}) :
    {} as Record<number, number>;
  const date = getTodayJalali();
  const top10 = ranked.slice(0, 10);

  // Header band
  roundRect(ctx, 0, 0, SZ, 130, 0, 'rgba(124,58,237,0.18)');
  txt(ctx, '🏆', 80, 65, 52, '#f59e0b', 'left');
  txt(ctx, `تاپ ۱۰ ${periodLabel}`, SZ / 2 + 10, 55, 52, '#f8fafc', 'center', '700');
  txt(ctx, date, SZ / 2 + 10, 100, 28, '#94a3b8', 'center');

  divider(ctx, 130);

  // Rows — 10 rows, each ~88px tall starting at y=140
  const rowH = 88;
  const startY = 140;

  top10.forEach((rp, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const score = period === 'today' ? rp.todayScore : period === 'week' ? rp.weekScore : rp.monthScore;
    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    const badge = RANK_BADGES[rank] ?? '';

    // row bg
    const rowBg =
      rank === 1 ? 'rgba(245,158,11,0.18)' :
      rank <= 3  ? 'rgba(124,58,237,0.14)' :
      i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    roundRect(ctx, 50, y + 3, SZ - 100, rowH - 6, 14, rowBg);

    // rank
    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    txt(ctx, badge || String(rank), 110, y + rowH / 2, rank <= 3 ? 32 : 26, rankColor, 'center', '700');

    // name
    const nameColor = rank === 1 ? '#fef3c7' : rank <= 3 ? '#f1f5f9' : '#cbd5e1';
    txt(ctx, name, SZ - 160, y + rowH / 2 - (prizes[rank] ? 12 : 0), 30, nameColor, 'right', rank <= 3 ? '700' : '400');

    // score
    txt(ctx, `${formatNumber(score)} امتیاز`, SZ - 160, y + rowH / 2 + (prizes[rank] ? 14 : 0), 22, '#a78bfa', 'right');

    // prize badge
    if (prizes[rank]) {
      roundRect(ctx, 140, y + rowH / 2 - 18, 160, 36, 18, 'rgba(245,158,11,0.15)');
      txt(ctx, `💰 ${formatToman(prizes[rank])}`, 222, y + rowH / 2, 20, '#fbbf24', 'center');
    }
  });

  watermark(ctx);
  download(canvas, `top10-${period}.png`);
}

// ── Best Today hero card — 1080×1080 ─────────────────────────────────────────

export function exportBestTodayImage(rp: RankedPerson): void {
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, 'gold');

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();

  // Crown glow
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(SZ / 2, 310, 300, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  txt(ctx, '👑', SZ / 2, 160, 100, '#f59e0b');
  txt(ctx, 'بیشترین اقدام امروز', SZ / 2, 270, 46, '#fef3c7', 'center', '700');
  txt(ctx, date, SZ / 2, 325, 30, '#92400e', 'center');

  divider(ctx, 360, '#f59e0b', 0.6);

  // Avatar circle
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.arc(SZ / 2, 460, 90, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(SZ / 2, 460, 90, 0, Math.PI * 2); ctx.stroke();
  txt(ctx, rp.person.firstName[0], SZ / 2, 465, 80, '#fff', 'center', '700');

  txt(ctx, name, SZ / 2, 590, 58, '#ffffff', 'center', '700');
  if (rp.person.team) txt(ctx, rp.person.team, SZ / 2, 645, 30, '#a16207', 'center');

  // Score card
  roundRect(ctx, 140, 685, SZ - 280, 140, 24, 'rgba(245,158,11,0.2)', '#f59e0b');
  txt(ctx, 'امتیاز امروز', SZ / 2, 730, 30, '#fde68a', 'center');
  txt(ctx, formatNumber(rp.todayScore), SZ / 2, 790, 72, '#f59e0b', 'center', '700');

  // PV badge if any
  if (rp.todayPV > 0) {
    roundRect(ctx, 280, 845, SZ - 560, 60, 30, 'rgba(16,185,129,0.2)', '#10b981');
    txt(ctx, `PV: ${formatNumber(rp.todayPV)}`, SZ / 2, 875, 28, '#6ee7b7', 'center', '700');
  }

  txt(ctx, `💪 آفرین ${rp.person.firstName}! الگوی تیم باش`, SZ / 2, 970, 30, '#fef3c7', 'center', '700');

  watermark(ctx);
  download(canvas, 'best-today.png');
}

// ── Person card — 1080×1080 ───────────────────────────────────────────────────

export function exportPersonCard(rp: RankedPerson): void {
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, rp.rank === 1 ? 'gold' : 'dark');

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();
  const badge = RANK_BADGES[rp.rank];
  const accentColor = rp.rank === 1 ? '#f59e0b' : rp.rank <= 3 ? '#a78bfa' : '#64748b';

  // Top bar
  roundRect(ctx, 0, 0, SZ, 110, 0, 'rgba(255,255,255,0.04)');
  txt(ctx, badge ? `${badge} رتبه ${rp.rank}` : `رتبه ${rp.rank}`, SZ / 2, 55, 44, accentColor, 'center', '700');
  txt(ctx, date, SZ - 60, 55, 24, '#475569', 'right');

  divider(ctx, 110, accentColor);

  // Avatar
  ctx.fillStyle = rp.rank === 1 ? '#92400e' : '#4c1d95';
  ctx.beginPath(); ctx.arc(SZ / 2, 250, 100, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(SZ / 2, 250, 100, 0, Math.PI * 2); ctx.stroke();
  txt(ctx, rp.person.firstName[0], SZ / 2, 255, 85, '#fff', 'center', '700');

  txt(ctx, name, SZ / 2, 390, 56, '#f8fafc', 'center', '700');
  if (rp.person.team) txt(ctx, rp.person.team, SZ / 2, 445, 30, '#94a3b8', 'center');

  divider(ctx, 480, accentColor, 0.4);

  // Stats 2×2 grid
  const stats = [
    { label: 'امتیاز کل',   val: formatNumber(rp.totalScore), color: '#a78bfa' },
    { label: 'امتیاز هفته', val: formatNumber(rp.weekScore),  color: '#34d399' },
    { label: 'امتیاز امروز',val: formatNumber(rp.todayScore), color: '#fbbf24' },
    { label: 'PV کل',        val: formatNumber(rp.totalPV),   color: '#60a5fa' },
  ];

  const cellW = (SZ - 100) / 2;
  const cellH = 160;
  const gx = 50, gy = 500;

  stats.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * cellW, y = gy + row * cellH;
    roundRect(ctx, x + 8, y + 8, cellW - 16, cellH - 16, 20, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.07)');
    txt(ctx, s.val, x + cellW / 2, y + cellH / 2 - 16, 46, s.color, 'center', '700');
    txt(ctx, s.label, x + cellW / 2, y + cellH / 2 + 32, 24, '#94a3b8', 'center');
  });

  watermark(ctx);
  download(canvas, `card-${rp.person.firstName}.png`);
}

// ── Rankings image — 1080×1080 ────────────────────────────────────────────────

export function exportRankingsImage(
  ranked: RankedPerson[],
  title: string
): void {
  const [canvas, ctx] = makeCanvas();
  drawBg(ctx, 'dark');

  const rows = ranked.slice(0, 10);

  // Header
  roundRect(ctx, 0, 0, SZ, 120, 0, 'rgba(124,58,237,0.18)');
  txt(ctx, '🏆', 80, 60, 48, '#f59e0b', 'left');
  txt(ctx, title, SZ / 2 + 20, 50, 46, '#f8fafc', 'center', '700');
  txt(ctx, getTodayJalali(), SZ / 2 + 20, 93, 26, '#94a3b8', 'center');

  divider(ctx, 120);

  const rowH = 90;
  const startY = 132;

  rows.forEach((rp, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const badge = RANK_BADGES[rank];

    const rowBg =
      rank === 1 ? 'rgba(245,158,11,0.15)' :
      rank <= 3  ? 'rgba(124,58,237,0.12)' :
      i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    roundRect(ctx, 50, y + 4, SZ - 100, rowH - 8, 14, rowBg);

    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    txt(ctx, badge ?? String(rank), 108, y + rowH / 2, rank <= 3 ? 32 : 24, rankColor, 'center', '700');

    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    const nameColor = rank <= 3 ? '#f1f5f9' : '#cbd5e1';
    txt(ctx, name, SZ - 160, y + rowH / 2 - 12, 28, nameColor, 'right', rank <= 3 ? '700' : '400');
    txt(ctx, `${formatNumber(rp.totalScore)} امتیاز`, SZ - 160, y + rowH / 2 + 14, 22, '#a78bfa', 'right');
  });

  watermark(ctx);
  download(canvas, 'rankings.png');
}

// ── Web Share API / download fallback ────────────────────────────────────────

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
