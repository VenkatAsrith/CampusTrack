import React, { useState } from 'react';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServerErrorProps {
  onRetry?: () => Promise<void> | void;
  message?: string;
  requestId?: string;
  statusCode?: number;
  isFullPage?: boolean;
}

export const ServerError: React.FC<ServerErrorProps> = ({
  onRetry,
  message = "We couldn't complete your request right now. The technical team has been notified.",
  requestId,
  statusCode = 500,
  isFullPage = false,
}) => {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        window.location.reload();
      }
    } finally {
      setRetrying(false);
    }
  };

  const content = (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-5 border border-rose-100 dark:border-rose-900/60 shadow-inner">
        <ServerCrash className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
        HTTP {statusCode} Internal Server Error
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Something went wrong
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>

      {requestId && (
        <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400 mb-6">
          Reference ID: <span className="font-bold text-slate-900 dark:text-white">{requestId}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Retrying...' : 'Try Again'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const rawUser = localStorage.getItem('campustrack_user');
            const role = rawUser ? JSON.parse(rawUser)?.role : null;
            if (role === 'admin' || role === 'tpo') {
              navigate('/admin/dashboard');
            } else if (role === 'student') {
              navigate('/student/dashboard');
            } else {
              navigate('/signin');
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
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

export default ServerError;
