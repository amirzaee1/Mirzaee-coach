import React, { useState, useEffect } from 'react';
import { EventType, OrgEvent, AppSettings } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../constants';
import { calculateEventScore } from '../utils/scoring';
import { getTodayDate, formatNumber } from '../utils/date';

interface Props {
  personId: string;
  personName: string;
  settings: AppSettings;
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

// Convert Persian/Arabic digits to ASCII, strip non-numerics
function toAsciiDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d]/g, '');
}

// Format number with Persian thousands separator
function formatThousands(val: string): string {
  const digits = toAsciiDigits(val);
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('fa-IR');
}

// Types where input is in Tomans (amount → PV → score)
const TOMAN_TYPES: EventType[] = ['personal_purchase', 'new_member_score'];

const EventModal: React.FC<Props> = ({ personId, personName, settings, editingEvent, onSave, onClose }) => {
  const [selectedType, setSelectedType] = useState<EventType>(editingEvent?.type ?? 'meeting_attendance');
  const [rawValue, setRawValue] = useState<string>(
    editingEvent ? String(editingEvent.rawValue) : ''
  );
  const [note, setNote] = useState(editingEvent?.note ?? '');

  useEffect(() => {
    if (editingEvent) {
      setSelectedType(editingEvent.type);
      setRawValue(String(editingEvent.rawValue));
      setNote(editingEvent.note ?? '');
    }
  }, [editingEvent]);

  const isMeeting = selectedType === 'meeting_attendance';
  const isTomanType = TOMAN_TYPES.includes(selectedType);

  // Always store rawValue as ASCII digits
  const parsedValue = parseInt(toAsciiDigits(rawValue), 10) || 0;
  const { score, pv } = calculateEventScore(selectedType, isMeeting ? 1 : parsedValue, settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = toAsciiDigits(e.target.value);
    setRawValue(digits);
  };

  const handleSubmit = () => {
    if (!isMeeting && !parsedValue) return;
    const event: OrgEvent = {
      id: editingEvent?.id ?? crypto.randomUUID(),
      personId,
      type: selectedType,
      rawValue: isMeeting ? 1 : parsedValue,
      pv,
      score,
      date: editingEvent?.date ?? getTodayDate(),
      createdAt: editingEvent?.createdAt ?? new Date().toISOString(),
      note: note.trim() || undefined,
    };
    onSave(event);
    onClose();
  };

  const inputLabel =
    selectedType === 'personal_purchase' ? 'مبلغ خرید (تومان)' :
    selectedType === 'new_member_score'   ? 'مبلغ فروش ورودی (تومان)' :
    'تعداد';

  const inputPlaceholder =
    isTomanType ? 'مثلاً: ۱۰۰۰۰۰۰' : 'تعداد را وارد کن';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-slate-700 p-5 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">
            {editingEvent ? 'ویرایش ثبت' : `ثبت برای ${personName}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl leading-none">✕</button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setRawValue(''); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-right transition-all ${
                selectedType === type
                  ? 'border-violet-500 bg-violet-900/40 text-violet-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-lg flex-shrink-0">{EVENT_TYPE_ICONS[type]}</span>
              <span className="text-xs font-medium leading-tight">{EVENT_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        {!isMeeting && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">{inputLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              value={isTomanType ? formatThousands(rawValue) : rawValue}
              onChange={handleChange}
              placeholder={inputPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-base"
              autoFocus
            />
            {isTomanType && parsedValue > 0 && (
              <p className="text-xs text-slate-500 mt-1.5 pr-1">
                معادل: {formatNumber(parsedValue / 1_000_000)} PV
              </p>
            )}
          </div>
        )}

        {/* Score preview */}
        <div className="bg-slate-800 rounded-xl p-4 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">امتیاز محاسبه‌شده</div>
            <div className="text-2xl font-bold text-violet-400">
              {(!isMeeting && !parsedValue) ? '—' : formatNumber(score)}
            </div>
          </div>
          {pv !== undefined && pv > 0 && (
            <div className="flex-1 border-r border-slate-700 pr-4">
              <div className="text-xs text-slate-400 mb-1">PV</div>
              <div className="text-2xl font-bold text-emerald-400">{formatNumber(pv)}</div>
            </div>
          )}
          <div className="text-3xl">{EVENT_TYPE_ICONS[selectedType]}</div>
        </div>

        {/* Formula hint for toman types */}
        {isTomanType && parsedValue > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 mb-4 text-xs text-slate-400 leading-relaxed">
            {formatNumber(parsedValue)} ÷ ۱,۰۰۰,۰۰۰ = {formatNumber(pv ?? 0)} PV
            &nbsp;×&nbsp;{settings.coefficients[selectedType]} = <span className="text-violet-400 font-bold">{formatNumber(score)} امتیاز</span>
          </div>
        )}

        {/* Note */}
        <div className="mb-5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="توضیح کوتاه (اختیاری)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isMeeting && !parsedValue}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-2xl py-4 text-base transition-colors shadow-lg shadow-violet-900/50"
        >
          {editingEvent ? 'ذخیره ویرایش' : '✅ ثبت رویداد'}
        </button>
      </div>
    </div>
  );
};

export default EventModal;
