import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Check } from 'lucide-react';

interface LatencyState {
  isDelayed: boolean;
  message: string;
  hasTimedOut: boolean;
}

const LatencyIndicator: React.FC = () => {
  const [state, setState] = useState<LatencyState>({
    isDelayed: false,
    message: '',
    hasTimedOut: false,
  });

  useEffect(() => {
    const handleStart = (e: CustomEvent) => {
      setState({
        isDelayed: true,
        message: e.detail?.message || 'Processing institutional records...',
        hasTimedOut: false,
      });
    };

    const handleEnd = () => {
      setState((prev) => ({
        ...prev,
        isDelayed: false,
      }));
    };

    const handleTimeout = (e: CustomEvent) => {
      setState({
        isDelayed: true,
        message: e.detail?.message || 'High network latency detected. Drafted data preserved locally.',
        hasTimedOut: true,
      });

      // Auto dismiss timeout warning after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, isDelayed: false, hasTimedOut: false }));
      }, 5000);
    };

    window.addEventListener('campustrack:latency:start' as any, handleStart);
    window.addEventListener('campustrack:latency:end' as any, handleEnd);
    window.addEventListener('campustrack:latency:timeout' as any, handleTimeout);

    return () => {
      window.removeEventListener('campustrack:latency:start' as any, handleStart);
      window.removeEventListener('campustrack:latency:end' as any, handleEnd);
      window.removeEventListener('campustrack:latency:timeout' as any, handleTimeout);
    };
  }, []);

  if (!state.isDelayed) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm animate-in slide-in-from-top-3 fade-in duration-200">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start space-x-3 text-xs ${
        state.hasTimedOut
          ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          : 'bg-white/95 dark:bg-slate-900/95 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100'
      }`}>
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
          {state.hasTimedOut ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <span>{state.hasTimedOut ? 'High Network Latency' : 'Processing Request...'}</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              CampusTrack
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {state.message}
          </p>
          <div className="pt-1 flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
            <Check className="w-3 h-3" />
            <span>Form inputs & drafts auto-saved locally</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatencyIndicator;
