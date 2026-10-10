import React, { useEffect, useState } from 'react';
import { Gauge, RefreshCw, Clock } from 'lucide-react';

interface RateLimitStateProps {
  onRetry?: () => void;
  message?: string;
  initialCountdownSeconds?: number;
  isFullPage?: boolean;
}

export const RateLimitState: React.FC<RateLimitStateProps> = ({
  onRetry,
  message = "You've made too many requests in a short period. Please pause a moment before trying again.",
  initialCountdownSeconds = 30,
  isFullPage = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialCountdownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const canRetry = secondsLeft === 0;

  const content = (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mb-5 border border-violet-100 dark:border-violet-900/60 shadow-inner">
        <Gauge className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
        HTTP 429 Rate Limit
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Too Many Requests
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>

      {/* Countdown pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 mb-6">
        <Clock className="w-4 h-4 text-violet-500" />
        <span>
          {canRetry ? 'Cooldown complete. You can try again.' : `Cooldown: ${secondsLeft}s remaining`}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (canRetry) {
              if (onRetry) onRetry();
              else window.location.reload();
            }
          }}
          disabled={!canRetry}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
            canRetry
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 cursor-pointer'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{canRetry ? 'Try Again' : `Wait ${secondsLeft}s`}</span>
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

export default RateLimitState;
