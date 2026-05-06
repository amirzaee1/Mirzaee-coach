import React, { useState, useMemo } from 'react';
import { Person, OrgEvent } from '../types';
import { AppNav, SyncStatus } from '../App';
import { getRankedPeople, getBestToday } from '../utils/scoring';
import { getRecentIds } from '../utils/storage';
import { isCloudEnabled } from '../services/supabase';
import { getTodayDate, getWeekStart, getMonthStart, formatNumber, formatJalaliDate } from '../utils/date';

interface Props {
  people: Person[];
  events: OrgEvent[];
  nav: AppNav;
  syncStatus: SyncStatus;
}

function SyncBadge({ status }: { status: SyncStatus }) {
  if (!isCloudEnabled) return null;
  const cfg = {
    idle:    { text: 'آفلاین', cls: 'text-slate-500', dot: 'bg-slate-600' },
    syncing: { text: 'در حال همگام‌سازی...', cls: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    synced:  { text: 'ذخیره در فضای ابری', cls: 'text-emerald-400', dot: 'bg-emerald-400' },
    error:   { text: 'خطا در اتصال به ابر', cls: 'text-red-400', dot: 'bg-red-400' },
  }[status];
  return (
    <div className={`flex items-center gap-1.5 text-xs ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.text}
    </div>
  );
}

function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <div className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); onSearch(e.target.value); }}
        placeholder="نام فرد را جستجو کن..."
        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-base"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
      {q && (
        <button
          onClick={() => { setQ(''); onSearch(''); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-lg"
        >✕</button>
      )}
    </div>
  );
}

const Dashboard: React.FC<Props> = ({ people, events, nav, syncStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayDate();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const activePeople = useMemo(() => people.filter((p) => p.isActive), [people]);

  const todayEvents = useMemo(() => events.filter((e) => e.date === today), [events, today]);
  const todayScore = useMemo(() => todayEvents.reduce((s, e) => s + e.score, 0), [todayEvents]);
  const todayPV = useMemo(() => todayEvents.reduce((s, e) => s + (e.pv ?? 0), 0), [todayEvents]);

  const ranked = useMemo(() => getRankedPeople(people, events, 'total'), [people, events]);
  const weekRanked = useMemo(() => getRankedPeople(people, events, 'week'), [people, events]);
  const monthRanked = useMemo(() => getRankedPeople(people, events, 'month'), [people, events]);
  const bestToday = useMemo(() => getBestToday(people, events), [people, events]);

  const weekLeader = weekRanked[0];
  const monthLeader = monthRanked[0];

  const recentIds = useMemo(() => getRecentIds(), []);
  const recentPeople = useMemo(() => {
    return recentIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => !!p)
      .slice(0, 8);
  }, [recentIds, people]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return people
      .filter((p) => {
        const full = `${p.firstName} ${p.lastName}`.toLowerCase();
        return full.includes(q) || p.team.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const aActive = a.isActive ? 0 : 1;
        const bActive = b.isActive ? 0 : 1;
        return aActive - bActive;
      })
      .slice(0, 10);
  }, [searchQuery, people]);

  const statsCards = [
    { label: 'افراد فعال', value: activePeople.length.toString(), icon: '👥', color: 'from-blue-500 to-blue-700' },
    { label: 'امتیاز امروز', value: formatNumber(todayScore), icon: '⭐', color: 'from-yellow-500 to-orange-600' },
    { label: 'PV امروز', value: formatNumber(todayPV), icon: '📦', color: 'from-emerald-500 to-emerald-700' },
    { label: 'ثبت‌های امروز', value: todayEvents.length.toString(), icon: '✅', color: 'from-violet-500 to-violet-700' },
  ];

  const weekEvents = events.filter((e) => e.date >= weekStart);
  const monthEvents = events.filter((e) => e.date >= monthStart);
  const weekScore = weekEvents.reduce((s, e) => s + e.score, 0);
  const monthScore = monthEvents.reduce((s, e) => s + e.score, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-100">میرزایی کوچ</h1>
          <p className="text-xs text-slate-400">{formatJalaliDate(today)}</p>
          <SyncBadge status={syncStatus} />
        </div>
        <button
          onClick={() => nav.go('add-person')}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-1 transition-colors"
        >
          <span>+</span> فرد جدید
        </button>
      </div>

      {/* Search */}
      <SearchBar onSearch={setSearchQuery} />

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          <div className="px-4 py-2 border-b border-slate-700">
            <span className="text-sm text-slate-400">نتایج جستجو ({searchResults.length})</span>
          </div>
          {searchResults.map((person) => {
            const rp = ranked.find((r) => r.person.id === person.id);
            return (
              <button
                key={person.id}
                onClick={() => nav.go('person-profile', { personId: person.id })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {person.firstName[0]}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-medium">{person.firstName} {person.lastName}</span>
                    {!person.isActive && <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">غیرفعال</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {person.team && <span>{person.team} | </span>}
                    {rp ? <span>رتبه {rp.rank} | {formatNumber(rp.totalScore)} امتیاز</span> : <span>بدون امتیاز</span>}
                  </div>
                </div>
                <span className="text-violet-400 text-lg">›</span>
              </button>
            );
          })}
        </div>
      )}

      {!searchQuery && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((card) => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white`}>
                <div className="text-2xl mb-1">{card.icon}</div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-xs opacity-80 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Week / Month summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">امتیاز هفته</div>
              <div className="text-xl font-bold text-violet-400">{formatNumber(weekScore)}</div>
              {weekLeader && (
                <div className="text-xs text-slate-400 mt-2">
                  🥇 {weekLeader.person.firstName} — {formatNumber(weekLeader.weekScore)}
                </div>
              )}
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">امتیاز ماه</div>
              <div className="text-xl font-bold text-amber-400">{formatNumber(monthScore)}</div>
              {monthLeader && (
                <div className="text-xs text-slate-400 mt-2">
                  🥇 {monthLeader.person.firstName} — {formatNumber(monthLeader.monthScore)}
                </div>
              )}
            </div>
          </div>

          {/* Best today */}
          {bestToday && (
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/40 rounded-2xl p-4">
              <div className="text-xs text-yellow-400 mb-2">👑 بیشترین اقدام امروز</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {bestToday.person.firstName[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-yellow-100">{bestToday.person.firstName} {bestToday.person.lastName}</div>
                  <div className="text-sm text-yellow-300">{formatNumber(bestToday.todayScore)} امتیاز امروز</div>
                </div>
                <button
                  onClick={() => nav.go('person-profile', { personId: bestToday.person.id })}
                  className="text-yellow-400 text-lg"
                >›</button>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'تاپ‌تن امروز', icon: '🔥', screen: 'top-ten' as const, period: 'today' as const },
              { label: 'تاپ‌تن هفته', icon: '🏆', screen: 'top-ten' as const, period: 'week' as const },
              { label: 'تاپ‌تن ماه', icon: '🌙', screen: 'top-ten' as const, period: 'month' as const },
              { label: 'اعلام شبانه', icon: '📢', screen: 'nightly-report' as const, period: undefined },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => nav.go(btn.screen, btn.period ? { topTenPeriod: btn.period } : {})}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 transition-colors text-right"
              >
                <span className="text-2xl">{btn.icon}</span>
                <span className="text-sm font-medium text-slate-200">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Recent People */}
          {recentPeople.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-300">آخرین ثبت‌ها</h2>
                <span className="text-xs text-slate-500">به زودی کارشده</span>
              </div>
              <div className="flex flex-col gap-2">
                {recentPeople.map((person) => {
                  const rp = ranked.find((r) => r.person.id === person.id);
                  return (
                    <button
                      key={person.id}
                      onClick={() => nav.go('person-profile', { personId: person.id })}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3 transition-colors text-right w-full"
                    >
                      <div className="w-9 h-9 rounded-full bg-violet-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {person.firstName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">{person.firstName} {person.lastName}</div>
                        {rp && (
                          <div className="text-xs text-slate-400">
                            رتبه {rp.rank} | {formatNumber(rp.totalScore)} امتیاز
                          </div>
                        )}
                      </div>
                      <span className="text-slate-500 text-sm">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {people.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">هنوز کسی اضافه نشده</h3>
              <p className="text-slate-500 text-sm mb-4">برای شروع، اولین نفر را اضافه کن</p>
              <button
                onClick={() => nav.go('add-person')}
                className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 font-bold transition-colors"
              >
                + افزودن اولین نفر
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
