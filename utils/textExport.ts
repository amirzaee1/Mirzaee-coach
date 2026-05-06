import { RankedPerson } from '../types';
import { RANK_BADGES, WEEKLY_PRIZES, MONTHLY_PRIZES } from '../constants';
import { getTodayJalali, formatNumber, formatToman } from './date';

function rankBadge(rank: number): string {
  return RANK_BADGES[rank] ?? `${rank}.`;
}

export function buildTopTenText(ranked: RankedPerson[], period: 'today' | 'week' | 'month'): string {
  const periodLabel = period === 'today' ? 'امروز' : period === 'week' ? 'هفته' : 'ماه';
  const prizes = period === 'week' ? WEEKLY_PRIZES : period === 'month' ? MONTHLY_PRIZES : {};
  const date = getTodayJalali();

  const lines: string[] = [
    `🏆 تاپ ۱۰ ${periodLabel} | ${date}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  ranked.slice(0, 10).forEach((rp, i) => {
    const rank = i + 1;
    const badge = rankBadge(rank);
    const score = period === 'today' ? rp.todayScore : period === 'week' ? rp.weekScore : rp.monthScore;
    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    const prizeStr = prizes[rank] ? ` 💰 ${formatToman(prizes[rank])}` : '';
    lines.push(`${badge} ${name} — ${formatNumber(score)} امتیاز${prizeStr}`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔥 ادامه بده، رقابت ادامه داره!`);

  return lines.join('\n');
}

export function buildBestTodayText(rp: RankedPerson): string {
  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const date = getTodayJalali();
  return [
    `👑 بیشترین اقدام امروز | ${date}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🚀 ${name}`,
    `امتیاز امروز: ${formatNumber(rp.todayScore)}`,
    rp.todayPV > 0 ? `PV امروز: ${formatNumber(rp.todayPV)}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💪 آفرین ${rp.person.firstName}! الگوی تیم باش!`,
  ].filter(Boolean).join('\n');
}

export function buildPersonCardText(rp: RankedPerson): string {
  const name = `${rp.person.firstName} ${rp.person.lastName}`;
  const badge = RANK_BADGES[rp.rank] ?? `رتبه ${rp.rank}`;
  const date = getTodayJalali();
  const lines = [
    `${badge} ${name}`,
    rp.person.team ? `تیم: ${rp.person.team}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `امتیاز کل: ${formatNumber(rp.totalScore)}`,
    `امتیاز هفته: ${formatNumber(rp.weekScore)}`,
    `امتیاز امروز: ${formatNumber(rp.todayScore)}`,
    rp.totalPV > 0 ? `PV کل: ${formatNumber(rp.totalPV)}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📅 ${date}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export function buildRankingsText(ranked: RankedPerson[], title: string): string {
  const date = getTodayJalali();
  const lines: string[] = [
    `🏆 ${title} | ${date}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ];
  ranked.slice(0, 20).forEach((rp, i) => {
    const rank = i + 1;
    const badge = RANK_BADGES[rank] ?? `${rank}.`;
    const name = `${rp.person.firstName} ${rp.person.lastName}`;
    lines.push(`${badge} ${name} — ${formatNumber(rp.totalScore)} امتیاز`);
  });
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  return lines.join('\n');
}

export function buildNightlyReportText(
  topWeek: RankedPerson[],
  bestToday: RankedPerson | null
): string {
  const weekText = buildTopTenText(topWeek, 'week');
  const todayText = bestToday ? '\n\n' + buildBestTodayText(bestToday) : '';
  return weekText + todayText;
}
