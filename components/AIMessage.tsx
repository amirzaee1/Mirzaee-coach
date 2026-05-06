import React, { useState, useMemo } from 'react';
import { Person, OrgEvent } from '../types';
import { AppNav } from '../App';
import { getTopTen, getBestToday } from '../utils/scoring';
import { generateMotivationalMessage, MessageStyle } from '../services/aiService';
import { formatNumber } from '../utils/date';

interface Props {
  people: Person[];
  events: OrgEvent[];
  nav: AppNav;
}

const STYLES: { key: MessageStyle; label: string; icon: string; desc: string; gradient: string }[] = [
  { key: 'competitive',  label: 'رقابتی',         icon: '🔥', desc: 'داغ و رقابت‌ساز',          gradient: 'from-red-900/40 to-orange-900/30 border-red-800/40' },
  { key: 'encouraging',  label: 'تشویقی',          icon: '💪', desc: 'الهام‌بخش و انرژی‌ساز',     gradient: 'from-emerald-900/40 to-teal-900/30 border-emerald-800/40' },
  { key: 'top-of-day',   label: 'تقدیر روزانه',   icon: '👑', desc: 'تقدیر از نفر برتر امروز',    gradient: 'from-yellow-900/40 to-amber-900/30 border-yellow-800/40' },
  { key: 'weekly-fire',  label: 'آتش هفته',        icon: '⚡', desc: 'رقابت داغ هفتگی',           gradient: 'from-violet-900/40 to-indigo-900/30 border-violet-800/40' },
];

const AIMessage: React.FC<Props> = ({ people, events, nav }) => {
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('competitive');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const topToday = useMemo(() => getTopTen(people, events, 'today'), [people, events]);
  const topWeek  = useMemo(() => getTopTen(people, events, 'week'),  [people, events]);
  const bestToday = useMemo(() => getBestToday(people, events), [people, events]);

  const hasApiKey = !!(process.env.API_KEY || process.env.GEMINI_API_KEY);
  const hasData = topWeek.length > 0;

  const handleGenerate = async () => {
    if (!hasApiKey) { setError('کلید Gemini API تنظیم نشده است.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const result = await generateMotivationalMessage(topToday, topWeek, selectedStyle);
      setMessage(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در تولید پیام');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!message) return;
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!message) return;
    if (navigator.share) {
      try { await navigator.share({ text: message }); setShared(true); setTimeout(() => setShared(false), 2000); } catch { /* cancelled */ }
    } else {
      await handleCopy();
    }
  };

  const selectedStyleCfg = STYLES.find((s) => s.key === selectedStyle)!;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-100">✨ پیام انگیزشی هوشمند</h1>
          <p className="text-xs text-slate-500">بر اساس داده واقعی سازمان، تولید می‌شود</p>
        </div>
        {!hasApiKey && (
          <span className="text-xs text-amber-500 bg-amber-900/30 border border-amber-800/40 px-2 py-1 rounded-lg">بدون API</span>
        )}
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">

        {/* Live data snapshot */}
        {hasData ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">📊 وضعیت فعلی سازمان</p>
            <div className="grid grid-cols-2 gap-2">
              {bestToday && (
                <div className="bg-orange-900/25 border border-orange-800/30 rounded-xl p-3">
                  <p className="text-xs text-orange-400 mb-1">👑 نفر اول امروز</p>
                  <p className="text-sm font-bold text-orange-100 truncate">{bestToday.person.firstName} {bestToday.person.lastName}</p>
                  <p className="text-xs text-orange-300">{formatNumber(bestToday.todayScore)} امتیاز</p>
                </div>
              )}
              {topWeek[0] && (
                <div className="bg-violet-900/25 border border-violet-800/30 rounded-xl p-3">
                  <p className="text-xs text-violet-400 mb-1">🏆 نفر اول هفته</p>
                  <p className="text-sm font-bold text-violet-100 truncate">{topWeek[0].person.firstName} {topWeek[0].person.lastName}</p>
                  <p className="text-xs text-violet-300">{formatNumber(topWeek[0].weekScore)} امتیاز</p>
                </div>
              )}
            </div>
            {topWeek.length >= 2 && (
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                <span>⬆️ فاصله نفر اول و دوم:</span>
                <span className="text-slate-300 font-bold">{formatNumber(topWeek[0].weekScore - topWeek[1].weekScore)} امتیاز</span>
              </div>
            )}
            {topWeek.length > 0 && (
              <div className="text-xs text-slate-500 px-1">
                تاپ ۳ هفته: {topWeek.slice(0, 3).map((p) => p.person.firstName).join(' · ')}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 text-center text-slate-500 text-sm">
            <p>هنوز داده‌ای ثبت نشده — پیام بر اساس داده کلی تولید می‌شود</p>
          </div>
        )}

        {/* Style selector */}
        <div>
          <p className="text-sm font-bold text-slate-400 mb-3">نوع پیام را انتخاب کن</p>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all text-right bg-gradient-to-br ${s.gradient} ${
                  selectedStyle === s.key
                    ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950'
                    : 'opacity-70 hover:opacity-90'
                }`}
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-sm font-bold text-slate-100">{s.label}</span>
                <span className="text-xs text-slate-400 leading-tight">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full font-bold rounded-2xl py-4 text-base transition-all shadow-lg flex items-center justify-center gap-3 ${
            loading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : `bg-gradient-to-r ${selectedStyleCfg.gradient.split(' ')[0].replace('from-', 'from-').replace('/40', '')} to-violet-700 hover:to-violet-600 text-white shadow-violet-900/50`
          }`}
          style={loading ? {} : { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          {loading
            ? <><span className="animate-spin">⏳</span><span>در حال تولید پیام...</span></>
            : <><span className="text-xl">{selectedStyleCfg.icon}</span><span>✨ تولید پیام انگیزشی</span></>
          }
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-2xl p-4 text-sm text-red-300">
            <p className="font-bold mb-1">⚠️ خطا در تولید</p>
            <p>{error}</p>
            {!hasApiKey && <p className="text-xs text-red-400 mt-2">متغیر محیطی GEMINI_API_KEY یا API_KEY تنظیم نشده.</p>}
          </div>
        )}

        {/* Message output */}
        {message && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-violet-700/40 rounded-2xl overflow-hidden shadow-xl shadow-violet-900/20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedStyleCfg.icon}</span>
                <span className="text-sm font-bold text-violet-300">{selectedStyleCfg.label}</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
              >
                🔄 دوباره
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-slate-100 text-base leading-loose whitespace-pre-line" style={{ lineHeight: '2' }}>
                {message}
              </p>
            </div>

            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={handleCopy}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {copied ? '✓ کپی شد' : '📋 کپی'}
              </button>
              <button
                onClick={handleShare}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  shared ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {shared ? '✓ اشتراک‌گذاری شد' : '📤 اشتراک‌گذاری'}
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        {!message && !loading && (
          <div className="border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">💡 نکات</p>
            <ul className="text-xs text-slate-500 space-y-1.5 list-none">
              <li>• پیام بر اساس اسامی و امتیازهای واقعی تولید می‌شود</li>
              <li>• هر بار «دوباره» بزنی، پیام متفاوتی می‌گیری</li>
              <li>• پیام آماده کپی در تلگرام و واتساپ است</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
