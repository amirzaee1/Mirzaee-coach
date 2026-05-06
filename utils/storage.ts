import { Person, OrgEvent, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  PEOPLE: 'org_people',
  EVENTS: 'org_events',
  SETTINGS: 'org_settings',
  RECENT: 'org_recent_ids',
};

// People
export function getPeople(): Person[] {
  try {
    const raw = localStorage.getItem(KEYS.PEOPLE);
    return raw ? (JSON.parse(raw) as Person[]) : [];
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]): void {
  localStorage.setItem(KEYS.PEOPLE, JSON.stringify(people));
}

export function addPerson(person: Person): void {
  const people = getPeople();
  people.push(person);
  savePeople(people);
}

export function updatePerson(updated: Person): void {
  const people = getPeople();
  const idx = people.findIndex((p) => p.id === updated.id);
  if (idx >= 0) {
    people[idx] = updated;
    savePeople(people);
  }
}

// Events
export function getEvents(): OrgEvent[] {
  try {
    const raw = localStorage.getItem(KEYS.EVENTS);
    return raw ? (JSON.parse(raw) as OrgEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: OrgEvent[]): void {
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
}

export function addEvent(event: OrgEvent): void {
  const events = getEvents();
  events.push(event);
  saveEvents(events);
}

export function updateEvent(updated: OrgEvent): void {
  const events = getEvents();
  const idx = events.findIndex((e) => e.id === updated.id);
  if (idx >= 0) {
    events[idx] = updated;
    saveEvents(events);
  }
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter((e) => e.id !== id);
  saveEvents(events);
}

export function getPersonEvents(personId: string): OrgEvent[] {
  return getEvents().filter((e) => e.personId === personId);
}

// Settings
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as AppSettings;
    return { ...DEFAULT_SETTINGS, ...parsed, coefficients: { ...DEFAULT_SETTINGS.coefficients, ...parsed.coefficients } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Recent people
export function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.RECENT);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentId(id: string): void {
  const ids = getRecentIds().filter((i) => i !== id);
  ids.unshift(id);
  localStorage.setItem(KEYS.RECENT, JSON.stringify(ids.slice(0, 10)));
}
