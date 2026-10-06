import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  UserX, 
  HelpCircle, 
  Check, 
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  User
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { parseRollNumber, type ParsedRollIdentity } from '../utils/rollNumberParser';
import { BRANCH_MASTER } from '../config/branchConfig';

type AuthMode = 'sign_in' | 'register';
type RegisterStep = 1 | 2 | 3 | 4;

interface PopupState {
  isOpen: boolean;
  type: 'error' | 'success';
  title: string;
  message: string;
  redirectPath?: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  // Navigation State
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);

  // Common UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  // --- Sign In Form State ---
  const [signInRollNumber, setSignInRollNumber] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInParsedRoll, setSignInParsedRoll] = useState<ParsedRollIdentity | null>(null);

  // --- Registration Form State (Progressive Onboarding) ---
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regParsedRoll, setRegParsedRoll] = useState<ParsedRollIdentity | null>(null);
  const [regSelectedBranch, setRegSelectedBranch] = useState<string>('CSE');
  const [isRollChecking, setIsRollChecking] = useState(false);
  const [rollExistsWarning, setRollExistsWarning] = useState<string | null>(null);

  // Step 2: Account
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Step 3: Basic Profile
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other' | ''>('Male');
  const [regDob, setRegDob] = useState('');
  const [regMotherName, setRegMotherName] = useState('');
  const [regMotherMobile, setRegMotherMobile] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regFatherMobile, setRegFatherMobile] = useState('');

  // Step 4: Academic Profile
  const [regQualification, setRegQualification] = useState<'Intermediate' | 'Diploma'>('Intermediate');
  const [regSscPercentage, setRegSscPercentage] = useState<string>('85.0');
  const [regInterPercentage, setRegInterPercentage] = useState<string>('88.5');
  const [regCgpa, setRegCgpa] = useState<string>('8.20');
  const [regBacklogs, setRegBacklogs] = useState<string>('0');
  const [regCareerInterest, setRegCareerInterest] = useState<string>('Software Engineering');

  // Real-time roll number parsing for Sign In
  useEffect(() => {
    if (signInRollNumber.trim().length >= 4) {
      const parsed = parseRollNumber(signInRollNumber);
      setSignInParsedRoll(parsed);
    } else {
      setSignInParsedRoll(null);
    }
  }, [signInRollNumber]);

  // Real-time roll number parsing for Registration Step 1
  useEffect(() => {
    if (regRollNumber.trim().length >= 4) {
      const parsed = parseRollNumber(regRollNumber);
      setRegParsedRoll(parsed);
      if (parsed.branch && BRANCH_MASTER.some((b) => b.shortName === parsed.branch)) {
        setRegSelectedBranch(parsed.branch);
      }
    } else {
      setRegParsedRoll(null);
      setRollExistsWarning(null);
    }
  }, [regRollNumber]);

  // Restore saved registration draft if present
  useEffect(() => {
    try {
      const draft = localStorage.getItem('campustrack_reg_draft');
      if (draft) {
        const d = JSON.parse(draft);
        if (d.rollNumber) setRegRollNumber(d.rollNumber);
        if (d.fullName) setRegFullName(d.fullName);
        if (d.email) setRegEmail(d.email);
        if (d.phone) setRegPhone(d.phone);
        if (d.gender) setRegGender(d.gender);
        if (d.dob) setRegDob(d.dob);
        if (d.qualification) setRegQualification(d.qualification);
        if (d.sscPercentage) setRegSscPercentage(d.sscPercentage);
        if (d.interPercentage) setRegInterPercentage(d.interPercentage);
        if (d.cgpa) setRegCgpa(d.cgpa);
        if (d.backlogs) setRegBacklogs(d.backlogs);
        if (d.careerInterest) setRegCareerInterest(d.careerInterest);
      }
    } catch {}
  }, []);

  // Auto-save registration inputs for zero data loss
  useEffect(() => {
    if (regRollNumber || regFullName || regEmail) {
      try {
        localStorage.setItem(
          'campustrack_reg_draft',
          JSON.stringify({
            rollNumber: regRollNumber,
            fullName: regFullName,
            email: regEmail,
            phone: regPhone,
            gender: regGender,
            dob: regDob,
            qualification: regQualification,
            sscPercentage: regSscPercentage,
            interPercentage: regInterPercentage,
            cgpa: regCgpa,
            backlogs: regBacklogs,
            careerInterest: regCareerInterest,
          })
        );
      } catch {}
    }
  }, [
    regRollNumber,
    regFullName,
    regEmail,
    regPhone,
    regGender,
    regDob,
    regQualification,
    regSscPercentage,
    regInterPercentage,
    regCgpa,
    regBacklogs,
    regCareerInterest,
  ]);

  // Check roll number existence when moving from Step 1 in registration
  const verifyRollAvailability = async (): Promise<boolean> => {
    if (!regRollNumber || regRollNumber.trim().length < 5) {
      setFieldError('Please enter a valid institutional roll number.');
      return false;
    }

    setIsRollChecking(true);
    setRollExistsWarning(null);

    try {
      const res = await api.get(`/auth/check-roll/${regRollNumber.trim()}`);
      if (res.data?.data?.exists) {
        setRollExistsWarning('An account with this roll number already exists. Please sign in instead.');
        return false;
      }
      return true;
    } catch {
      return true;
    } finally {
      setIsRollChecking(false);
    }
  };

  // ----------------------------------------------------
  // Sign In Handler
  // ----------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!signInRollNumber.trim()) {
      setFieldError('Please enter your Institutional Roll Number');
      return;
    }
    if (!signInPassword) {
      setFieldError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        identifier: signInRollNumber.trim(),
        password: signInPassword,
      });

      const { token, data } = res.data;
      if (token && data?.user) {
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        if (data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }

        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify your roll number and password.';
      setFieldError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Registration Flow Handlers
  // ----------------------------------------------------
  const handleNextFromStep1 = async () => {
    setFieldError(null);
    if (!regRollNumber.trim()) {
      setFieldError('Institutional roll number is required.');
      return;
    }

    const available = await verifyRollAvailability();
    if (!available) return;

    setRegisterStep(2);
  };

  const handleNextFromStep2 = () => {
    setFieldError(null);
    if (!regFullName.trim()) {
      setFieldError('Full Name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setFieldError('Valid institutional or official email address is required.');
      return;
    }
    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 10) {
      setFieldError('Valid 10-digit mobile number is required.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setFieldError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }

    setRegisterStep(3);
  };

  const handleNextFromStep3 = () => {
    setFieldError(null);
    setRegisterStep(4);
  };

  const handleFinalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const parsed = regParsedRoll || parseRollNumber(regRollNumber);
    const branchToSave = parsed.resolutionMode === 'AUTOMATIC' ? parsed.branch : regSelectedBranch;

    const payload = {
      rollNumber: regRollNumber.trim().toUpperCase(),
      fullName: regFullName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      password: regPassword,
      branch: branchToSave,
      gender: regGender || 'Male',
      dateOfBirth: regDob || undefined,
      parentDetails: {
        fatherName: regFatherName || undefined,
        fatherMobile: regFatherMobile || undefined,
        motherName: regMotherName || undefined,
        motherMobile: regMotherMobile || undefined,
      },
      academicDetails: {
        qualificationType: regQualification,
        sscPercentage: Number(regSscPercentage) || 0,
        interPercentage: Number(regInterPercentage) || 0,
        currentCgpa: Number(regCgpa) || 0,
        historyOfBacklogs: Number(regBacklogs) || 0,
        activeBacklogs: Number(regBacklogs) || 0,
        careerInterest: regCareerInterest,
      },
    };

    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      const { token, data } = res.data;

      if (token && data?.user) {
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        if (data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }
        localStorage.removeItem('campustrack_reg_draft');

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Institutional Profile Created',
          message: `Welcome, ${data.student?.fullName || 'Student'}! Your CampusTrack profile has been initialized with verified academic identity.`,
          redirectPath: '/student/dashboard',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please verify your details.';
      setFieldError(msg);
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        setRollExistsWarning(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const closePopupAndProceed = () => {
    const dest = popup.redirectPath || '/student/dashboard';
    setPopup((prev) => ({ ...prev, isOpen: false }));
    navigate(dest);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative font-sans transition-colors duration-200">
      {/* Background Institutional Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#151B3B_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Institutional Header */}
      <header className="relative z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
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

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/tpo"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
              title="Official Access for Placement Officers"
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Placement Officer (TPO) Desk →</span>
              <span className="sm:hidden">TPO Desk →</span>
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              <HelpCircle size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Gateway */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Title & Portal Badge */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <GraduationCap size={15} />
            <span>Student Academic & Placement Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Student Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Log in with your institutional roll number or register your verified student profile.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: STUDENT SIGN IN                                       */}
        {/* ------------------------------------------------------------- */}
        {mode === 'sign_in' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-lg w-full mx-auto">
            {/* Mode Toggle Header */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  setMode('sign_in');
                  setFieldError(null);
                }}
                className="py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 transition"
              >
                <GraduationCap size={16} />
                <span>Student Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegisterStep(1);
                  setFieldError(null);
                }}
                className="py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <User size={16} />
                <span>New Registration</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Sign In
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your institutional roll number to access your academic portfolio and placement drives.
                </p>
              </div>

              {/* Error Alert */}
              {fieldError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <span className="leading-relaxed">{fieldError}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Roll Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Institutional Roll Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signInRollNumber}
                      onChange={(e) => {
                        setSignInRollNumber(e.target.value.toUpperCase());
                        setFieldError(null);
                      }}
                      placeholder="e.g. 23SS1A0535 or 24SS5A0501"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 uppercase transition"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Accepts regular and lateral entry roll numbers (e.g. <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">23SS1A0535</span>).
                  </p>

                  {/* Real-time Roll Intelligence Preview */}
                  {signInParsedRoll && signInParsedRoll.isValidFormat && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-bold">
                        <span className="flex items-center space-x-1">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Roll Number Recognized</span>
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200">
                          {signInParsedRoll.entryType}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Batch</span>
                          <span className="font-bold">{signInParsedRoll.batch}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Branch</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{signInParsedRoll.branch}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Roll No</span>
                          <span className="font-mono font-bold">{signInParsedRoll.rollSequence || '--'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        setFieldError(null);
                      }}
                      placeholder="Enter your account password"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-indigo-600/20 transition duration-150 flex items-center justify-center disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Authenticating Student...
                    </>
                  ) : (
                    <>
                      <span>Sign In to Student Dashboard</span>
                      <ArrowRight size={15} className="ml-1.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Student Registration Pathway */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">New student at JNTUH UCES?</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegisterStep(1);
                    setFieldError(null);
                  }}
                  className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Register Institutional Profile</span>
                  <ChevronRight size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: PROGRESSIVE STUDENT REGISTRATION                      */}
        {/* ------------------------------------------------------------- */}
        {mode === 'register' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto">
            {/* Header with Step Indicator */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (registerStep > 1) {
                      setRegisterStep((prev) => (prev - 1) as RegisterStep);
                    } else {
                      setMode('sign_in');
                    }
                  }}
                  className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold"
                >
                  <ArrowLeft size={14} className="mr-1" />
                  <span>{registerStep === 1 ? 'Back to Sign In' : 'Previous Step'}</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Step {registerStep} of 4
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {registerStep === 1 && 'Step 1: Academic Identity Resolution'}
                  {registerStep === 2 && 'Step 2: Official Account Credentials'}
                  {registerStep === 3 && 'Step 3: Personal & Contact Information'}
                  {registerStep === 4 && 'Step 4: Academic Background & Verification'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {registerStep === 1 && 'Enter your roll number to automatically resolve your batch, entry type, and branch.'}
                  {registerStep === 2 && 'Set up your student account email, contact phone, and security password.'}
                  {registerStep === 3 && 'Provide your personal and parent guardian details.'}
                  {registerStep === 4 && 'Input your academic scores (SSC, Intermediate/Diploma, CGPA).'}
                </p>
              </div>

              {/* Step Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(registerStep / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Duplicate Roll Warning / Field Error */}
              {(fieldError || rollExistsWarning) && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <p className="font-semibold leading-relaxed">{fieldError || rollExistsWarning}</p>
                    {rollExistsWarning && (
                      <button
                        type="button"
                        onClick={() => {
                          setSignInRollNumber(regRollNumber);
                          setMode('sign_in');
                        }}
                        className="text-xs font-bold text-indigo-700 dark:text-indigo-300 underline hover:no-underline block"
                      >
                        Click here to Sign In with {regRollNumber} →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* STEP 1: IDENTITY RESOLUTION                                */}
              {/* ----------------------------------------------------------- */}
              {registerStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Institutional Roll Number *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regRollNumber}
                        onChange={(e) => {
                          setRegRollNumber(e.target.value.toUpperCase());
                          setFieldError(null);
                        }}
                        placeholder="e.g. 23SS1A0535 or 24SS5A0501"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 uppercase transition"
                        autoFocus
                      />
                      {isRollChecking && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 size={16} className="animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Your institutional roll number automatically determines your batch year, regular/lateral status, branch, and roll index.
                    </p>
                  </div>

                  {/* Real-time Parsed Roll Card */}
                  {regParsedRoll && regParsedRoll.isValidFormat && (
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                          <CheckCircle2 size={15} className="text-emerald-500" />
                          <span>Academic Identity Recognized</span>
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-bold uppercase">
                          {regParsedRoll.resolutionMode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Admission Year</span>
                          <span className="font-bold text-slate-900 dark:text-white">{regParsedRoll.admissionYear}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Graduation Batch</span>
                          <span className="font-bold text-slate-900 dark:text-white">{regParsedRoll.batch}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entry Type</span>
                          <span className="font-bold text-slate-900 dark:text-white">{regParsedRoll.entryType}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{regParsedRoll.branch}</span>
                        </div>
                      </div>

                      {/* Assisted Mode: When Branch is novel or partially matched */}
                      {regParsedRoll.resolutionMode === 'ASSISTED' && (
                        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Verify your Engineering Branch:
                          </label>
                          <select
                            value={regSelectedBranch}
                            onChange={(e) => setRegSelectedBranch(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                          >
                            {BRANCH_MASTER.map((b) => (
                              <option key={b.shortName} value={b.shortName}>
                                {b.shortName} — {b.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isRollChecking || !regRollNumber.trim()}
                    onClick={handleNextFromStep1}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Confirm Identity & Proceed</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* STEP 2: ACCOUNT CREDENTIALS                                 */}
              {/* ----------------------------------------------------------- */}
              {registerStep === 2 && (
                <div className="space-y-4">
                  {/* Confirmed Badge */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Roll: <strong className="font-mono text-slate-900 dark:text-white">{regRollNumber}</strong> ({regParsedRoll?.branch} • {regParsedRoll?.batch})
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <Check size={14} />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Full Student Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="As per SSC / Official College Records"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Official College / Personal Email *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value.toLowerCase())}
                          placeholder="student@college.edu"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Set Account Password *
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center space-x-1.5 mt-2 cursor-pointer"
                  >
                    <span>Save Account & Continue</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* STEP 3: PERSONAL DETAILS                                    */}
              {/* ----------------------------------------------------------- */}
              {registerStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e: any) => setRegGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                      Parent / Guardian Information (Optional)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Father's Name</label>
                        <input
                          type="text"
                          value={regFatherName}
                          onChange={(e) => setRegFatherName(e.target.value)}
                          placeholder="Father's full name"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Father's Contact</label>
                        <input
                          type="tel"
                          value={regFatherMobile}
                          onChange={(e) => setRegFatherMobile(e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={regMotherName}
                          onChange={(e) => setRegMotherName(e.target.value)}
                          placeholder="Mother's full name"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mother's Contact</label>
                        <input
                          type="tel"
                          value={regMotherMobile}
                          onChange={(e) => setRegMotherMobile(e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep3}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center space-x-1.5 mt-2 cursor-pointer"
                  >
                    <span>Proceed to Academic Records</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* STEP 4: ACADEMIC DETAILS & SUBMISSION                       */}
              {/* ----------------------------------------------------------- */}
              {registerStep === 4 && (
                <form onSubmit={handleFinalRegistration} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Pre-University
                      </label>
                      <select
                        value={regQualification}
                        onChange={(e: any) => setRegQualification(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                      >
                        <option value="Intermediate">Intermediate (10+2)</option>
                        <option value="Diploma">Diploma (Polytechnic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        SSC Score (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={regSscPercentage}
                        onChange={(e) => setRegSscPercentage(e.target.value)}
                        placeholder="e.g. 85.5"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        {regQualification} Score (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={regInterPercentage}
                        onChange={(e) => setRegInterPercentage(e.target.value)}
                        placeholder="e.g. 88.0"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Current B.Tech CGPA *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={regCgpa}
                        onChange={(e) => setRegCgpa(e.target.value)}
                        placeholder="e.g. 8.25"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Active Backlogs
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={regBacklogs}
                        onChange={(e) => setRegBacklogs(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Primary Career Interest
                    </label>
                    <input
                      type="text"
                      value={regCareerInterest}
                      onChange={(e) => setRegCareerInterest(e.target.value)}
                      placeholder="e.g. Software Engineering / Cloud / AI-ML / Core"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Creating Student Profile...
                      </>
                    ) : (
                      <>
                        <span>Complete Registration & Access Student Dashboard</span>
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} CampusTrack — JNTUH University College of Engineering Sulthanpur.</span>
          <div className="flex items-center space-x-3">
            <Link to="/tpo" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Training & Placement Cell (TPO) Access →
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:underline font-semibold"
            >
              Institutional Helpdesk
            </button>
          </div>
        </div>
      </footer>

      {/* Success/Error Modal */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              {popup.type === 'success' ? (
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                  <UserX size={28} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{popup.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{popup.message}</p>
            </div>

            <button
              type="button"
              onClick={closePopupAndProceed}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Continue to Student Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                <HelpCircle size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Student Portal Helpdesk</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p>
                <strong className="text-slate-900 dark:text-white">Student Access:</strong> Log in using your Institutional Roll Number (e.g. <code className="text-indigo-600 dark:text-indigo-400 font-bold">23SS1A0535</code>). If you encounter any identity resolution issues, contact your Department Placement Coordinator.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Placement Officers / TPO:</strong> Training & Placement officers access their administrative command desk via <Link to="/tpo" className="text-indigo-600 dark:text-indigo-400 font-bold underline">/tpo</Link>.
              </p>
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white">
                <span className="font-bold block mb-1">Official TPO Contact:</span>
                Email: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">tpo@jntu.in</span><br />
                Office: Training & Placement Cell, Administrative Block, JNTUH UCE Sulthanpur
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
