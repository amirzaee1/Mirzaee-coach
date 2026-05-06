import { RankedPerson } from '../types';
import { RANK_BADGES, WEEKLY_PRIZES, MONTHLY_PRIZES } from '../constants';
import { getTodayJalali, formatNumber, formatToman } from './date';

const W = 1080;
const H = 1920;
const FONT = 'Vazirmatn, Tahoma, Arial';

function setupCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.direction = 'rtl';
  return [canvas, ctx];
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f0c29');
  grad.addColorStop(0.5, '#1a1040');
  grad.addColorStop(1, '#120024');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // decorative circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.08, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.15, H * 0.92, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  bold = false
) {
  ctx.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

export function exportTopTenImage(ranked: RankedPerson[], period: 'today' | 'week' | 'month'): void {
  const [canvas, ctx] = setupCanvas();
  drawBackground(ctx);

  const periodLabel = period === 'today' ? 'امروز' : period === 'week' ? 'هفته' : 'ماه';
  const prizes = period === 'week' ? WEEKLY_PRIZES : period === 'month' ? MONTHLY_PRIZES : {} as Record<number,number>;
  const date = getTodayJalali();

  // Header
  drawText(ctx, '🏆', W / 2, 120, 80, '#f59e0b', 'center');
  drawText(ctx, `تاپ ۱۰ ${periodLabel}`, W / 2, 210, 72, '#f8fafc', 'center', true);
  drawText(ctx, date, W / 2, 290, 40, '#94a3b8', 'center');

  // divider
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 330);
  ctx.lineTo(W - 80, 330);
  ctx.stroke();

  const top10 = ranked.slice(0, 10);
  const rowH = 148;
  const startY = 380;

  top10.forEach((rp, i) => {
    const rank = i + 1;
    const y = startY + i * rowH;
    const score = period === 'today' ? rp.todayScore : period === 'week' ? rp.weekScore : rp.monthScore;
    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    const badge = RANK_BADGES[rank] ?? '';

    // row bg
    const rowGrad = ctx.createLinearGradient(60, y, W - 60, y);
    if (rank === 1) {
      rowGrad.addColorStop(0, 'rgba(245,158,11,0.25)');
      rowGrad.addColorStop(1, 'rgba(245,158,11,0.05)');
    } else if (rank <= 3) {
      rowGrad.addColorStop(0, 'rgba(124,58,237,0.2)');
      rowGrad.addColorStop(1, 'rgba(124,58,237,0.04)');
    } else {
      rowGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
      rowGrad.addColorStop(1, 'rgba(255,255,255,0.01)');
    }
    ctx.fillStyle = rowGrad;
    ctx.beginPath();
    ctx.roundRect(60, y + 4, W - 120, rowH - 10, 16);
    ctx.fill();

    // rank number
    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    drawText(ctx, badge || String(rank), 150, y + rowH / 2, 44, rankColor, 'center', true);

    // name
    const nameColor = rank === 1 ? '#fef3c7' : rank <= 3 ? '#f1f5f9' : '#e2e8f0';
    drawText(ctx, name, W - 220, y + rowH / 2 - 16, 38, nameColor, 'right', rank === 1);

    // score
    const scoreText = `${formatNumber(score)} امتیاز`;
    drawText(ctx, scoreText, W - 220, y + rowH / 2 + 22, 30, '#a78bfa', 'right');

    // prize
    if (prizes[rank]) {
      drawText(ctx, `💰 ${formatToman(prizes[rank])}`, 240, y + rowH / 2, 28, '#fbbf24', 'left');
    }
  });

  // footer
  const footerY = H - 80;
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, footerY - 20);
  ctx.lineTo(W - 80, footerY - 20);
  ctx.stroke();
  drawText(ctx, '🔥 ادامه بده، رقابت ادامه داره!', W / 2, footerY + 20, 36, '#94a3b8', 'center');

  downloadCanvas(canvas, `top10-${period}.png`);
}

export function exportBestTodayImage(rp: RankedPerson): void {
  const [canvas, ctx] = setupCanvas();

  // Special background for hero card
  const grad = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.4, 800);
  grad.addColorStop(0, '#2d1b69');
  grad.addColorStop(0.6, '#0f0c29');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.35, 500, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();

  drawText(ctx, '👑', W / 2, 280, 120, '#f59e0b', 'center');
  drawText(ctx, 'بیشترین اقدام امروز', W / 2, 440, 62, '#fef3c7', 'center', true);
  drawText(ctx, date, W / 2, 520, 38, '#94a3b8', 'center');

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(200, 570);
  ctx.lineTo(W - 200, 570);
  ctx.stroke();

  drawText(ctx, '🚀', W / 2, 680, 80, '#f59e0b', 'center');
  drawText(ctx, name, W / 2, 800, 80, '#ffffff', 'center', true);

  // score card
  ctx.fillStyle = 'rgba(124,58,237,0.3)';
  ctx.beginPath();
  ctx.roundRect(200, 880, W - 400, 200, 24);
  ctx.fill();
  drawText(ctx, 'امتیاز امروز', W / 2, 930, 40, '#c4b5fd', 'center');
  drawText(ctx, formatNumber(rp.todayScore), W / 2, 1000, 80, '#a855f7', 'center', true);

  if (rp.todayPV > 0) {
    ctx.fillStyle = 'rgba(16,185,129,0.2)';
    ctx.beginPath();
    ctx.roundRect(200, 1110, W - 400, 150, 24);
    ctx.fill();
    drawText(ctx, 'PV امروز', W / 2, 1150, 38, '#6ee7b7', 'center');
    drawText(ctx, formatNumber(rp.todayPV), W / 2, 1210, 65, '#10b981', 'center', true);
  }

  drawText(ctx, `💪 آفرین ${rp.person.firstName}!`, W / 2, 1440, 52, '#fef3c7', 'center', true);
  drawText(ctx, 'الگوی تیم باش!', W / 2, 1520, 44, '#94a3b8', 'center');

  downloadCanvas(canvas, `best-today.png`);
}

// ── Person card (1080×1080 square) ────────────────────────────────────────

export function exportPersonCard(rp: RankedPerson): void {
  const CW = 1080, CH = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;
  ctx.direction = 'rtl';

  // Background
  const grad = ctx.createLinearGradient(0, 0, CW, CH);
  grad.addColorStop(0, '#0f0c29');
  grad.addColorStop(1, '#1a1040');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Decorative glow
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(CW * 0.85, CH * 0.15, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();

  // Rank badge
  const badge = RANK_BADGES[rp.rank];
  if (badge) {
    drawText(ctx, badge, CW / 2, 130, 90, '#f59e0b', 'center');
  } else {
    drawText(ctx, `رتبه ${rp.rank}`, CW / 2, 130, 55, '#a78bfa', 'center', true);
  }

  // Avatar circle
  ctx.fillStyle = rp.rank === 1 ? '#d97706' : '#6d28d9';
  ctx.beginPath();
  ctx.arc(CW / 2, 290, 100, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, rp.person.firstName[0], CW / 2, 293, 90, '#fff', 'center', true);

  // Name
  drawText(ctx, name, CW / 2, 440, 64, '#f8fafc', 'center', true);
  if (rp.person.team) {
    drawText(ctx, rp.person.team, CW / 2, 510, 36, '#94a3b8', 'center');
  }
  drawText(ctx, date, CW / 2, 560, 30, '#64748b', 'center');

  // Divider
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 595);
  ctx.lineTo(CW - 120, 595);
  ctx.stroke();

  // Stats grid (2×2)
  const statsData = [
    { label: 'امتیاز کل', val: formatNumber(rp.totalScore), color: '#a78bfa' },
    { label: 'امتیاز هفته', val: formatNumber(rp.weekScore), color: '#34d399' },
    { label: 'امتیاز امروز', val: formatNumber(rp.todayScore), color: '#fbbf24' },
    { label: 'PV کل', val: formatNumber(rp.totalPV), color: '#60a5fa' },
  ];

  const cellW = (CW - 120) / 2;
  const cellH = 160;
  const startX = 60;
  const startY = 630;

  statsData.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * cellW;
    const y = startY + row * cellH;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, cellW - 16, cellH - 16, 20);
    ctx.fill();

    drawText(ctx, s.val, x + cellW / 2, y + cellH / 2 - 15, 52, s.color, 'center', true);
    drawText(ctx, s.label, x + cellW / 2, y + cellH / 2 + 38, 28, '#94a3b8', 'center');
  });

  // Footer
  drawText(ctx, '🔥 میرزایی کوچ', CW / 2, CH - 40, 30, '#4c1d95', 'center');

  downloadCanvas(canvas, `card-${rp.person.firstName}.png`);
}

// ── Rankings image (all visible ranked people) ────────────────────────────

export function exportRankingsImage(ranked: ReturnType<typeof Array.prototype.slice>, title: string): void {
  const rows = (ranked as RankedPerson[]).slice(0, 20);
  const rowH = 90;
  const headerH = 220;
  const footerH = 80;
  const H_canvas = headerH + rows.length * rowH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = Math.max(H_canvas, 600);
  const ctx = canvas.getContext('2d')!;
  ctx.direction = 'rtl';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0f0c29');
  grad.addColorStop(1, '#120024');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, canvas.height);

  // Header
  drawText(ctx, '🏆', W / 2, 80, 70, '#f59e0b', 'center');
  drawText(ctx, title, W / 2, 155, 56, '#f8fafc', 'center', true);
  drawText(ctx, getTodayJalali(), W / 2, 200, 32, '#94a3b8', 'center');

  // Rows
  rows.forEach((rp, i) => {
    const rank = i + 1;
    const y = headerH + i * rowH;
    const badge = RANK_BADGES[rank];

    // Row bg
    ctx.fillStyle = rank === 1
      ? 'rgba(245,158,11,0.15)'
      : rank <= 3 ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(60, y + 6, W - 120, rowH - 10, 12);
    ctx.fill();

    // Rank
    const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : '#64748b';
    drawText(ctx, badge ?? String(rank), 130, y + rowH / 2, 36, rankColor, 'center', true);

    // Name
    const nameColor = rank <= 3 ? '#f1f5f9' : '#cbd5e1';
    const name = `${(rp as RankedPerson).person.firstName} ${(rp as RankedPerson).person.lastName}`;
    drawText(ctx, name, W - 220, y + rowH / 2, 34, nameColor, 'right', rank <= 3);

    // Score
    drawText(ctx, formatNumber((rp as RankedPerson).totalScore), 250, y + rowH / 2, 34, '#a78bfa', 'left', true);
  });

  // Footer
  drawText(ctx, '🔥 میرزایی کوچ', W / 2, canvas.height - 30, 28, '#4c1d95', 'center');

  downloadCanvas(canvas, 'rankings.png');
}

// ── Share via Web Share API or fall back to download ──────────────────────

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
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      resolve();
    }, 'image/png');
  });
}
