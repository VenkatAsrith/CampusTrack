import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileQuestion, 
  ArrowLeft, 
  GraduationCap, 
  ShieldCheck,
  Home
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  // Determine user state
  const rawUser = localStorage.getItem('campustrack_user');
  let user: any = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const isAdmin = user && (user.role === 'admin' || user.role === 'tpo');
  const isStudent = user && user.role === 'student';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Institutional Header */}
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
                  UCE Sulthanpur
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

      {/* Main 404 Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xl relative overflow-hidden">
            {/* Background radial accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Error Badge */}
            <div className="inline-flex p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
              <FileQuestion className="w-10 h-10" />
            </div>

            <div className="font-mono text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              404
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Institutional Route Not Found
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
              The URL or operational resource you requested does not exist or may have been transitioned.
            </p>

            {/* Smart Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>

              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Placement Desk</span>
                </Link>
              ) : isStudent ? (
                <Link
                  to="/student/dashboard"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Student Portal</span>
                </Link>
              )}
            </div>

            {/* Extra portal links for guests */}
            {!user && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-xs font-semibold">
                <Link
                  to="/signin"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Student Access
                </Link>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Link
                  to="/tpo"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline transition"
                >
                  Placement Cell (TPO) Access
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        <span>&copy; {new Date().getFullYear()} CampusTrack — JNTUH University College of Engineering Sulthanpur.</span>
      </footer>
    </div>
  );
};

export default NotFound;
