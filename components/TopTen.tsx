import React, { useMemo } from 'react';
import { Person, OrgEvent, TopTenPeriod } from '../types';
import { AppNav } from '../App';
import { getTopTen } from '../utils/scoring';
import { RANK_BADGES, WEEKLY_PRIZES, MONTHLY_PRIZES } from '../constants';
import { formatNumber, formatToman, getTodayJalali } from '../utils/date';
import { exportTopTenImage } from '../utils/imageExport';
import { buildTopTenText } from '../utils/textExport';

interface Props {
  people: Person[];
  events: OrgEvent[];
  period: TopTenPeriod;
  nav: AppNav;
}

const PERIOD_LABELS: Record<TopTenPeriod, string> = {
  today: 'امروز',
  week: 'هفته جاری',
  month: 'ماه جاری',
};

const TopTen: React.FC<Props> = ({ people, events, period, nav }) => {
  const ranked = useMemo(() => getTopTen(people, events, period), [people, events, period]);
  const prizes = period === 'week' ? WEEKLY_PRIZES : period === 'month' ? MONTHLY_PRIZES : {} as Record<number,number>;
  const date = getTodayJalali();

  const text = useMemo(() => buildTopTenText(ranked, period), [ranked, period]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  const getScore = (rp: typeof ranked[0]) => {
    switch (period) {
      case 'today': return rp.todayScore;
      case 'week': return rp.weekScore;
      case 'month': return rp.monthScore;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as TopTenPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => nav.go('top-ten', { topTenPeriod: p })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold text-slate-100">تاپ ۱۰ {PERIOD_LABELS[period]}</h1>
          <p className="text-sm text-slate-400 mt-1">{date}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-3">
        {ranked.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">📊</div>
            <p>داده‌ای برای این بازه وجود ندارد</p>
          </div>
        )}
        {ranked.map((rp, i) => {
          const rank = i + 1;
          const score = getScore(rp);
          const badge = RANK_BADGES[rank];
          const prize = prizes[rank];

          return (
            <div
              key={rp.person.id}
              className={`rounded-2xl p-4 border ${
                rank === 1
                  ? 'border-yellow-600/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/20'
                  : rank <= 3
                  ? 'border-violet-700/40 bg-violet-900/15'
                  : rank <= 10
                  ? 'border-slate-800 bg-slate-800/60'
                  : 'border-slate-800 bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-center w-10 flex-shrink-0">
                  <span className="text-2xl">{badge ?? `${rank}.`}</span>
                </div>

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                    rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                    rank <= 3 ? 'bg-gradient-to-br from-violet-500 to-indigo-700' : 'bg-slate-700'
                  }`}
                >
                  {rp.person.firstName[0]}
                </div>

                <div className="flex-1">
                  <div className={`font-bold ${rank === 1 ? 'text-yellow-100 text-lg' : 'text-slate-100'}`}>
                    {rp.person.firstName} {rp.person.lastName}
                  </div>
                  {rp.person.team && <div className="text-xs text-slate-500">{rp.person.team}</div>}
                  {prize && (
                    <div className="text-sm text-amber-400 font-medium mt-1">
                      💰 {formatToman(prize)}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-xl font-bold ${rank === 1 ? 'text-yellow-400' : rank <= 3 ? 'text-violet-300' : 'text-slate-300'}`}>
                    {formatNumber(score)}
                  </div>
                  <div className="text-xs text-slate-500">امتیاز</div>
                  {rp.totalPV > 0 && period !== 'today' && (
                    <div className="text-xs text-emerald-500 mt-0.5">PV: {formatNumber(period === 'week' ? rp.weekPV : rp.monthPV)}</div>
                  )}
                </div>
              </div>

              {rank === 1 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'امروز', val: rp.todayScore },
                    { label: 'هفته', val: rp.weekScore },
                    { label: 'ماه', val: rp.monthScore },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-yellow-900/20 rounded-xl p-2 text-center">
                      <div className="text-xs text-yellow-500">{label}</div>
                      <div className="text-sm font-bold text-yellow-300">{formatNumber(val)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="sticky bottom-16 p-4 bg-slate-950 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl py-3 text-sm font-bold text-slate-200 transition-colors"
          >
            📋 کپی متن
          </button>
          <button
            onClick={() => exportTopTenImage(ranked, period)}
            className="bg-violet-600 hover:bg-violet-500 rounded-2xl py-3 text-sm font-bold text-white transition-colors"
          >
            🖼️ دانلود تصویر
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopTen;
