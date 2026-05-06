import React, { useState, useEffect } from 'react';
import { EventType, OrgEvent, AppSettings } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../constants';
import { calculateEventScore } from '../utils/scoring';
import { getTodayDate } from '../utils/date';

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
  const isPurchase = selectedType === 'personal_purchase';

  const parsedValue = parseFloat(rawValue.replace(/,/g, '')) || 0;
  const { score, pv } = calculateEventScore(selectedType, isMeeting ? 1 : parsedValue, settings);

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

  const formatInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits).toLocaleString('fa-IR') : '';
  };

  const inputLabel =
    isPurchase ? 'مبلغ خرید (تومان)' :
    selectedType === 'new_member_score' ? 'امتیاز ورودی' :
    'تعداد';

  const inputPlaceholder =
    isPurchase ? 'مثلاً: ۱٬۰۰۰٬۰۰۰' :
    selectedType === 'new_member_score' ? 'امتیاز ورودی را وارد کن' :
    'تعداد را وارد کن';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-slate-700 p-5 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
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
              value={isPurchase ? formatInput(rawValue) : rawValue}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d]/g, '');
                setRawValue(val);
              }}
              placeholder={inputPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-base"
              autoFocus
            />
          </div>
        )}

        {/* Score preview */}
        <div className="bg-slate-800 rounded-xl p-4 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">امتیاز محاسبه‌شده</div>
            <div className="text-2xl font-bold text-violet-400">
              {(!isMeeting && !parsedValue) ? '—' : score.toFixed(1).replace(/\.0$/, '')}
            </div>
          </div>
          {pv !== undefined && parsedValue > 0 && (
            <div className="flex-1 border-r border-slate-700 pr-4">
              <div className="text-xs text-slate-400 mb-1">PV</div>
              <div className="text-2xl font-bold text-emerald-400">{pv.toFixed(2).replace(/\.?0+$/, '')}</div>
            </div>
          )}
          <div className="text-3xl">{EVENT_TYPE_ICONS[selectedType]}</div>
        </div>

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
