import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileQuestion, 
  ArrowLeft, 
  GraduationCap, 
  ShieldCheck,
  Home,
  Search,
  Compass,
  Copy,
  Check,
  Radio,
  Code2,
  FolderGit2,
  Briefcase,
  Award,
  Bell
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../services/api';

interface RouteSuggestion {
  title: string;
  category: 'Student' | 'Placement Cell' | 'Auth';
  path: string;
  description: string;
  icon: any;
}

const ALL_PORTAL_ROUTES: RouteSuggestion[] = [
  { title: 'Student Dashboard', category: 'Student', path: '/student/dashboard', description: 'Overview of academic and placement progress', icon: GraduationCap },
  { title: 'Student Profile', category: 'Student', path: '/student/profile', description: 'Personal, academic, and contact details', icon: GraduationCap },
  { title: 'Coding Profiles', category: 'Student', path: '/student/coding', description: 'LeetCode, CodeChef, HackerRank & GitHub stats', icon: Code2 },
  { title: 'Academic Projects', category: 'Student', path: '/student/projects', description: 'Software and engineering portfolio projects', icon: FolderGit2 },
  { title: 'Internship Records', category: 'Student', path: '/student/internships', description: 'Industry internships and training verification', icon: Briefcase },
  { title: 'Certifications', category: 'Student', path: '/student/certifications', description: 'Technical certifications and credentials', icon: Award },
  { title: 'NPTEL & SWAYAM Courses', category: 'Student', path: '/student/nptel', description: 'MOOC courses and verified scores', icon: Award },
  { title: 'Campus Announcements', category: 'Student', path: '/student/announcements', description: 'Placement drives and official notices', icon: Bell },
  { title: 'Placement Desk (TPO)', category: 'Placement Cell', path: '/admin/dashboard', description: 'TPO management dashboard and metrics', icon: ShieldCheck },
  { title: 'Student Directory', category: 'Placement Cell', path: '/admin/directory', description: 'Search and filter eligible candidates', icon: ShieldCheck },
  { title: 'Batch Management', category: 'Placement Cell', path: '/admin/batches', description: 'Graduation cohorts and branches', icon: ShieldCheck },
  { title: 'Student Sign In', category: 'Auth', path: '/signin', description: 'Access student placement account', icon: Home },
  { title: 'TPO Staff Sign In', category: 'Auth', path: '/tpo', description: 'Placement cell officer authorization', icon: ShieldCheck },
];

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

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

  // Filter routes based on query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return ALL_PORTAL_ROUTES.filter(
      r => r.title.toLowerCase().includes(query) ||
           r.description.toLowerCase().includes(query) ||
           r.path.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCheckConnectivity = async () => {
    setDiagnosticStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        setDiagnosticStatus('online');
      } else {
        setDiagnosticStatus('offline');
      }
    } catch {
      setDiagnosticStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Institutional Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-20">
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-2xl text-center">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            {/* Background glowing accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Error Badge */}
            <div className="relative inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
              <FileQuestion className="w-12 h-12" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
              </span>
            </div>

            <div className="font-mono text-6xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
              404
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Institutional Route Not Found
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              The page or resource you requested at <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">{window.location.pathname}</code> does not exist or may have been transitioned.
            </p>

            {/* Smart Route Search Bar */}
            <div className="relative max-w-md mx-auto mb-6">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages (e.g. Dashboard, Coding, Projects, TPO)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
                />
              </div>

              {/* Instant Search Results Dropdown */}
              {filteredRoutes.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-2 text-left animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Matching Destinations</p>
                  {filteredRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <Link
                        key={route.path}
                        to={route.path}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition group"
                      >
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{route.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{route.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{route.category}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Navigation Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>

              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Placement Desk</span>
                </Link>
              ) : isStudent ? (
                <Link
                  to="/student/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Student Portal</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Copy current URL to report broken link"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Quick Explore Cards */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                Popular Quick Destinations
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                <Link
                  to="/student/dashboard"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 transition group"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dashboard</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Academic stats</p>
                </Link>

                <Link
                  to="/student/announcements"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 transition group"
                >
                  <Bell className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Announcements</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Drives & notices</p>
                </Link>

                <Link
                  to="/student/coding"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 transition group"
                >
                  <Code2 className="w-4 h-4 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Coding Hub</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">LeetCode/GitHub</p>
                </Link>

                <Link
                  to="/tpo"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 transition group"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Placement Cell</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">TPO desk</p>
                </Link>
              </div>
            </div>

            {/* Diagnostic connectivity check */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                Network check:
                {diagnosticStatus === 'idle' && <span>Ready</span>}
                {diagnosticStatus === 'checking' && <span className="text-indigo-600 dark:text-indigo-400 font-bold">Pinging server...</span>}
                {diagnosticStatus === 'online' && <span className="text-emerald-600 dark:text-emerald-400 font-bold">API Online & Healthy</span>}
                {diagnosticStatus === 'offline' && <span className="text-rose-600 dark:text-rose-400 font-bold">Server Unreachable</span>}
              </span>

              <button
                type="button"
                onClick={handleCheckConnectivity}
                disabled={diagnosticStatus === 'checking'}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Run Ping Test
              </button>
            </div>
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
