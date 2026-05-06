import React, { useMemo, useState } from 'react';
import { Person, OrgEvent, AppSettings } from '../types';
import { AppNav } from '../App';
import { getTopTen, getBestToday } from '../utils/scoring';
import { RANK_BADGES } from '../constants';
import { formatNumber, formatToman, getTodayJalali } from '../utils/date';
import { exportTopTenImage, exportBestTodayImage } from '../utils/imageExport';
import { buildNightlyReportText, buildBestTodayText, buildTopTenText } from '../utils/textExport';

interface Props {
  people: Person[];
  events: OrgEvent[];
  settings: AppSettings;
  nav: AppNav;
}

const NightlyReport: React.FC<Props> = ({ people, events, settings, nav }) => {
  const [copied, setCopied] = useState<'all' | 'week' | 'today' | null>(null);

  const topWeek = useMemo(() => getTopTen(people, events, 'week'), [people, events]);
  const bestToday = useMemo(() => getBestToday(people, events), [people, events]);
  const date = getTodayJalali();

  const fullText = useMemo(() => buildNightlyReportText(topWeek, bestToday), [topWeek, bestToday]);
  const weekText = useMemo(() => buildTopTenText(topWeek, 'week'), [topWeek]);
  const todayText = useMemo(() => bestToday ? buildBestTodayText(bestToday) : '', [bestToday]);

  const handleCopy = async (key: 'all' | 'week' | 'today', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
        <div>
          <h1 className="text-lg font-bold text-slate-100">📢 اعلام شبانه</h1>
          <p className="text-xs text-slate-400">{date}</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Full report copy */}
        <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-violet-300">📋 گزارش کامل شبانه</h2>
            <button
              onClick={() => handleCopy('all', fullText)}
              className={`text-sm px-4 py-1.5 rounded-xl font-bold transition-all ${
                copied === 'all' ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {copied === 'all' ? '✓ کپی شد' : 'کپی همه'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            تاپ ۱۰ هفته + بیشترین اقدام امروز — آماده ارسال در گروه
          </p>
        </div>

        {/* Top 10 week section */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="font-bold text-slate-200">🏆 تاپ ۱۰ هفته تا امروز</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy('week', weekText)}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                  copied === 'week' ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {copied === 'week' ? '✓ کپی' : '📋 متن'}
              </button>
              <button
                onClick={() => exportTopTenImage(topWeek, 'week', settings)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
              >
                🖼️ تصویر
              </button>
            </div>
          </div>

          {topWeek.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p>هنوز داده‌ای ثبت نشده</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {topWeek.map((rp, i) => {
                const rank = i + 1;
                const prize = settings.prizes.weekly[rank];
                return (
                  <div key={rp.person.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl w-7 text-center flex-shrink-0">
                      {RANK_BADGES[rank] ?? String(rank)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {rp.person.firstName} {rp.person.lastName}
                      </div>
                      {prize && (
                        <div className="text-xs text-amber-400">💰 {formatToman(prize)}</div>
                      )}
                    </div>
                    <div className="text-sm font-bold text-violet-400 flex-shrink-0">
                      {formatNumber(rp.weekScore)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best today section */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="font-bold text-slate-200">👑 بیشترین اقدام امروز</h2>
            {bestToday && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy('today', todayText)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                    copied === 'today' ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {copied === 'today' ? '✓ کپی' : '📋 متن'}
                </button>
                <button
                  onClick={() => exportBestTodayImage(bestToday)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                >
                  🖼️ کارت
                </button>
              </div>
            )}
          </div>

          {!bestToday ? (
            <div className="py-8 text-center text-slate-500">
              <div className="text-3xl mb-2">☀️</div>
              <p className="text-sm">هنوز ثبتی برای امروز وجود ندارد</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                  {bestToday.person.firstName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    <span className="text-xl font-bold text-yellow-100">
                      {bestToday.person.firstName} {bestToday.person.lastName}
                    </span>
                  </div>
                  {bestToday.person.team && (
                    <p className="text-sm text-slate-400 mt-0.5">{bestToday.person.team}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-yellow-900/30 border border-yellow-800/40 rounded-xl p-3 text-center">
                  <div className="text-xs text-yellow-500 mb-1">امتیاز امروز</div>
                  <div className="text-2xl font-bold text-yellow-300">{formatNumber(bestToday.todayScore)}</div>
                </div>
                {bestToday.todayPV > 0 && (
                  <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-xl p-3 text-center">
                    <div className="text-xs text-emerald-500 mb-1">PV امروز</div>
                    <div className="text-2xl font-bold text-emerald-300">{formatNumber(bestToday.todayPV)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nav shortcut buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'تاپ‌تن امروز', icon: '🔥', period: 'today' as const },
            { label: 'تاپ‌تن هفته', icon: '🏆', period: 'week' as const },
            { label: 'تاپ‌تن ماه', icon: '🌙', period: 'month' as const },
          ].map((btn) => (
            <button
              key={btn.period}
              onClick={() => nav.go('top-ten', { topTenPeriod: btn.period })}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-3 flex flex-col items-center gap-1 transition-colors"
            >
              <span className="text-2xl">{btn.icon}</span>
              <span className="text-xs text-slate-300 text-center">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NightlyReport;
