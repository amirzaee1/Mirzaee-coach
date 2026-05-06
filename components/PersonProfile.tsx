import React, { useState, useMemo } from 'react';
import { Person, OrgEvent, AppSettings } from '../types';
import { AppNav } from '../App';
import { getPersonStats, getRankedPeople } from '../utils/scoring';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS } from '../constants';
import { formatJalaliDateTime, formatNumber, formatToman } from '../utils/date';
import { exportPersonCard } from '../utils/imageExport';
import { buildPersonCardText } from '../utils/textExport';
import EventModal from './EventModal';

interface Props {
  personId: string;
  people: Person[];
  events: OrgEvent[];
  settings: AppSettings;
  nav: AppNav;
  onAddEvent: (event: OrgEvent) => void;
  onUpdateEvent: (event: OrgEvent) => void;
  onDeleteEvent: (id: string) => void;
  onSavePerson: (person: Person) => void;
}

const PersonProfile: React.FC<Props> = ({
  personId, people, events, settings, nav,
  onAddEvent, onUpdateEvent, onDeleteEvent, onSavePerson,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrgEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  const person = useMemo(() => people.find((p) => p.id === personId), [people, personId]);
  const personEvents = useMemo(
    () => events.filter((e) => e.personId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [events, personId]
  );

  const stats = useMemo(() => person ? getPersonStats(person, events) : null, [person, events]);
  const allRanked = useMemo(() => getRankedPeople(people, events, 'total'), [people, events]);
  const rankInfo = useMemo(() => allRanked.find((r) => r.person.id === personId), [allRanked, personId]);

  if (!person || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
        <div className="text-5xl mb-4">🔍</div>
        <p>فرد یافت نشد</p>
        <button onClick={() => nav.back()} className="mt-4 text-violet-400">بازگشت</button>
      </div>
    );
  }

  const handleToggleActive = () => {
    onSavePerson({ ...person, isActive: !person.isActive });
  };

  const handleSaveEvent = (event: OrgEvent) => {
    if (editingEvent) onUpdateEvent(event);
    else onAddEvent(event);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    onDeleteEvent(id);
    setConfirmDelete(null);
  };

  const statItems = [
    { label: 'کل', value: formatNumber(stats.totalScore), color: 'text-violet-400' },
    { label: 'امروز', value: formatNumber(stats.todayScore), color: 'text-amber-400' },
    { label: 'هفته', value: formatNumber(stats.weekScore), color: 'text-emerald-400' },
    { label: 'ماه', value: formatNumber(stats.monthScore), color: 'text-blue-400' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
          <div className="flex-1" />
          <button
            onClick={() => nav.go('edit-person', { personId })}
            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
          >
            ✏️ ویرایش
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
            {person.firstName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100">{person.firstName} {person.lastName}</h1>
            {person.team && <p className="text-sm text-slate-400 mt-0.5">تیم: {person.team}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${person.isActive ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                {person.isActive ? '● فعال' : '● غیرفعال'}
              </span>
              {rankInfo && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-400">
                  رتبه {rankInfo.rank}
                </span>
              )}
              <button onClick={handleToggleActive} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {person.isActive ? 'غیرفعال کن' : 'فعال کن'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {statItems.map((item) => (
            <div key={item.label} className="bg-slate-800/80 rounded-xl p-2 text-center">
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
        {stats.totalPV > 0 && (
          <div className="mt-2 bg-emerald-900/30 border border-emerald-800/50 rounded-xl px-4 py-2 text-sm text-emerald-400 text-center">
            مجموع PV: {formatNumber(stats.totalPV)}
          </div>
        )}

        {/* Share row */}
        {rankInfo && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => exportPersonCard(rankInfo)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-xl py-2.5 text-xs text-slate-300 font-medium transition-colors"
            >
              🖼️ دانلود کارت
            </button>
            <button
              onClick={async () => {
                const text = buildPersonCardText(rankInfo);
                try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-xl py-2.5 text-xs text-slate-300 font-medium transition-colors"
            >
              📋 کپی متن کارت
            </button>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="px-4 py-4 bg-slate-900 border-b border-slate-800">
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'meeting_attendance' as const },
            { type: 'personal_purchase' as const },
            { type: 'presentation' as const },
            { type: 'new_member_score' as const },
            { type: 'level_up' as const },
            { type: 'agha_mohammad_meeting' as const },
          ].map(({ type }) => (
            <button
              key={type}
              onClick={() => { setEditingEvent(null); setShowModal(true); }}
              className={`${EVENT_TYPE_COLORS[type]} bg-opacity-20 hover:bg-opacity-30 border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1 transition-all`}
            >
              <span className="text-xl">{EVENT_TYPE_ICONS[type]}</span>
              <span className="text-xs text-slate-200 leading-tight text-center">{EVENT_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowModal(true); }}
          className="w-full mt-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl py-3 text-sm transition-colors"
        >
          + ثبت رویداد جدید
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900">
        {[{ key: 'stats' as const, label: 'آمار' }, { key: 'history' as const, label: 'تاریخچه' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === key ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'stats' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-slate-400 mb-3">خلاصه فعالیت‌ها</h3>
              <div className="space-y-2">
                {(['meeting_attendance', 'personal_purchase', 'presentation', 'new_member_score', 'level_up', 'agha_mohammad_meeting'] as const).map((type) => {
                  const typeEvents = personEvents.filter((e) => e.type === type);
                  if (typeEvents.length === 0) return null;
                  const total = typeEvents.reduce((s, e) => s + e.score, 0);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-lg">{EVENT_TYPE_ICONS[type]}</span>
                      <div className="flex-1">
                        <div className="text-xs text-slate-400">{EVENT_TYPE_LABELS[type]}</div>
                        <div className="text-xs text-slate-500">{typeEvents.length} بار</div>
                      </div>
                      <div className="text-sm font-bold text-violet-400">{formatNumber(total)} امتیاز</div>
                    </div>
                  );
                })}
              </div>
              {personEvents.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">هنوز رویدادی ثبت نشده</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {personEvents.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">📋</div>
                <p>هنوز رویدادی ثبت نشده</p>
              </div>
            )}
            {personEvents.map((event) => (
              <div key={event.id} className="bg-slate-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{EVENT_TYPE_ICONS[event.type]}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">{EVENT_TYPE_LABELS[event.type]}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{formatJalaliDateTime(event.createdAt)}</div>
                    {event.note && <div className="text-xs text-slate-500 mt-1 italic">{event.note}</div>}
                    {event.type === 'personal_purchase' && (
                      <div className="text-xs text-emerald-400 mt-1">
                        مبلغ: {formatToman(event.rawValue)} | PV: {(event.pv ?? 0).toFixed(2).replace(/\.?0+$/, '')}
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-lg font-bold text-violet-400">{formatNumber(event.score)}</div>
                    <div className="text-xs text-slate-500">امتیاز</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => { setEditingEvent(event); setShowModal(true); }}
                    className="flex-1 text-sm text-slate-400 hover:text-violet-400 transition-colors py-1"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => setConfirmDelete(event.id)}
                    className="flex-1 text-sm text-slate-400 hover:text-red-400 transition-colors py-1"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-100 mb-2">حذف رویداد؟</h3>
            <p className="text-sm text-slate-400 mb-5">این رویداد حذف می‌شود و امتیازها دوباره محاسبه خواهند شد.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm"
              >
                لغو
              </button>
              <button
                onClick={() => handleDeleteEvent(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold"
              >
                حذف کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event modal */}
      {showModal && (
        <EventModal
          personId={personId}
          personName={`${person.firstName} ${person.lastName}`}
          settings={settings}
          editingEvent={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
};

export default PersonProfile;
