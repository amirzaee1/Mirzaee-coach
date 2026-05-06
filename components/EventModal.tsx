import React, { useState } from 'react';
import { EventType, OrgEvent, AppSettings } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../constants';
import { calculateEventScore } from '../utils/scoring';
import { getTodayDate, formatNumber } from '../utils/date';

interface Props {
  personId: string;
  personName: string;
  settings: AppSettings;
  defaultType?: EventType;
  editingEvent?: OrgEvent | null;
  onSave: (event: OrgEvent) => void;
  onClose: () => void;
}

const EVENT_TYPES: EventType[] = [
  'meeting_attendance',
  'personal_purchase',
  'presentation',
  'new_member_score',
  'level_up',
  'agha_mohammad_meeting',
];

function toAsciiDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d]/g, '');
}

function formatThousands(val: string): string {
  const digits = toAsciiDigits(val);
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('fa-IR');
}

const TOMAN_TYPES: EventType[] = ['personal_purchase', 'new_member_score'];

const EventModal: React.FC<Props> = ({
  personId, personName, settings, defaultType, editingEvent, onSave, onClose,
}) => {
  // Derive initial state from editingEvent OR defaultType (component is keyed to remount on change)
  const initType = editingEvent?.type ?? defaultType ?? 'meeting_attendance';
  const [selectedType, setSelectedType] = useState<EventType>(initType);
  const [rawValue, setRawValue] = useState<string>(editingEvent ? String(editingEvent.rawValue) : '');
  const [note, setNote] = useState(editingEvent?.note ?? '');

  const isMeeting = selectedType === 'meeting_attendance';
  const isTomanType = TOMAN_TYPES.includes(selectedType);
  const parsedValue = parseInt(toAsciiDigits(rawValue), 10) || 0;
  const { score, pv } = calculateEventScore(selectedType, isMeeting ? 1 : parsedValue, settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(toAsciiDigits(e.target.value));
  };

  const isValid = isMeeting || parsedValue > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      id: editingEvent?.id ?? crypto.randomUUID(),
      personId,
      type: selectedType,
      rawValue: isMeeting ? 1 : parsedValue,
      pv,
      score,
      date: editingEvent?.date ?? getTodayDate(),
      createdAt: editingEvent?.createdAt ?? new Date().toISOString(),
      note: note.trim() || undefined,
    });
    onClose();
  };

  const inputLabel =
    selectedType === 'personal_purchase' ? 'مبلغ خرید (تومان)' :
    selectedType === 'new_member_score'   ? 'مبلغ فروش ورودی (تومان)' :
    'تعداد';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-slate-700 p-5 pb-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100">
            {editingEvent ? 'ویرایش رویداد' : `ثبت برای ${personName}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 text-xl">✕</button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setRawValue(''); }}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                selectedType === type
                  ? 'border-violet-500 bg-violet-900/50 text-violet-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-xl">{EVENT_TYPE_ICONS[type]}</span>
              <span className="text-xs font-medium leading-tight">{EVENT_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>

        {/* Amount input */}
        {!isMeeting && (
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1.5">{inputLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              value={isTomanType ? formatThousands(rawValue) : rawValue}
              onChange={handleChange}
              placeholder={isTomanType ? 'مبلغ به تومان' : 'تعداد'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-base"
              autoFocus
            />
            {isTomanType && parsedValue > 0 && (
              <p className="text-xs text-slate-500 mt-1 pr-1">
                {formatNumber(parsedValue)} ÷ ۱,۰۰۰,۰۰۰ = {formatNumber(pv ?? 0)} PV
              </p>
            )}
          </div>
        )}

        {/* Score preview */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">امتیاز</div>
            <div className="text-2xl font-bold text-violet-400">
              {!isValid ? '—' : formatNumber(score)}
            </div>
          </div>
          {(pv ?? 0) > 0 && parsedValue > 0 && (
            <div className="border-r border-slate-700 pr-4 flex-1">
              <div className="text-xs text-slate-400 mb-1">PV</div>
              <div className="text-2xl font-bold text-emerald-400">{formatNumber(pv ?? 0)}</div>
            </div>
          )}
          {isTomanType && parsedValue > 0 && (
            <div className="text-xs text-slate-500 text-left flex-shrink-0">
              × {settings.coefficients[selectedType]}
            </div>
          )}
          <div className="text-2xl">{EVENT_TYPE_ICONS[selectedType]}</div>
        </div>

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="توضیح (اختیاری)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-2xl py-4 text-base transition-colors"
        >
          {editingEvent ? '💾 ذخیره ویرایش' : '✅ ثبت رویداد'}
        </button>
      </div>
    </div>
  );
};

export default EventModal;
