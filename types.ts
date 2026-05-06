export type EventType =
  | 'meeting_attendance'
  | 'personal_purchase'
  | 'presentation'
  | 'new_member_score'
  | 'level_up'
  | 'agha_mohammad_meeting';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  isActive: boolean;
  createdAt: string;
}

export interface OrgEvent {
  id: string;
  personId: string;
  type: EventType;
  rawValue: number;
  pv?: number;
  score: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
  note?: string;
}

export interface PersonStats {
  person: Person;
  totalScore: number;
  todayScore: number;
  weekScore: number;
  monthScore: number;
  totalPV: number;
  todayPV: number;
  weekPV: number;
  monthPV: number;
  eventCount: number;
}

export interface RankedPerson extends PersonStats {
  rank: number;
  todayRank: number;
  weekRank: number;
  monthRank: number;
}

export type Screen =
  | 'dashboard'
  | 'person-profile'
  | 'add-person'
  | 'edit-person'
  | 'rankings'
  | 'top-ten'
  | 'nightly-report'
  | 'ai-message'
  | 'settings';

export type TopTenPeriod = 'today' | 'week' | 'month';
export type SortBy = 'total' | 'today' | 'week' | 'month';

export interface Prizes {
  weekly: Record<number, number>;   // rank → amount in tomans
  monthly: Record<number, number>;
}

export interface AppSettings {
  coefficients: Record<EventType, number>;
  pvPerMillion: number;
  prizes: Prizes;
}

export interface NavParams {
  personId?: string;
  topTenPeriod?: TopTenPeriod;
  returnTo?: Screen;
}
