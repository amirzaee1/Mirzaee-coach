import React, { useState, useMemo } from 'react';
import { Person, OrgEvent, SortBy } from '../types';
import { AppNav } from '../App';
import { getRankedPeople } from '../utils/scoring';
import { RANK_BADGES } from '../constants';
import { formatNumber } from '../utils/date';
import { exportRankingsImage } from '../utils/imageExport';
import { buildRankingsText } from '../utils/textExport';

interface Props {
  people: Person[];
  events: OrgEvent[];
  nav: AppNav;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'total', label: 'کل' },
  { value: 'today', label: 'امروز' },
  { value: 'week', label: 'هفته' },
  { value: 'month', label: 'ماه' },
];

const Rankings: React.FC<Props> = ({ people, events, nav }) => {
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [teamFilter, setTeamFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [copied, setCopied] = useState(false);

  const teams = useMemo(() => {
    const ts = Array.from(new Set(people.map((p) => p.team).filter(Boolean)));
    return ts.sort();
  }, [people]);

  const ranked = useMemo(
    () => getRankedPeople(people, events, sortBy, !showInactive),
    [people, events, sortBy, showInactive]
  );

  const filtered = useMemo(() => {
    return ranked.filter((rp) => {
      const nameMatch = !searchQ ||
        `${rp.person.firstName} ${rp.person.lastName}`.toLowerCase().includes(searchQ.toLowerCase());
      const teamMatch = !teamFilter || rp.person.team === teamFilter;
      return nameMatch && teamMatch;
    });
  }, [ranked, searchQ, teamFilter]);

  const getScore = (rp: typeof ranked[0]) => {
    switch (sortBy) {
      case 'today': return rp.todayScore;
      case 'week': return rp.weekScore;
      case 'month': return rp.monthScore;
      default: return rp.totalScore;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3 p-4 pb-3">
          <h1 className="text-lg font-bold text-slate-100 flex-1">🏆 رتبه‌بندی کامل</h1>
          <span className="text-xs text-slate-500">{filtered.length} نفر</span>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                sortBy === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex gap-2 px-4 pb-3">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="جستجو..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          {teams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">همه تیم‌ها</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showInactive
                ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                : 'border-slate-700 text-slate-500 hover:border-slate-600'
            }`}
          >
            {showInactive ? '✓ نمایش غیرفعال‌ها' : 'نمایش غیرفعال‌ها'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>نتیجه‌ای یافت نشد</p>
          </div>
        )}
        {filtered.map((rp, displayIdx) => {
          const rank = displayIdx + 1;
          const score = getScore(rp);
          const badge = RANK_BADGES[rank];
          const isTop = rank <= 3;
          const isFire = rank <= 10 && rank > 3;

          return (
            <button
              key={rp.person.id}
              onClick={() => nav.go('person-profile', { personId: rp.person.id })}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-right ${
                rank === 1
                  ? 'border-yellow-600/50 bg-yellow-900/20 hover:bg-yellow-900/30'
                  : rank <= 3
                  ? 'border-violet-700/40 bg-violet-900/15 hover:bg-violet-900/25'
                  : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              {/* Rank badge */}
              <div className="w-9 text-center flex-shrink-0">
                {badge ? (
                  <span className="text-2xl">{badge}</span>
                ) : (
                  <span className={`text-sm font-bold ${isFire ? 'text-orange-400' : 'text-slate-500'}`}>
                    {isFire ? '🔥' : String(rank)}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                isTop ? 'bg-gradient-to-br from-violet-500 to-indigo-700' : 'bg-slate-700'
              }`}>
                {rp.person.firstName[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold truncate ${isTop ? 'text-slate-100' : 'text-slate-200'}`}>
                    {rp.person.firstName} {rp.person.lastName}
                  </span>
                  {!rp.person.isActive && (
                    <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">غیرفعال</span>
                  )}
                </div>
                {rp.person.team && (
                  <div className="text-xs text-slate-500 truncate">{rp.person.team}</div>
                )}
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">امروز: {formatNumber(rp.todayScore)}</span>
                  <span className="text-xs text-slate-500">هفته: {formatNumber(rp.weekScore)}</span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className={`text-lg font-bold ${isTop ? 'text-violet-300' : 'text-slate-300'}`}>
                  {formatNumber(score)}
                </div>
                <div className="text-xs text-slate-500">امتیاز</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Share bar */}
      {filtered.length > 0 && (
        <div className="sticky bottom-16 p-4 bg-slate-950/95 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                const sortLabel = sortBy === 'total' ? 'کل' : sortBy === 'today' ? 'امروز' : sortBy === 'week' ? 'هفته' : 'ماه';
                const text = buildRankingsText(filtered, `رتبه‌بندی ${sortLabel}`);
                try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
              }}
              className={`py-3 rounded-2xl border text-sm font-bold transition-all ${copied ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
            >
              {copied ? '✓ کپی شد' : '📋 کپی متن'}
            </button>
            <button
              onClick={() => {
                const sortLabel = sortBy === 'total' ? 'کل' : sortBy === 'today' ? 'امروز' : sortBy === 'week' ? 'هفته' : 'ماه';
                exportRankingsImage(filtered, `رتبه‌بندی ${sortLabel}`);
              }}
              className="py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors"
            >
              🖼️ دانلود تصویر
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
