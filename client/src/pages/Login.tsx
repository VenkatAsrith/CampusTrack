import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, User, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const loginFormSchema = z.object({
  rollNumber: z.string().trim().toUpperCase().optional(),
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const Login: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'student' | 'admin'>('student');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      password: '',
    }
  });

  const switchTab = (tab: 'student' | 'admin') => {
    setRoleTab(tab);
    setErrorMessage(null);
    reset({ password: '', rollNumber: '', email: '' });
  };

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMessage(null);

    const payload: any = { password: values.password };
    if (roleTab === 'student') {
      if (!values.rollNumber) {
        setErrorMessage('Roll number is required for student login.');
        setLoading(false);
        return;
      }
      payload.rollNumber = values.rollNumber;
    } else {
      if (!values.email) {
        setErrorMessage('Email is required for administrator login.');
        setLoading(false);
        return;
      }
      payload.email = values.email;
    }

    try {
      const response = await api.post('/auth/login', payload);

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        
        if (data.user.role === 'student') {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
          navigate('/student/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/10 mb-4 font-bold text-slate-950 text-xl">
            CT
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">CampusTrack</h2>
          <p className="text-slate-400 mt-2 text-sm">
            One Platform. Every Achievement. Placement Ready.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-850 rounded-xl mb-6">
            <button
              onClick={() => switchTab('student')}
              className={`flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                roleTab === 'student'
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User size={16} className="mr-2" />
              Student
            </button>
            <button
              onClick={() => switchTab('admin')}
              className={`flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                roleTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={16} className="mr-2" />
              Coordinator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMessage && (
              <div className="flex items-start p-3.5 bg-rose-950/40 border border-rose-900/40 text-rose-450 rounded-xl text-xs leading-relaxed animate-pulse">
                <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Inputs based on active tab */}
            {roleTab === 'student' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">
                  Roll Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    {...register('rollNumber')}
                    placeholder="e.g. CSE001"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all ${
                      errors.rollNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                    }`}
                  />
                </div>
                {errors.rollNumber && (
                  <p className="text-xs text-rose-500 mt-1.5 ml-1">{errors.rollNumber.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User size={18} />
                  </span>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. admin@college.edu"
                    className={`block w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all ${
                      errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1.5 ml-1">{errors.email.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <KeyRound size={18} />
                </span>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all ${
                    errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1.5 ml-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center disabled:opacity-50 ${
                roleTab === 'student'
                  ? 'bg-brand-500 text-slate-950 hover:bg-brand-600 hover:shadow-brand-500/20 active:scale-95 focus:ring-brand-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-600/20 active:scale-95 focus:ring-indigo-500'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Verifying Credentials...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts Box */}
        <div className="mt-8 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-900/80 rounded-xl p-4">
          <p className="font-semibold text-slate-400">💡 Demo Accounts Available:</p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-brand-400 font-medium">Student Account</p>
              <p className="mt-0.5">Roll: <code className="text-slate-300">CSE001</code></p>
              <p>Pass: <code className="text-slate-300">demo123</code></p>
            </div>
            <div>
              <p className="text-indigo-400 font-medium">Admin Account</p>
              <p className="mt-0.5">Email: <code className="text-slate-300">admin@college.edu</code></p>
              <p>Pass: <code className="text-slate-300">admin123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
