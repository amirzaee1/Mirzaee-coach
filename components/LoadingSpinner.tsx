
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center my-4" dir="rtl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
      <p className="mr-3 text-sky-300">مربی در حال فکر کردن است...</p>
    </div>
  );
};

export default LoadingSpinner;
