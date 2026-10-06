import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Mail
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const TpoSignIn: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('tpo@jntu.in');
  const [password, setPassword] = useState('TPO@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid official institutional email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your officer password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: cleanEmail,
        password,
      });

      const { token, data } = response.data;
      if (data.user.role !== 'admin' && (data.user.role as any) !== 'tpo') {
        setErrorMessage('Access denied. This portal is restricted to Training & Placement Officers and Administrators.');
        setLoading(false);
        return;
      }

      localStorage.setItem('campustrack_token', token);
      localStorage.setItem('campustrack_user', JSON.stringify(data.user));
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify your officer credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('tpo@jntu.in');
    setPassword('TPO@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Institutional Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-900/20">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
                JNTUH UCE Sulthanpur
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Training & Placement Cell
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Officer Desk
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Student Portal
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Officer Portal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 mb-3 border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Placement Officer Access
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Authorized credentials for TPO operations, drive administration, candidate verification, and exports.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Officer Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tpo@jntu.in"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Officer Password
                  </label>
                  <button
                    type="button"
                    onClick={handleFillCredentials}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    Reset to Default
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick credential badge */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">tpo@jntu.in</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">TPO@2026</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillCredentials}
                  className="px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-md border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                >
                  Use
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-md shadow-indigo-700/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating Officer...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In to Placement Desk
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/signin"
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Are you a student? Go to Student Portal
              </Link>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
            JNTUH University College of Engineering Sulthanpur • Training & Placement Cell
          </div>
        </div>
      </main>
    </div>
  );
};

export default TpoSignIn;
