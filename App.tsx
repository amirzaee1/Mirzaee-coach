import React, { useState, useCallback, useEffect } from 'react';
import { Person, OrgEvent, AppSettings, Screen, TopTenPeriod, NavParams } from './types';
import { getPeople, getEvents, getSettings, addRecentId } from './utils/storage';
import Dashboard from './components/Dashboard';
import PersonProfile from './components/PersonProfile';
import AddEditPerson from './components/AddEditPerson';
import Rankings from './components/Rankings';
import TopTen from './components/TopTen';
import NightlyReport from './components/NightlyReport';
import AIMessage from './components/AIMessage';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import { savePeople, saveEvents, saveSettings } from './utils/storage';

export interface AppNav {
  go: (screen: Screen, params?: NavParams) => void;
  back: () => void;
}

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(() => getPeople());
  const [events, setEvents] = useState<OrgEvent[]>(() => getEvents());
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [navParams, setNavParams] = useState<NavParams>({});
  const [history, setHistory] = useState<{ screen: Screen; params: NavParams }[]>([]);

  useEffect(() => { savePeople(people); }, [people]);
  useEffect(() => { saveEvents(events); }, [events]);
  useEffect(() => { saveSettings(settings); }, [settings]);

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
  }, []);

  const handleAddEvent = useCallback((event: OrgEvent) => {
    setEvents((prev) => [...prev, event]);
    addRecentId(event.personId);
  }, []);

  const handleUpdateEvent = useCallback((event: OrgEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
  }, []);

  const goToMainScreen = useCallback((s: Screen) => {
    setHistory([]);
    setScreen(s);
    setNavParams({});
    window.scrollTo(0, 0);
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard people={people} events={events} nav={nav} />;
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
            nav={nav}
          />
        );
      case 'nightly-report':
        return <NightlyReport people={people} events={events} nav={nav} />;
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
