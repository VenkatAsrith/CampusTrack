import React from 'react';
import { LogIn, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnauthorizedStateProps {
  message?: string;
  isFullPage?: boolean;
}

export const UnauthorizedState: React.FC<UnauthorizedStateProps> = ({
  message = 'Your institutional authentication session has expired. Please sign in again to continue.',
  isFullPage = false,
}) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
    navigate('/signin');
  };

  const content = (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-5 border border-blue-100 dark:border-blue-900/60 shadow-inner">
        <KeyRound className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
        HTTP 401 Unauthorized
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Session Expired
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In Again</span>
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

export default UnauthorizedState;
