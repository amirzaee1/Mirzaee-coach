import React, { useState } from 'react';
import { Person } from '../types';
import { AppNav } from '../App';

interface Props {
  existingPerson: Person | null;
  nav: AppNav;
  onSave: (person: Person) => void;
}

const AddEditPerson: React.FC<Props> = ({ existingPerson, nav, onSave }) => {
  const isEdit = !!existingPerson;
  const [firstName, setFirstName] = useState(existingPerson?.firstName ?? '');
  const [lastName, setLastName] = useState(existingPerson?.lastName ?? '');
  const [team, setTeam] = useState(existingPerson?.team ?? '');
  const [isActive, setIsActive] = useState(existingPerson?.isActive ?? true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('نام اجباری است');
      return;
    }
    const person: Person = {
      id: existingPerson?.id ?? crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      team: team.trim(),
      isActive,
      createdAt: existingPerson?.createdAt ?? new Date().toISOString(),
    };
    onSave(person);
    nav.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button onClick={() => nav.back()} className="text-violet-400 text-2xl font-bold leading-none">‹</button>
        <h1 className="text-lg font-bold text-slate-100">{isEdit ? 'ویرایش اطلاعات' : 'افزودن فرد جدید'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 flex-1">
        <div className="bg-slate-800 rounded-2xl p-5 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">نام *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثلاً: علی"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">نام خانوادگی</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="مثلاً: محمدی"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">تیم / لیدر</label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="مثلاً: تیم الف"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">وضعیت</label>
            <div className="flex gap-3">
              {[{ v: true, label: '✅ فعال' }, { v: false, label: '⛔ غیرفعال' }].map(({ v, label }) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsActive(v)}
                  className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                    isActive === v
                      ? v
                        ? 'border-emerald-500 bg-emerald-900/40 text-emerald-400'
                        : 'border-red-500 bg-red-900/40 text-red-400'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl py-4 text-base transition-colors shadow-lg shadow-violet-900/50"
        >
          {isEdit ? 'ذخیره تغییرات' : '+ افزودن به سازمان'}
        </button>
      </form>
    </div>
  );
};

export default AddEditPerson;
