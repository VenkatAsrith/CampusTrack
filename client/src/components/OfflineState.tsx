import React, { useEffect, useState, Suspense, lazy } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

const ConnectionLostPage = lazy(() => import('../pages/ConnectionLostPage'));

export const OfflineState: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);
  const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      setShowDiagnosticOverlay(false);
      const timer = setTimeout(() => setShowReconnectedToast(false), 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    const handleNetworkOfflineEvent = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('campustrack:network-offline' as any, handleNetworkOfflineEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('campustrack:network-offline' as any, handleNetworkOfflineEvent);
    };
  }, []);

  // When reconnected toast is active
  if (isOnline && showReconnectedToast) {
    return (
      <aside aria-label="Reconnected notification" className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-emerald-500">
          <div className="p-1 rounded-lg bg-emerald-700/60 text-white">
            <Wifi className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <p className="font-extrabold">Connection Restored</p>
            <p className="text-[11px] text-emerald-100 font-normal">CampusTrack is back online. Session synchronizing.</p>
          </div>
        </div>
      </aside>
    );
  }

  // Normal online state
  if (isOnline) {
    return null;
  }

  // Offline banner + modal overlay
  return (
    <>
      <aside
        aria-label="Offline status banner"
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-lg transition-all flex flex-wrap items-center justify-between sm:justify-center gap-2 sm:gap-4"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
          <span>
            <strong>Connection Lost</strong> — Seems to be an internet connection issue. We are working to reconnect.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiagnosticOverlay(true)}
            className="px-2.5 py-1 bg-slate-950/15 hover:bg-slate-950/25 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.onLine) {
                setIsOnline(true);
                setShowReconnectedToast(true);
              } else {
                setShowDiagnosticOverlay(true);
              }
            }}
            className="px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check</span>
          </button>
        </div>
      </aside>

      {/* Optional Full Screen Diagnostic Overlay */}
      {showDiagnosticOverlay && (
        <Suspense fallback={null}>
          <ConnectionLostPage
            isOverlay
            onDismiss={() => setShowDiagnosticOverlay(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default OfflineState;
