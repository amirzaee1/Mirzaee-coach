
import React, { useState } from 'react';

interface UserDetails {
  firstName: string;
  lastName: string;
  mobile: string;
}

interface LoginScreenProps {
  onRegister: (details: UserDetails) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onRegister }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) {
      setFormError('لطفاً تمامی فیلدها را تکمیل نمایید.');
      return;
    }
    // Basic mobile number validation (starts with 09, 11 digits) - adjust as needed for Iranian numbers
    if (!/^09[0-9]{9}$/.test(mobile)) {
        setFormError('شماره همراه وارد شده معتبر نیست. (مثال: 09123456789)');
        return;
    }
    setFormError(null);
    onRegister({ firstName: firstName.trim(), lastName: lastName.trim(), mobile: mobile.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4" dir="rtl">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sky-400">به مربی هوشمند خوش آمدید!</h1>
          <p className="mt-2 text-slate-300">برای شروع، لطفاً اطلاعات خود را وارد کنید.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">
              نام
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 bg-slate-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
              placeholder="مثلا: امیر"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">
              نام خانوادگی
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 bg-slate-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
              placeholder="مثلا: میرزایی"
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-slate-300 mb-1">
              شماره همراه
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              autoComplete="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full p-3 bg-slate-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400 ltr-input"
              placeholder="09123456789"
              style={{ textAlign: 'left', direction: 'ltr' }}
            />
          </div>
          
          {formError && (
            <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md text-center">{formError}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150"
            >
              ورود و شروع گفتگو
            </button>
          </div>
        </form>
         <p className="mt-4 text-xs text-slate-400 text-center">
            اطلاعات شما به صورت محلی در مرورگر ذخیره می‌شود و با هیچ سروری به اشتراک گذاشته نخواهد شد.
          </p>
      </div>
    </div>
  );
};

export default LoginScreen;
