import React from 'react';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ForbiddenStateProps {
  message?: string;
  isFullPage?: boolean;
}

export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  message = "You don't have permission to access this institutional resource or administrative view.",
  isFullPage = false,
}) => {
  const navigate = useNavigate();

  const handleHome = () => {
    const rawUser = localStorage.getItem('campustrack_user');
    const role = rawUser ? JSON.parse(rawUser)?.role : null;
    if (role === 'admin' || role === 'tpo') {
      navigate('/admin/dashboard');
    } else if (role === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/signin');
    }
  };

  const content = (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-5 border border-rose-100 dark:border-rose-900/60 shadow-inner">
        <ShieldX className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
        HTTP 403 Forbidden
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Access Denied
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>

        <button
          type="button"
          onClick={handleHome}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[380px] flex items-center justify-center p-6">
      {content}
    </div>
  );
};

export default ForbiddenState;
