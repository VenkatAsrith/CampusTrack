import React, { useState } from 'react';
import { Construction, RefreshCw, ShieldCheck } from 'lucide-react';

interface ServiceUnavailableProps {
  onRetry?: () => void;
  message?: string;
  isFullPage?: boolean;
}

export const ServiceUnavailable: React.FC<ServiceUnavailableProps> = ({
  onRetry,
  message = "We're performing scheduled maintenance or absorbing high institutional load. Please try again shortly.",
  isFullPage = false,
}) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
      setRetrying(false);
    }, 1000);
  };

  const content = (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
        <Construction className="w-8 h-8" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
        HTTP 503 Maintenance
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        CampusTrack is Temporarily Unavailable
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Connecting...' : 'Retry Connection'}</span>
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
        <span>JNTUH University College of Engineering Sulthanpur</span>
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

export default ServiceUnavailable;
