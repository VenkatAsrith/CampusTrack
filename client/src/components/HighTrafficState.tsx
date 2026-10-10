import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, LayoutDashboard, Clock, CheckCircle2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { API_BASE_URL } from '../services/api';

interface HighTrafficStateProps {
  onRetry?: () => Promise<void> | void;
  retryAfterSeconds?: number;
  isFullPage?: boolean;
  onReturnToDashboard?: () => void;
  incidentRef?: string;
}

export const HighTrafficState: React.FC<HighTrafficStateProps> = ({
  onRetry,
  retryAfterSeconds = 15,
  isFullPage = false,
  onReturnToDashboard,
  incidentRef,
}) => {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);
  const [cooldown, setCooldown] = useState(retryAfterSeconds);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toLocaleTimeString());
  const [recovered, setRecovered] = useState(false);

  // Controlled Countdown Timer - avoids aggressive polling
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Controlled Health Verification on Retry
  const executeRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    setLastChecked(new Date().toLocaleTimeString());

    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Inexpensive health check verification
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${API_BASE_URL}/api/v1/health?t=${Date.now()}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        }).catch(() => null);
        clearTimeout(timeout);

        if (res && res.ok) {
          setRecovered(true);
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return;
        }
      }
    } finally {
      setRetrying(false);
      setCooldown(15); // Reset backoff interval
    }
  }, [onRetry, retrying]);

  const handleDashboardNavigation = () => {
    if (onReturnToDashboard) {
      onReturnToDashboard();
      return;
    }
    const rawUser = localStorage.getItem('campustrack_user');
    let user: any = null;
    try {
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch {
      user = null;
    }
    if (user?.role === 'admin' || user?.role === 'tpo') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/signin');
    }
  };

  const cardContent = (
    <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
      {/* Recovery celebration notice */}
      {recovered ? (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Traffic normalized! Restoring your view...</span>
        </div>
      ) : null}

      {/* High Traffic Badge Icon */}
      <div className="inline-flex p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
        <Users className="w-9 h-9" />
      </div>

      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
        High Institutional Traffic
      </div>

      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        CampusTrack is experiencing high traffic
      </h1>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
        Many students are accessing CampusTrack right now. Please wait a moment and try again.
      </p>

      {/* Status details pill */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last checked: <strong className="text-slate-700 dark:text-slate-200">{lastChecked}</strong></span>
        </span>
        {cooldown > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
            <span>Cooldown: {cooldown}s</span>
          </span>
        ) : null}
      </div>

      {incidentRef && (
        <div className="mb-6 inline-block text-[11px] font-mono text-slate-400 dark:text-slate-500">
          Tracking ID: {incidentRef}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={executeRetry}
          disabled={retrying}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Checking Availability...' : cooldown > 0 ? 'Retry Now' : 'Try Again'}</span>
        </button>

        <button
          type="button"
          onClick={handleDashboardNavigation}
          className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Portal</span>
        </button>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
        Your unsubmitted form drafts and inputs are preserved locally.
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/jntulogo.png"
                  alt="JNTUH UCES"
                  className="h-full w-full object-contain"
                  onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    CampusTrack
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Traffic Management
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  JNTUH University College of Engineering Sulthanpur
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          {cardContent}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <span>&copy; {new Date().getFullYear()} CampusTrack — JNTUH University College of Engineering Sulthanpur.</span>
        </footer>
      </div>
    );
  }

  // Sectional / Inline error state (local widget degradation)
  return (
    <div className="min-h-[320px] flex items-center justify-center p-6">
      {cardContent}
    </div>
  );
};

export default HighTrafficState;
