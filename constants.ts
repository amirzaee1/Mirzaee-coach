import { AppSettings, EventType } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  coefficients: {
    meeting_attendance: 1,
    personal_purchase: 3,
    presentation: 3,
    new_member_score: 3,
    level_up: 10,
    agha_mohammad_meeting: 3,
  },
  pvPerMillion: 1,
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting_attendance: 'حضور در جلسه',
  personal_purchase: 'خرید شخصی',
  presentation: 'پرزنت / معارفه',
  new_member_score: 'امتیاز ورودی جدید',
  level_up: 'لول آپ',
  agha_mohammad_meeting: 'جلسه آقا محمد',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  meeting_attendance: '📋',
  personal_purchase: '🛒',
  presentation: '🎤',
  new_member_score: '👥',
  level_up: '⬆️',
  agha_mohammad_meeting: '🤝',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting_attendance: 'bg-blue-500',
  personal_purchase: 'bg-emerald-500',
  presentation: 'bg-purple-500',
  new_member_score: 'bg-orange-500',
  level_up: 'bg-red-500',
  agha_mohammad_meeting: 'bg-yellow-500',
};

export const WEEKLY_PRIZES: Record<number, number> = {
  1: 1_000_000,
  2: 700_000,
  3: 500_000,
};

export const MONTHLY_PRIZES: Record<number, number> = {
  1: 2_000_000,
};

export const RANK_BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export const GEMINI_MODEL = 'gemini-2.0-flash';
