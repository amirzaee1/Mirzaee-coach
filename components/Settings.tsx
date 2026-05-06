import React, { useState } from 'react';
import { AppSettings, EventType } from '../types';
import { AppNav } from '../App';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '../constants';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  nav: AppNav;
}

const EVENT_TYPES: EventType[] = [
  'meeting_attendance',
  'personal_purchase',
  'presentation',
  'new_member_score',
  'level_up',
  'agha_mohammad_meeting',
];

const Settings: React.FC<Props> = ({ settings, onSave, nav: _nav }) => {
  const [coefficients, setCoefficients] = useState({ ...settings.coefficients });
  const [saved, setSaved] = useState(false);

  const handleChange = (type: EventType, value: string) => {
    const num = parseFloat(value) || 0;
    setCoefficients((prev) => ({ ...prev, [type]: num }));
  };

  const handleSave = () => {
    onSave({ ...settings, coefficients });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-100">⚙️ تنظیمات و ضرایب</h1>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Coefficients */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="font-bold text-slate-200">ضرایب امتیازدهی</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              هر رویداد با ضریب مشخص امتیاز می‌گیرد
            </p>
          </div>
          <div className="divide-y divide-slate-700/50">
            {EVENT_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-3 px-4 py-4">
                <span className="text-2xl flex-shrink-0">{EVENT_TYPE_ICONS[type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{EVENT_TYPE_LABELS[type]}</div>
                  {type === 'personal_purchase' && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      هر ۱,۰۰۰,۰۰۰ تومان = ۱ PV × ضریب
                    </div>
                  )}
                  {type === 'meeting_attendance' && (
                    <div className="text-xs text-slate-500 mt-0.5">امتیاز ثابت per ثبت</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="number"
                    value={coefficients[type]}
                    onChange={(e) => handleChange(type, e.target.value)}
                    min={0}
                    step={0.5}
                    className="w-16 bg-slate-700 border border-slate-600 rounded-xl px-2 py-2 text-center text-slate-100 focus:outline-none focus:border-violet-500 text-sm font-bold"
                  />
                  <span className="text-xs text-slate-500">×</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PV info */}
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-emerald-400 mb-2">📦 محاسبه PV</h3>
          <p className="text-sm text-slate-300">
            هر <span className="text-emerald-400 font-bold">۱,۰۰۰,۰۰۰ تومان</span> خرید = <span className="text-emerald-400 font-bold">۱ PV</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            امتیاز خرید = (مبلغ / ۱,۰۰۰,۰۰۰) × ضریب خرید شخصی
          </p>
        </div>

        {/* Prizes info */}
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-amber-400 mb-3">💰 جوایز</h3>
          <div className="space-y-2">
            <div className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">هفتگی</div>
            {[['🥇', '۱,۰۰۰,۰۰۰ تومان'], ['🥈', '۷۰۰,۰۰۰ تومان'], ['🥉', '۵۰۰,۰۰۰ تومان']].map(([b, p]) => (
              <div key={b} className="flex items-center justify-between">
                <span className="text-base">{b}</span>
                <span className="text-sm text-amber-300">{p}</span>
              </div>
            ))}
            <div className="font-bold text-xs text-slate-400 uppercase tracking-wider mt-3 mb-2">ماهانه</div>
            <div className="flex items-center justify-between">
              <span className="text-base">🥇</span>
              <span className="text-sm text-amber-300">۲,۰۰۰,۰۰۰ تومان</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full font-bold rounded-2xl py-4 text-base transition-all shadow-lg ${
            saved
              ? 'bg-emerald-600 text-white shadow-emerald-900/50'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/50'
          }`}
        >
          {saved ? '✓ ذخیره شد' : 'ذخیره تنظیمات'}
        </button>

        {/* App info */}
        <div className="text-center text-xs text-slate-600 pb-4">
          <p>میرزایی کوچ — سیستم مدیریت انگیزشی سازمان</p>
          <p className="mt-1">داده‌ها به صورت محلی در مرورگر ذخیره می‌شوند</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
