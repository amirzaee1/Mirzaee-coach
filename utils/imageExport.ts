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
