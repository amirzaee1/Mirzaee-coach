import { OrgEvent, Person, PersonStats, RankedPerson, SortBy, AppSettings, EventType } from '../types';
import { getTodayDate, getWeekStart, getMonthStart } from './date';

export function calculateEventScore(
  type: EventType,
  rawValue: number,
  settings: AppSettings
): { score: number; pv?: number } {
  const coeff = settings.coefficients[type];
  // Both personal_purchase and new_member_score use PV model:
  // amount (tomans) → PV = amount / 1_000_000 → score = PV × coeff
  if (type === 'personal_purchase' || type === 'new_member_score') {
    const pv = rawValue / 1_000_000;
    return { score: pv * coeff, pv };
  }
  if (type === 'meeting_attendance') {
    return { score: coeff };
  }
  return { score: rawValue * coeff };
}

export function getPersonStats(person: Person, events: OrgEvent[]): PersonStats {
  const personEvents = events.filter((e) => e.personId === person.id);
  const today = getTodayDate();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  let totalScore = 0, todayScore = 0, weekScore = 0, monthScore = 0;
  let totalPV = 0, todayPV = 0, weekPV = 0, monthPV = 0;

  for (const ev of personEvents) {
    totalScore += ev.score;
    if (ev.pv) totalPV += ev.pv;
    if (ev.date === today) {
      todayScore += ev.score;
      if (ev.pv) todayPV += ev.pv;
    }
    if (ev.date >= weekStart) {
      weekScore += ev.score;
      if (ev.pv) weekPV += ev.pv;
    }
    if (ev.date >= monthStart) {
      monthScore += ev.score;
      if (ev.pv) monthPV += ev.pv;
    }
  }

  return {
    person,
    totalScore,
    todayScore,
    weekScore,
    monthScore,
    totalPV,
    todayPV,
    weekPV,
    monthPV,
    eventCount: personEvents.length,
  };
}

function sortScoreBy(stats: PersonStats[], by: SortBy): PersonStats[] {
  return [...stats].sort((a, b) => {
    const score = (s: PersonStats) =>
      by === 'today' ? s.todayScore : by === 'week' ? s.weekScore : by === 'month' ? s.monthScore : s.totalScore;
    return score(b) - score(a);
  });
}

export function getRankedPeople(
  people: Person[],
  events: OrgEvent[],
  sortBy: SortBy = 'total',
  onlyActive = true
): RankedPerson[] {
  const filtered = onlyActive ? people.filter((p) => p.isActive) : people;
  const stats = filtered.map((p) => getPersonStats(p, events));

  const totalOrder = sortScoreBy(stats, 'total');
  const todayOrder = sortScoreBy(stats, 'today');
  const weekOrder = sortScoreBy(stats, 'week');
  const monthOrder = sortScoreBy(stats, 'month');

  const rankOf = (arr: PersonStats[], id: string) => arr.findIndex((s) => s.person.id === id) + 1;

  const sorted = sortScoreBy(stats, sortBy);
  return sorted.map((s) => ({
    ...s,
    rank: rankOf(totalOrder, s.person.id),
    todayRank: rankOf(todayOrder, s.person.id),
    weekRank: rankOf(weekOrder, s.person.id),
    monthRank: rankOf(monthOrder, s.person.id),
  }));
}

export function getTopTen(
  people: Person[],
  events: OrgEvent[],
  period: 'today' | 'week' | 'month'
): RankedPerson[] {
  return getRankedPeople(people, events, period).slice(0, 10);
}

export function getTopTenSales(
  people: Person[],
  events: OrgEvent[]
): { person: Person; totalSales: number; count: number }[] {
  return people
    .filter((p) => p.isActive)
    .map((p) => {
      const pe = events.filter(
        (e) => e.personId === p.id && (e.type === 'personal_purchase' || e.type === 'new_member_score')
      );
      return { person: p, totalSales: pe.reduce((s, e) => s + e.rawValue, 0), count: pe.length };
    })
    .filter((x) => x.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10);
}

export function getBestToday(people: Person[], events: OrgEvent[]): RankedPerson | null {
  const ranked = getRankedPeople(people, events, 'today');
  const best = ranked[0];
  return best && best.todayScore > 0 ? best : null;
}
