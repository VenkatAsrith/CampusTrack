import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WifiOff,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Radio,
  Server,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../services/api';

interface ConnectionLostProps {
  isOverlay?: boolean;
  onDismiss?: () => void;
}

export const ConnectionLostPage: React.FC<ConnectionLostProps> = ({ isOverlay = false, onDismiss }) => {
  const navigate = useNavigate();
  const [isOnlineState, setIsOnlineState] = useState<boolean>(navigator.onLine);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [secondsUntilRetry, setSecondsUntilRetry] = useState<number>(8);
  const [reconnectSuccess, setReconnectSuccess] = useState<boolean>(false);

  // Active check to test both browser internet and CampusTrack API
  const testConnectivity = useCallback(async () => {
    setIsPinging(true);
    setApiReachable(null);

    const browserOnline = navigator.onLine;
    setIsOnlineState(browserOnline);

    if (!browserOnline) {
      setApiReachable(false);
      setIsPinging(false);
      return false;
    }

    try {
      // Ping health endpoint with cache-busting timestamp and a 4s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/health?t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && (response.ok || response.status === 200 || response.status === 304)) {
        setApiReachable(true);
        setReconnectSuccess(true);
        setIsPinging(false);
        // Automatically dismiss or redirect after small celebratory feedback
        setTimeout(() => {
          if (onDismiss) {
            onDismiss();
          } else {
            window.location.reload();
          }
        }, 1500);
        return true;
      } else {
        setApiReachable(false);
        setIsPinging(false);
        return false;
      }
    } catch {
      setApiReachable(false);
      setIsPinging(false);
      return false;
    }
  }, [onDismiss]);

  // Periodic Auto-Retry countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRetry((prev) => {
        if (prev <= 1) {
          testConnectivity();
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testConnectivity]);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineState(true);
      testConnectivity();
    };

    const handleOffline = () => {
      setIsOnlineState(false);
      setApiReachable(false);
      setReconnectSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [testConnectivity]);

  const handleManualRetry = () => {
    setSecondsUntilRetry(8);
    testConnectivity();
  };

  const handleReturnToPortal = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      const rawUser = localStorage.getItem('campustrack_user');
      let user = null;
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
    }
  };

  const mainContent = (
    <div className="w-full max-w-2xl text-center">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Reconnection Success Banner */}
        {reconnectSuccess ? (
          <div className="animate-in fade-in zoom-in duration-300 mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center gap-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-left text-xs">
              <p className="font-extrabold text-sm">Connection Restored!</p>
              <p className="text-emerald-700 dark:text-emerald-400">Re-synchronizing CampusTrack institutional workspace now...</p>
            </div>
          </div>
        ) : null}

        {/* Animated Wi-Fi Radar Badge */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 dark:bg-amber-400/20 animate-ping opacity-75" />
          <div className="relative p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 shadow-inner">
            <WifiOff className="w-12 h-12" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
          <span>Institutional Network Disconnected</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Connection Lost
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          It looks like your internet connection dropped or CampusTrack servers cannot be reached right now. We are actively working to re-establish the connection.
        </p>

        {/* Live Diagnostics Card */}
        <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-left">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Live Connectivity Diagnostics
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Auto-checking in <strong className="text-indigo-600 dark:text-indigo-400">{secondsUntilRetry}s</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Browser Online Status */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Local Network</span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isOnlineState ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">Interface Online</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Offline / No Net</span>
                  </>
                )}
              </div>
            </div>

            {/* CampusTrack Backend API Status */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">CampusTrack API</span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isPinging ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />
                    <span className="text-indigo-600 dark:text-indigo-400">Testing...</span>
                  </>
                ) : apiReachable === true ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">Reachable</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-700 dark:text-amber-400">Reconnecting...</span>
                  </>
                )}
              </div>
            </div>

            {/* Local Data Preservation Status */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Drafts & Cache</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Safely Preserved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isPinging}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Testing Connectivity...' : 'Try Reconnecting Now'}</span>
          </button>

          <button
            type="button"
            onClick={handleReturnToPortal}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{onDismiss ? 'Browse Offline Cache' : 'Go to Portal'}</span>
          </button>
        </div>

        {/* Troubleshooting Guidance Accordion / Box */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Quick Troubleshooting for Students & Faculty
          </h3>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Verify your device Wi-Fi, Ethernet, or mobile data is switched on.</li>
            <li>If using <strong>UCE Sulthanpur Campus Wi-Fi</strong>, verify your captive login page is authenticated.</li>
            <li>If institutional VPN or firewall is active, verify routing to CampusTrack endpoints.</li>
            <li>Your unsubmitted forms and profile drafts are maintained in browser storage.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        {mainContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Header */}
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
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Offline Recovery
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

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {mainContent}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        <span>&copy; {new Date().getFullYear()} CampusTrack — JNTUH University College of Engineering Sulthanpur. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default ConnectionLostPage;
