import React, { useState, useMemo } from 'react';
import { Person, OrgEvent } from '../types';
import { AppNav } from '../App';
import { getTopTen } from '../utils/scoring';
import { generateMotivationalMessage, MessageStyle } from '../services/aiService';

interface Props {
  people: Person[];
  events: OrgEvent[];
  nav: AppNav;
}

const STYLES: { key: MessageStyle; label: string; icon: string; desc: string }[] = [
  { key: 'competitive', label: 'رقابتی', icon: '🔥', desc: 'داغ و رقابت‌ساز' },
  { key: 'encouraging', label: 'تشویقی', icon: '💪', desc: 'الهام‌بخش و انگیزشی' },
  { key: 'top-of-day', label: 'تقدیر نفر برتر', icon: '👑', desc: 'تقدیر از امروز' },
  { key: 'weekly-fire', label: 'هفته‌ای', icon: '⚡', desc: 'رقابت هفته' },
];

const AIMessage: React.FC<Props> = ({ people, events, nav }) => {
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('competitive');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const topToday = useMemo(() => getTopTen(people, events, 'today'), [people, events]);
  const topWeek = useMemo(() => getTopTen(people, events, 'week'), [people, events]);

  const hasApiKey = !!(process.env.API_KEY || process.env.GEMINI_API_KEY);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError('کلید API پیدا نشد. لطفاً API_KEY را تنظیم کنید.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
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
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
        <div>
          <h1 className="text-lg font-bold text-slate-100">✨ پیام انگیزشی AI</h1>
          <p className="text-xs text-slate-400">ساخت پیام بر اساس داده واقعی</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Context card */}
        {(topToday.length > 0 || topWeek.length > 0) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">داده‌های فعلی سازمان</h3>
            <div className="grid grid-cols-2 gap-3">
              {topToday[0] && (
                <div className="bg-orange-900/20 border border-orange-800/30 rounded-xl p-3">
                  <div className="text-xs text-orange-400 mb-1">نفر اول امروز</div>
                  <div className="text-sm font-bold text-orange-200">{topToday[0].person.firstName}</div>
                  <div className="text-xs text-orange-400">{topToday[0].todayScore.toFixed(1)} امتیاز</div>
                </div>
              )}
              {topWeek[0] && (
                <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl p-3">
                  <div className="text-xs text-violet-400 mb-1">نفر اول هفته</div>
                  <div className="text-sm font-bold text-violet-200">{topWeek[0].person.firstName}</div>
                  <div className="text-xs text-violet-400">{topWeek[0].weekScore.toFixed(1)} امتیاز</div>
                </div>
              )}
            </div>
            {topWeek.length >= 2 && (
              <div className="mt-2 text-xs text-slate-500">
                فاصله نفر اول و دوم: {(topWeek[0].weekScore - topWeek[1].weekScore).toFixed(1)} امتیاز
              </div>
            )}
          </div>
        )}

        {/* Style selector */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-3">نوع پیام</h3>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                className={`flex items-start gap-3 p-4 rounded-2xl border text-right transition-all ${
                  selectedStyle === s.key
                    ? 'border-violet-500 bg-violet-900/40 text-violet-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{s.icon}</span>
                <div>
                  <div className="text-sm font-bold">{s.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-2xl py-4 text-base transition-all shadow-lg shadow-violet-900/50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <span className="animate-spin text-xl">⏳</span>
              <span>در حال تولید...</span>
            </>
          ) : (
            <>
              <span className="text-xl">✨</span>
              <span>تولید پیام انگیزشی</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-800 rounded-2xl p-4 text-red-400 text-sm">
            {error}
            {!hasApiKey && (
              <p className="text-xs mt-2 text-red-500">
                برای استفاده از این ویژگی، کلید API_KEY باید تنظیم شده باشد.
              </p>
            )}
          </div>
        )}

        {/* Message output */}
        {message && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-violet-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-violet-400">پیام تولیدشده</span>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  🔄 دوباره
                </button>
                <button
                  onClick={handleCopy}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {copied ? '✓ کپی شد' : '📋 کپی'}
                </button>
              </div>
            </div>
            <p
              className="text-slate-100 text-base leading-relaxed whitespace-pre-line"
              style={{ lineHeight: '1.8' }}
            >
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
