import React, { useState } from 'react';
import { Clock, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimeoutStateProps {
  onRetry?: () => Promise<void> | void;
  message?: string;
  requestId?: string;
  isFullPage?: boolean;
}

export const TimeoutState: React.FC<TimeoutStateProps> = ({
  onRetry,
  message = 'The server is taking longer than expected to respond. High institutional traffic may be causing temporary delay.',
  requestId,
  isFullPage = false,
}) => {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const handleRetry = async () => {
    if (retrying || retryAttempt >= 3) return;
    setRetrying(true);
    setRetryAttempt((prev) => prev + 1);
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-5 border border-amber-100 dark:border-amber-900/60 shadow-inner">
        <Clock className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
        HTTP 408 / 504 Timeout
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Request Timed Out
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
        {message}
      </p>

      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 font-medium mb-6">
        🔒 <strong>Your data has not been lost.</strong> Any submitted information remains preserved.
      </div>

      {requestId && (
        <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400 mb-6">
          Reference ID: <span className="font-bold text-slate-900 dark:text-white">{requestId}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying || retryAttempt >= 3}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
            retryAttempt >= 3
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 cursor-pointer'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Retrying...' : retryAttempt >= 3 ? 'Max Retries Reached' : 'Try Again'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Go to Dashboard</span>
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

export default TimeoutState;
