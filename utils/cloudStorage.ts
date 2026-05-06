import { supabase, isCloudEnabled } from '../services/supabase';
import { Person, OrgEvent, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// ── Type maps (app camelCase ↔ Supabase snake_case) ───────────────────────

interface DbPerson {
  id: string;
  first_name: string;
  last_name: string;
  team: string;
  is_active: boolean;
  created_at: string;
}

interface DbEvent {
  id: string;
  person_id: string;
  type: string;
  raw_value: number;
  pv: number | null;
  score: number;
  date: string;
  created_at: string;
  note: string | null;
}

interface DbSettings {
  id: string;
  coefficients: Record<string, number>;
  pv_per_million: number;
  prizes?: { weekly: Record<number, number>; monthly: Record<number, number> };
}

function personToDb(p: Person): DbPerson {
  return {
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    team: p.team,
    is_active: p.isActive,
    created_at: p.createdAt,
  };
}

function dbToPerson(r: DbPerson): Person {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    team: r.team,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function eventToDb(e: OrgEvent): DbEvent {
  return {
    id: e.id,
    person_id: e.personId,
    type: e.type,
    raw_value: e.rawValue,
    pv: e.pv ?? null,
    score: e.score,
    date: e.date,
    created_at: e.createdAt,
    note: e.note ?? null,
  };
}

function dbToEvent(r: DbEvent): OrgEvent {
  return {
    id: r.id,
    personId: r.person_id,
    type: r.type as OrgEvent['type'],
    rawValue: r.raw_value,
    pv: r.pv ?? undefined,
    score: r.score,
    date: r.date,
    createdAt: r.created_at,
    note: r.note ?? undefined,
  };
}

// ── Load all data ──────────────────────────────────────────────────────────

export interface CloudData {
  people: Person[];
  events: OrgEvent[];
  settings: AppSettings | null;
}

export async function loadAllFromCloud(): Promise<CloudData | null> {
  if (!isCloudEnabled || !supabase) return null;

  const [peopleRes, eventsRes, settingsRes] = await Promise.all([
    supabase.from('people').select('*').order('created_at'),
    supabase.from('org_events').select('*').order('created_at'),
    supabase.from('settings').select('*').eq('id', 'default').maybeSingle(),
  ]);

  if (peopleRes.error || eventsRes.error) {
    throw new Error(peopleRes.error?.message ?? eventsRes.error?.message);
  }

  const settings: AppSettings | null = settingsRes.data
    ? {
        coefficients: {
          ...DEFAULT_SETTINGS.coefficients,
          ...(settingsRes.data as DbSettings).coefficients,
        },
        pvPerMillion: (settingsRes.data as DbSettings).pv_per_million,
        prizes: {
          weekly:  { ...DEFAULT_SETTINGS.prizes.weekly,  ...((settingsRes.data as DbSettings).prizes?.weekly  ?? {}) },
          monthly: { ...DEFAULT_SETTINGS.prizes.monthly, ...((settingsRes.data as DbSettings).prizes?.monthly ?? {}) },
        },
      }
    : null;

  return {
    people: ((peopleRes.data ?? []) as DbPerson[]).map(dbToPerson),
    events: ((eventsRes.data ?? []) as DbEvent[]).map(dbToEvent),
    settings,
  };
}

// ── People ─────────────────────────────────────────────────────────────────

export async function cloudUpsertPerson(person: Person): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const { error } = await supabase.from('people').upsert(personToDb(person));
  if (error) throw new Error(error.message);
}

// ── Events ─────────────────────────────────────────────────────────────────

export async function cloudUpsertEvent(event: OrgEvent): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const { error } = await supabase.from('org_events').upsert(eventToDb(event));
  if (error) throw new Error(error.message);
}

export async function cloudDeleteEvent(id: string): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const { error } = await supabase.from('org_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function cloudSaveSettings(settings: AppSettings): Promise<void> {
  if (!isCloudEnabled || !supabase) return;
  const row: DbSettings = {
    id: 'default',
    coefficients: settings.coefficients as Record<string, number>,
    pv_per_million: settings.pvPerMillion,
    prizes: settings.prizes,
  };
  const { error } = await supabase.from('settings').upsert(row);
  if (error) throw new Error(error.message);
}
