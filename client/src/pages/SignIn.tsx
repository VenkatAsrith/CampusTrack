import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  KeyRound, 
  Mail, 
  GraduationCap, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  UserX, 
  HelpCircle, 
  Award, 
  ChevronRight,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

// Validation Schemas
const signInSchema = z.object({
  identifier: z.string().min(1, 'Roll Number or Institutional Email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const registerSchema = z.object({
  rollNumber: z.string().min(3, 'Roll number must be at least 3 characters').trim(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  email: z.string().email('Enter a valid institutional email').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').trim(),
  branch: z.string().min(2, 'Please select your branch'),
  batch: z.string().min(4, 'Batch year is required (e.g. 2022-2026)'),
  semester: z.coerce.number().min(1).max(8),
  careerInterest: z.string().min(2, 'Career interest is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface PopupState {
  isOpen: boolean;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
  redirectPath?: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  // Sign In Form Hook
  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
    setValue: setSignInValue,
    watch: watchSignIn,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  // Student Registration Form Hook
  const {
    register: registerStudentForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rollNumber: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
      branch: 'CSE',
      batch: '2022-2026',
      semester: 6,
      careerInterest: 'Software Engineering',
    },
  });

  const currentIdentifier = watchSignIn('identifier');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (activeTab === 'admin' || val.includes('@')) {
      setSignInValue('identifier', val.toLowerCase());
    } else {
      setSignInValue('identifier', val.toUpperCase());
    }
  };

  // Perform Login
  const executeLogin = async (identifierVal: string, passwordVal: string) => {
    setLoading(true);
    const isEmail = identifierVal.includes('@');
    const formattedIdentifier = isEmail ? identifierVal.trim().toLowerCase() : identifierVal.trim().toUpperCase();

    try {
      const response = await api.post('/auth/login', {
        identifier: formattedIdentifier,
        password: passwordVal,
      });

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));

        const isStudent = data.user.role === 'student';
        const targetUrl = isStudent ? '/student/dashboard' : '/admin/dashboard';
        const displayName = isStudent 
          ? (data.student?.fullName || data.user.rollNumber) 
          : 'Training & Placement Officer';

        if (isStudent && data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Authentication Successful',
          message: `Welcome back, ${displayName}! Preparing your workspace...`,
          redirectPath: targetUrl,
        });

        setTimeout(() => {
          navigate(targetUrl);
        }, 1100);
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || '';
      const status = err.response?.status;

      const userNotFound = 
        status === 404 || 
        serverMsg.toLowerCase().includes("doesn't exist") || 
        serverMsg.toLowerCase().includes("not exist");

      if (userNotFound) {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Account Not Found',
          message: `No active account was found matching "${formattedIdentifier}". Please verify your credentials or register a new student profile.`,
        });
      } else {
        setPopup({
          isOpen: true,
          type: 'error',
          title: 'Authentication Failed',
          message: serverMsg || 'The password you entered is incorrect. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // On Sign In Submit
  const onSignIn = async (values: SignInFormValues) => {
    await executeLogin(values.identifier, values.password);
  };

  // On Student Register Submit
  const onRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        rollNumber: values.rollNumber.toUpperCase().trim(),
        email: values.email.toLowerCase().trim(),
        cgpa: 8.5,
      };

      const response = await api.post('/auth/register', payload);

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        if (data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Profile Registered Successfully! 🎓',
          message: `Welcome to CampusTrack, ${data.student.fullName}! Your student record has been initialized. Redirecting to your dashboard...`,
          redirectPath: '/student/dashboard',
        });

        setTimeout(() => {
          navigate('/student/dashboard');
        }, 1300);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please verify your details.';
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Registration Error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Demo Login
  const instantDemoLogin = async (identifier: string, pass: string, role: 'student' | 'admin') => {
    setActiveTab(role);
    setIsRegisterMode(false);
    setSignInValue('identifier', identifier);
    setSignInValue('password', pass);
    await executeLogin(identifier, pass);
  };

  const closePopupAndProceed = () => {
    const redirect = popup.redirectPath;
    setPopup((prev) => ({ ...prev, isOpen: false }));
    if (redirect) {
      navigate(redirect);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#1E1E1E] flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Top Header Navigation */}
      <header className="relative z-20 border-b border-[#E5E9F2] bg-white px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* JNTU Official Crest Logo */}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-[#E5E9F2] p-1 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
              <img 
                src="/jntulogo.png" 
                alt="JNTU Logo" 
                className="h-full w-full object-contain"
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div className="leading-tight">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#1E1E1E]">
                  CampusTrack
                </span>
                <span className="text-xs text-[#6C757D] font-bold">|</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#3B50DF] tracking-tight">
                  JNTUH University College of Engineering
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <ThemeToggle />
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#D0D7E5] text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
            >
              <HelpCircle size={14} className="text-[#3B50DF]" />
              <span>Help & Support</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: University Identity & Key Highlights */}
          <div className="lg:col-span-6 space-y-5 text-left">
            {/* Institution Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF]">
              <img 
                src="/jntulogo.png" 
                alt="JNTU" 
                className="h-3.5 w-3.5 object-contain shrink-0" 
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>JNTUH University College of Engineering</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-[#1E1E1E] leading-tight">
                Student & Placement <span className="text-[#3B50DF]">Institutional Portal</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6C757D] mt-2 font-normal">
                Official portal for academics, verification, and campus placement drives.
              </p>
            </div>

            {/* University Key Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#E5E9F2] shadow-sm">
                <div className="flex items-center text-[#3B50DF] mb-1">
                  <Award size={18} />
                </div>
                <div className="text-[22px] font-bold text-[#1E1E1E]">98.4%</div>
                <div className="text-[11px] text-[#6C757D] font-medium">Placement Rate</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E5E9F2] shadow-sm">
                <div className="flex items-center text-[#3B50DF] mb-1">
                  <Building2 size={18} />
                </div>
                <div className="text-[22px] font-bold text-[#1E1E1E]">200+</div>
                <div className="text-[11px] text-[#6C757D] font-medium">Hiring Partners</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E5E9F2] shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center text-[#3B50DF] mb-1">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-[22px] font-bold text-[#1E1E1E]">NAAC A++</div>
                <div className="text-[11px] text-[#6C757D] font-medium">Accredited Audit</div>
              </div>
            </div>

            {/* Quick 1-Click Demo Login Box */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E9F2] shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E1E1E]">
                  <span className="flex items-center">
                    <Zap size={15} className="mr-1.5 text-[#3B50DF]" />
                    Instant 1-Click Demo Access
                  </span>
                  <span className="text-[10px] text-[#6C757D] font-mono">Select persona</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => instantDemoLogin('23SS1A0535', 'demo123', 'student')}
                    className="p-3 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FE] border border-[#D9E1FC] text-left transition group active:scale-95 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3B50DF] flex items-center">
                        <GraduationCap size={13} className="mr-1 text-[#3B50DF]" />
                        Student Demo
                      </span>
                      <span className="text-[10px] bg-white text-[#3B50DF] border border-[#D9E1FC] px-1.5 py-0.5 rounded font-mono font-bold">9.14 CGPA</span>
                    </div>
                    <p className="text-[11px] text-[#1E1E1E] font-semibold mt-1">Raja Rajeshwari</p>
                    <p className="text-[10px] text-[#6C757D] font-mono">Roll: 23SS1A0535</p>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => instantDemoLogin('admin@college.edu', 'admin123', 'admin')}
                    className="p-3 rounded-xl bg-[#151B3B] hover:bg-[#1F2752] border border-[#2B3568] text-left transition group active:scale-95 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center">
                        <ShieldCheck size={13} className="mr-1 text-[#E0E4FC]" />
                        TPO / Admin Demo
                      </span>
                      <span className="text-[10px] bg-[#3B50DF] text-white px-1.5 py-0.5 rounded font-mono font-bold">Officer</span>
                    </div>
                    <p className="text-[11px] text-[#E0E4FC] font-semibold mt-1">Placement Cell</p>
                    <p className="text-[10px] text-[#E0E4FC]/70 font-mono">admin@college.edu</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Authentication Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              
              {/* Card Header with Portals & Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between border-b border-[#E5E9F2] pb-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1E1E1E]">
                      {isRegisterMode ? 'Student Registration' : 'Sign In to CampusTrack'}
                    </h2>
                    <p className="text-xs text-[#6C757D] mt-0.5 font-normal">
                      {isRegisterMode 
                        ? 'Create your verifiable academic portfolio account' 
                        : activeTab === 'student' 
                          ? 'Access achievements, internships & placement drive tracking'
                          : 'TPO & Faculty portal for verification and eligibility exports'}
                    </p>
                  </div>
                </div>

                {/* Role Selector Tabs (Only active in Sign In mode) */}
                {!isRegisterMode && (
                  <div className="grid grid-cols-2 gap-1.5 mt-4 p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('student');
                        setSignInValue('identifier', '');
                      }}
                      className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition ${
                        activeTab === 'student'
                          ? 'bg-[#3B50DF] text-white shadow-sm shadow-[#3B50DF]/20'
                          : 'text-[#6C757D] hover:text-[#1E1E1E]'
                      }`}
                    >
                      <GraduationCap size={14} className="mr-1.5" />
                      Student Portal
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('admin');
                        setSignInValue('identifier', '');
                      }}
                      className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition ${
                        activeTab === 'admin'
                          ? 'bg-[#3B50DF] text-white shadow-sm shadow-[#3B50DF]/20'
                          : 'text-[#6C757D] hover:text-[#1E1E1E]'
                      }`}
                    >
                      <Building2 size={14} className="mr-1.5" />
                      Faculty / TPO
                    </button>
                  </div>
                )}
              </div>

              {/* Mode 1: Sign In Form */}
              {!isRegisterMode ? (
                <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-4">
                  {/* Identifier Input */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1.5">
                      {activeTab === 'student' ? 'Institutional Roll Number' : 'Official Institutional Email'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                        {activeTab === 'student' ? <User size={16} /> : <Mail size={16} />}
                      </span>
                      <input
                        type="text"
                        {...registerSignIn('identifier')}
                        value={currentIdentifier}
                        onChange={handleIdentifierChange}
                        placeholder={activeTab === 'student' ? 'e.g. 23SS1A0535' : 'e.g. admin@college.edu'}
                        className={`block w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-sm font-mono tracking-wide focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15 ${
                          activeTab === 'student' ? 'uppercase' : 'lowercase'
                        }`}
                      />
                    </div>
                    {signInErrors.identifier && (
                      <p className="text-xs text-rose-600 mt-1 ml-1">{signInErrors.identifier.message}</p>
                    )}
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowHelpModal(true)}
                        className="text-[11px] text-[#3B50DF] hover:underline font-semibold"
                      >
                        Need assistance?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                        <KeyRound size={16} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerSignIn('password')}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#1E1E1E] transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signInErrors.password && (
                      <p className="text-xs text-rose-600 mt-1 ml-1">{signInErrors.password.message}</p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer select-none text-[#6C757D]">
                      <input
                        type="checkbox"
                        {...registerSignIn('rememberMe')}
                        className="rounded border-[#CBD5E1] text-[#3B50DF] focus:ring-[#3B50DF] h-4 w-4"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-[#3B50DF]/20 transition duration-200 flex items-center justify-center disabled:opacity-50 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white border border-transparent active:scale-[0.98] mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Verifying Credentials...
                      </>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight size={15} className="ml-2" />
                      </>
                    )}
                  </button>

                  {/* Toggle to Registration Mode (Students only) */}
                  <div className="pt-3 border-t border-[#E5E9F2] text-center">
                    <p className="text-xs text-[#6C757D]">
                      New Student without an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(true);
                          resetRegisterForm();
                        }}
                        className="text-[#3B50DF] hover:underline font-bold ml-1 inline-flex items-center"
                      >
                        <UserPlus size={13} className="mr-1" />
                        Register Student Profile
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Mode 2: Student Registration Form */
                <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Roll Number */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        {...registerStudentForm('rollNumber')}
                        placeholder="e.g. 23SS1A0599"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs uppercase font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                      {registerErrors.rollNumber && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.rollNumber.message}</p>
                      )}
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...registerStudentForm('fullName')}
                        placeholder="Student Full Name"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                      {registerErrors.fullName && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.fullName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        {...registerStudentForm('email')}
                        placeholder="student@college.edu"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                      {registerErrors.email && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.email.message}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        {...registerStudentForm('password')}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                      {registerErrors.password && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.password.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phone */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        {...registerStudentForm('phone')}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                      {registerErrors.phone && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{registerErrors.phone.message}</p>
                      )}
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Branch *
                      </label>
                      <select
                        {...registerStudentForm('branch')}
                        className="w-full px-2 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] text-xs focus:outline-none focus:border-[#3B50DF]"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="IT">IT</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Batch */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Batch *
                      </label>
                      <input
                        type="text"
                        {...registerStudentForm('batch')}
                        placeholder="2022-2026"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>

                    {/* Career Interest */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#1E1E1E] uppercase tracking-widest mb-1">
                        Career Interest *
                      </label>
                      <input
                        type="text"
                        {...registerStudentForm('careerInterest')}
                        placeholder="e.g. Full Stack, AI"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#1E1E1E] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  {/* Register Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-[#3B50DF]/20 transition duration-200 flex items-center justify-center disabled:opacity-50 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white border border-transparent active:scale-[0.98] mt-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Creating Student Profile...
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </button>

                  {/* Back to Sign In */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(false)}
                      className="text-xs text-[#3B50DF] hover:underline font-medium"
                    >
                      Already registered? Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-[#E5E9F2] bg-white px-6 py-4 text-center text-xs text-[#6C757D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} CampusTrack. Centralized Student Placement & Audit System.</span>
          <div className="flex items-center space-x-4">
            <span className="text-[#6C757D]">NAAC A++ Certified Platform</span>
            <span>•</span>
            <span className="text-[#6C757D]">Automated Audit & Verification</span>
          </div>
        </div>
      </footer>

      {/* MODAL: Popup for Success & Errors */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              {popup.type === 'success' ? (
                <div className="h-14 w-14 rounded-2xl bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] flex items-center justify-center shadow-md mb-3">
                  <CheckCircle2 size={30} />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-md mb-3">
                  <UserX size={30} />
                </div>
              )}

              <h3 className="text-[18px] font-bold text-[#1E1E1E]">{popup.title}</h3>
              <p className="text-xs text-[#6C757D] mt-2 leading-relaxed max-w-sm">
                {popup.message}
              </p>
            </div>

            <div className="relative z-10 pt-2 flex justify-center">
              {popup.type === 'success' ? (
                <button
                  type="button"
                  onClick={closePopupAndProceed}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight size={14} className="ml-1.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closePopupAndProceed}
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-[#F4F6FA] text-[#1E1E1E] text-xs font-bold border border-[#E2E8F0] shadow-sm transition active:scale-95"
                >
                  Close & Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F2]">
              <div className="flex items-center space-x-2 text-[#1E1E1E] font-bold text-sm">
                <HelpCircle size={18} className="text-[#3B50DF]" />
                <span>CampusTrack Institutional Help</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-[#6C757D] hover:text-[#1E1E1E] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#6C757D] space-y-3">
              <p>
                <strong className="text-[#1E1E1E]">Students:</strong> Your default login identifier is your Institutional Roll Number (e.g. <code className="text-[#3B50DF] font-bold">23SS1A0535</code>). If you haven't received your credentials or need a reset, contact your Department Coordinator.
              </p>
              <p>
                <strong className="text-[#1E1E1E]">Training & Placement Officers / Faculty:</strong> Log in using your registered institutional email (<code className="text-[#3B50DF] font-bold">admin@college.edu</code>).
              </p>
              <div className="p-3.5 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] text-[#1E1E1E]">
                <span className="font-bold text-[#1E1E1E] block mb-1">TPO Helpdesk:</span>
                Email: <span className="font-mono text-[#3B50DF] font-bold">tpo@college.edu</span><br />
                Location: Placement & Corporate Relations Cell, Admin Block
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
