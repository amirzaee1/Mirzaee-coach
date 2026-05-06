import React, { useState, useCallback, useEffect } from 'react';
import { Person, OrgEvent, AppSettings, Screen, TopTenPeriod, NavParams } from './types';
import { getPeople, getEvents, getSettings, addRecentId, savePeople, saveEvents, saveSettings } from './utils/storage';
import { loadAllFromCloud, cloudUpsertPerson, cloudUpsertEvent, cloudDeleteEvent, cloudSaveSettings } from './utils/cloudStorage';
import { isCloudEnabled } from './services/supabase';
import Dashboard from './components/Dashboard';
import PersonProfile from './components/PersonProfile';
import AddEditPerson from './components/AddEditPerson';
import Rankings from './components/Rankings';
import TopTen from './components/TopTen';
import NightlyReport from './components/NightlyReport';
import AIMessage from './components/AIMessage';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';

export interface AppNav {
  go: (screen: Screen, params?: NavParams) => void;
  back: () => void;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(() => getPeople());
  const [events, setEvents] = useState<OrgEvent[]>(() => getEvents());
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [navParams, setNavParams] = useState<NavParams>({});
  const [history, setHistory] = useState<{ screen: Screen; params: NavParams }[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Persist to localStorage on every state change
  useEffect(() => { savePeople(people); }, [people]);
  useEffect(() => { saveEvents(events); }, [events]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Load from Supabase on startup (once)
  useEffect(() => {
    if (!isCloudEnabled || cloudLoaded) return;
    setSyncStatus('syncing');
    loadAllFromCloud()
      .then((data) => {
        if (data) {
          if (data.people.length > 0 || data.events.length > 0) {
            setPeople(data.people);
            setEvents(data.events);
          }
          if (data.settings) setSettings(data.settings);
        }
        setSyncStatus('synced');
        setCloudLoaded(true);
      })
      .catch(() => {
        setSyncStatus('error');
        setCloudLoaded(true);
      });
  }, [cloudLoaded]);

  // Navigation
  const go = useCallback((nextScreen: Screen, params: NavParams = {}) => {
    setHistory((h) => [...h, { screen, params: navParams }]);
    setScreen(nextScreen);
    setNavParams(params);
    window.scrollTo(0, 0);
  }, [screen, navParams]);

  const back = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setScreen(prev.screen);
      setNavParams(prev.params);
    } else {
      setScreen('dashboard');
      setNavParams({});
      setHistory([]);
    }
    window.scrollTo(0, 0);
  }, [history]);

  const nav: AppNav = { go, back };

  // Cloud sync helpers
  const syncCloud = useCallback(async (fn: () => Promise<void>) => {
    if (!isCloudEnabled) return;
    setSyncStatus('syncing');
    try {
      await fn();
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  // CRUD handlers — update local state + push to cloud
  const handleSavePerson = useCallback((person: Person) => {
    setPeople((prev) => {
      const idx = prev.findIndex((p) => p.id === person.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = person;
        return next;
      }
      return [...prev, person];
    });
    syncCloud(() => cloudUpsertPerson(person));
  }, [syncCloud]);

  const handleAddEvent = useCallback((event: OrgEvent) => {
    setEvents((prev) => [...prev, event]);
    addRecentId(event.personId);
    syncCloud(() => cloudUpsertEvent(event));
  }, [syncCloud]);

  const handleUpdateEvent = useCallback((event: OrgEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    syncCloud(() => cloudUpsertEvent(event));
  }, [syncCloud]);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    syncCloud(() => cloudDeleteEvent(id));
  }, [syncCloud]);

  const handleDeletePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setEvents((prev) => prev.filter((e) => e.personId !== id));
    syncCloud(async () => {
      // soft approach: mark deleted locally; Supabase row left for now
    });
  }, [syncCloud]);

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    syncCloud(() => cloudSaveSettings(s));
  }, [syncCloud]);

  const goToMainScreen = useCallback((s: Screen) => {
    setHistory([]);
    setScreen(s);
    setNavParams({});
    window.scrollTo(0, 0);
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard people={people} events={events} nav={nav} syncStatus={syncStatus} />;
      case 'person-profile':
        return (
          <PersonProfile
            personId={navParams.personId ?? ''}
            people={people}
            events={events}
            settings={settings}
            nav={nav}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onSavePerson={handleSavePerson}
            onDeletePerson={handleDeletePerson}
          />
        );
      case 'add-person':
        return <AddEditPerson existingPerson={null} nav={nav} onSave={handleSavePerson} />;
      case 'edit-person':
        return (
          <AddEditPerson
            existingPerson={people.find((p) => p.id === navParams.personId) ?? null}
            nav={nav}
            onSave={handleSavePerson}
          />
        );
      case 'rankings':
        return <Rankings people={people} events={events} nav={nav} />;
      case 'top-ten':
        return (
          <TopTen
            people={people}
            events={events}
            period={(navParams.topTenPeriod as TopTenPeriod) ?? 'week'}
            settings={settings}
            nav={nav}
          />
        );
      case 'nightly-report':
        return <NightlyReport people={people} events={events} settings={settings} nav={nav} />;
      case 'ai-message':
        return <AIMessage people={people} events={events} nav={nav} />;
      case 'settings':
        return <Settings settings={settings} onSave={handleSaveSettings} nav={nav} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', Tahoma, sans-serif" }}
    >
      <div className="max-w-lg mx-auto min-h-screen flex flex-col pb-20">
        {renderScreen()}
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50">
        <BottomNav current={screen} onNavigate={goToMainScreen} />
      </div>
    </div>
  );
};

export default App;
