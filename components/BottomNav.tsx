import React from 'react';
import { Screen } from '../types';

interface Tab {
  screen: Screen;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { screen: 'dashboard', label: 'داشبورد', icon: '🏠' },
  { screen: 'rankings', label: 'رتبه‌بندی', icon: '🏆' },
  { screen: 'nightly-report', label: 'گزارش', icon: '📊' },
  { screen: 'ai-message', label: 'پیام AI', icon: '✨' },
  { screen: 'settings', label: 'تنظیمات', icon: '⚙️' },
];

interface Props {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav: React.FC<Props> = ({ current, onNavigate }) => {
  return (
    <nav className="bg-slate-900 border-t border-slate-800 flex items-center justify-around py-2 safe-area-bottom">
      {TABS.map((tab) => {
        const active =
          tab.screen === current ||
          (tab.screen === 'rankings' && (current === 'top-ten' || current === 'rankings')) ||
          (tab.screen === 'dashboard' && (current === 'person-profile' || current === 'add-person' || current === 'edit-person'));
        return (
          <button
            key={tab.screen}
            onClick={() => onNavigate(tab.screen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              active ? 'text-violet-400' : 'text-slate-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs ${active ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
            {active && <div className="w-1 h-1 rounded-full bg-violet-400 mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
