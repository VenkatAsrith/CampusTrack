import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Mail,
  User
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { parseRollNumber, type ParsedRollIdentity } from '../utils/rollNumberParser';
import { BRANCH_MASTER } from '../config/branchConfig';

type AuthRole = 'student' | 'tpo';
type AuthMode = 'select_role' | 'sign_in' | 'register';
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
  const [role, setRole] = useState<AuthRole>('student');
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
  const [signInIdentifier, setSignInIdentifier] = useState('');
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
    if (role === 'student' && signInIdentifier.trim().length >= 4) {
      const parsed = parseRollNumber(signInIdentifier);
      setSignInParsedRoll(parsed);
    } else {
      setSignInParsedRoll(null);
    }
  }, [signInIdentifier, role]);

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

  // Check roll number existence when moving from Step 1 in registration
  const verifyRollAvailability = async (): Promise<boolean> => {
    if (!regRollNumber || regRollNumber.trim().length < 5) {
      setFieldError('Please enter a valid institutional roll number.');
      return false;
    }

    setIsRollChecking(true);
    setFieldError(null);
    setRollExistsWarning(null);

    try {
      const res = await api.get(`/auth/check-roll/${encodeURIComponent(regRollNumber.trim())}`);
      if (res.data?.data?.exists) {
        setRollExistsWarning('An account already exists with this roll number. Sign in instead.');
        return false;
      }
      return true;
    } catch {
      // In case of network check failure, proceed gracefully
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

    if (!signInIdentifier.trim()) {
      setFieldError(role === 'student' ? 'Please enter your Institutional Roll Number' : 'Please enter your Official Email / Officer ID');
      return;
    }
    if (!signInPassword) {
      setFieldError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        identifier: signInIdentifier.trim(),
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
      const msg = err.response?.data?.message || 'Authentication failed. Please verify your credentials.';
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
    const isAvailable = await verifyRollAvailability();
    if (isAvailable) {
      setRegisterStep(2);
    }
  };

  const handleNextFromStep2 = () => {
    setFieldError(null);
    if (!regFullName.trim()) {
      setFieldError('Full Name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setFieldError('A valid official college email is required.');
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 10) {
      setFieldError('A 10-digit mobile number is required.');
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

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setLoading(true);

    const parsed = regParsedRoll || parseRollNumber(regRollNumber);
    const finalBranch = regSelectedBranch || parsed.branch || 'CSE';
    const finalBatch = parsed.batch || '2023-2027';

    const payload = {
      rollNumber: regRollNumber.trim().toUpperCase(),
      fullName: regFullName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      phone: regPhone.trim(),
      branch: finalBranch,
      batch: finalBatch,
      entryType: parsed.entryType,
      resolutionMode: parsed.resolutionMode,
      gender: regGender,
      dob: regDob ? new Date(regDob).toISOString() : undefined,
      motherName: regMotherName.trim(),
      motherMobile: regMotherMobile.trim(),
      fatherGuardianName: regFatherName.trim(),
      fatherGuardianMobile: regFatherMobile.trim(),
      academicQualification: regQualification,
      sscPercentage: Number(regSscPercentage) || 0,
      intermediatePercentage: regQualification === 'Intermediate' ? (Number(regInterPercentage) || 0) : 0,
      diplomaPercentage: regQualification === 'Diploma' ? (Number(regInterPercentage) || 0) : 0,
      cgpa: Number(regCgpa) || 0,
      numberOfBacklogs: Number(regBacklogs) || 0,
      careerInterest: regCareerInterest.trim() || 'Software Engineering',
      semester: 6, // Default active semester
    };

    try {
      const res = await api.post('/auth/register', payload);
      const { token, data } = res.data;

      if (token && data?.user) {
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        if (data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Welcome to CampusTrack',
          message: 'Your institutional student account is ready. Profile completeness: 40%.',
          redirectPath: '/student/dashboard',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. An account may already exist.';
      setFieldError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Test / Demo 1-Click Access
  // ----------------------------------------------------
  const handleInstantDemoLogin = async (identifier: string, pass: string, targetRole: AuthRole) => {
    setLoading(true);
    setFieldError(null);
    try {
      const res = await api.post('/auth/login', {
        identifier,
        password: pass,
      });

      const { token, data } = res.data;
      if (token && data?.user) {
        localStorage.setItem('campustrack_token', token);
        localStorage.setItem('campustrack_user', JSON.stringify(data.user));
        if (data.student) {
          localStorage.setItem('campustrack_student', JSON.stringify(data.student));
        }

        if (targetRole === 'tpo' || data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err: any) {
      setFieldError('Demo account login failed. Please ensure backend seed is active.');
    } finally {
      setLoading(false);
    }
  };

  const closePopupAndProceed = () => {
    const dest = popup.redirectPath || (role === 'tpo' ? '/admin/dashboard' : '/student/dashboard');
    setPopup((prev) => ({ ...prev, isOpen: false }));
    navigate(dest);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E1E1E] flex flex-col justify-between selection:bg-[#3B50DF] selection:text-white relative">
      {/* Background Institutional Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#151B3B_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Institutional Header */}
      <header className="relative z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1 border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
              <img 
                src="/jntulogo.png" 
                alt="JNTUH UCES" 
                className="h-full w-full object-contain" 
                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-[#151B3B]">
                  CampusTrack
                </span>
                <span className="text-xs text-[#94A3B8]">•</span>
                <span className="text-xs font-bold text-[#3B50DF] uppercase tracking-wider">
                  UCE Sulthanpur
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block">
                JNTUH University College of Engineering Sulthanpur
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#151B3B] font-semibold transition"
            >
              <HelpCircle size={14} className="text-[#3B50DF]" />
              <span className="hidden sm:inline">Help & Support</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Institutional Access Gateway */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Title & Portal Badge */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF]">
            <span>Student & Training Placement Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#151B3B] tracking-tight">
            Institutional Access Gateway
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
            Secure, verified access for students and the Training & Placement Cell.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SIGN IN (Student or TPO)                               */}
        {/* ------------------------------------------------------------- */}
        {mode === 'sign_in' && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden max-w-xl w-full mx-auto">
            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setFieldError(null);
                  setSignInIdentifier('');
                }}
                className={`py-3.5 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                  role === 'student'
                    ? 'border-[#3B50DF] text-[#3B50DF] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#1E1E1E]'
                }`}
              >
                <GraduationCap size={16} />
                <span>Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('tpo');
                  setFieldError(null);
                  setSignInIdentifier('');
                }}
                className={`py-3.5 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
                  role === 'tpo'
                    ? 'border-[#3B50DF] text-[#3B50DF] bg-white'
                    : 'border-transparent text-[#64748B] hover:text-[#1E1E1E]'
                }`}
              >
                <ShieldCheck size={16} />
                <span>TPO / Placement Cell</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#151B3B]">
                  {role === 'student' ? 'Student Sign In' : 'TPO & Officer Sign In'}
                </h2>
                <p className="text-xs text-[#64748B]">
                  {role === 'student'
                    ? 'Enter your institutional roll number to access your academic portfolio.'
                    : 'Sign in with your registered placement officer email or ID.'}
                </p>
              </div>

              {/* Error Alert */}
              {fieldError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed">{fieldError}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Identifier Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1.5">
                    {role === 'student' ? 'Institutional Roll Number' : 'Official Email / Officer ID'} *
                  </label>
                  <div className="relative">
                    <input
                      type={role === 'student' ? 'text' : 'email'}
                      value={signInIdentifier}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignInIdentifier(role === 'student' ? val.toUpperCase() : val);
                        setFieldError(null);
                      }}
                      placeholder={role === 'student' ? 'Example: 23SS1A0535' : 'admin@college.edu'}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15 transition"
                      autoFocus
                    />
                    <div className="absolute right-3 top-2.5 text-[#94A3B8]">
                      {role === 'student' ? <User size={16} /> : <Mail size={16} />}
                    </div>
                  </div>

                  {/* Real-Time Roll Intelligence Detection Card */}
                  {role === 'student' && signInParsedRoll && signInParsedRoll.isValidFormat && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between animate-in fade-in duration-200">
                      <div className="flex items-center space-x-2">
                        <Check size={14} className="text-emerald-600 shrink-0 font-bold" />
                        <span>
                          <strong>{signInParsedRoll.branch}</strong> • Batch {signInParsedRoll.batch} ({signInParsedRoll.entryType === 'LATERAL_ENTRY' ? 'Lateral' : 'Regular'})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-white/70 px-2 py-0.5 rounded">
                        Roll #{signInParsedRoll.rollSequence}
                      </span>
                    </div>
                  )}

                  {role === 'student' && (!signInParsedRoll || !signInParsedRoll.isValidFormat) && (
                    <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                      Format: [Admission Year][SS][Entry Code][Branch Code][Roll]
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[#151B3B] uppercase tracking-wider">
                      Password *
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
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#1E1E1E] transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-[#3B50DF]/20 transition duration-150 flex items-center justify-center disabled:opacity-50 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span>{role === 'student' ? 'Continue as Student' : 'Continue as TPO'}</span>
                      <ArrowRight size={15} className="ml-1.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Student Registration Pathway */}
              {role === 'student' && (
                <div className="pt-4 border-t border-[#F1F5F9] text-center space-y-2">
                  <p className="text-xs text-[#64748B]">New student at JNTUH UCES?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegisterStep(1);
                      setFieldError(null);
                    }}
                    className="inline-flex items-center text-xs font-bold text-[#3B50DF] hover:underline"
                  >
                    <span>Register Student Profile</span>
                    <ChevronRight size={14} className="ml-0.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: PROGRESSIVE STUDENT REGISTRATION                      */}
        {/* ------------------------------------------------------------- */}
        {mode === 'register' && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto">
            {/* Header with Step Indicator */}
            <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
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
                  className="inline-flex items-center text-xs text-[#64748B] hover:text-[#1E1E1E] font-bold"
                >
                  <ArrowLeft size={14} className="mr-1" />
                  <span>{registerStep === 1 ? 'Back to Sign In' : 'Previous Step'}</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-[#3B50DF] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#D9E1FC]">
                  Step {registerStep} of 4
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#151B3B]">
                {registerStep === 1 && 'Academic Identity Resolution'}
                {registerStep === 2 && 'Student Account Credentials'}
                {registerStep === 3 && 'Basic Personal Profile'}
                {registerStep === 4 && 'Academic History & Performance'}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {registerStep === 1 && 'Your roll number automatically identifies your batch, branch, and entry type.'}
                {registerStep === 2 && 'Set up your verified institutional login credentials.'}
                {registerStep === 3 && 'Provide personal and parent contact information.'}
                {registerStep === 4 && 'Enter prior academic scores and placement benchmark metrics.'}
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {fieldError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed">{fieldError}</span>
                </div>
              )}

              {/* STEP 1: IDENTITY RESOLUTION */}
              {registerStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1.5">
                      Institutional Roll Number *
                    </label>
                    <input
                      type="text"
                      value={regRollNumber}
                      onChange={(e) => {
                        setRegRollNumber(e.target.value.toUpperCase());
                        setFieldError(null);
                        setRollExistsWarning(null);
                      }}
                      placeholder="e.g. 23SS1A0535 or 24SS5A0501"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] font-mono uppercase focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                      autoFocus
                    />
                    <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                      Used to identify your admission year, branch, and entry type.
                    </p>
                  </div>

                  {/* Warning if already exists */}
                  {rollExistsWarning && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <p className="font-semibold">{rollExistsWarning}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSignInIdentifier(regRollNumber);
                          setMode('sign_in');
                        }}
                        className="text-xs text-[#3B50DF] font-bold underline"
                      >
                        Click here to Sign In with this Roll Number
                      </button>
                    </div>
                  )}

                  {/* Recognized Identity Preview Card */}
                  {regParsedRoll && regParsedRoll.isValidFormat && (
                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-emerald-200 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>✓ Institutional Identity Recognized</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Batch</span>
                          <span className="font-mono font-bold text-[#151B3B]">{regParsedRoll.batch}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Entry</span>
                          <span className="font-bold text-[#151B3B]">
                            {regParsedRoll.entryType === 'LATERAL_ENTRY' ? 'Lateral Entry' : 'Regular'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Branch</span>
                          <span className="font-bold text-[#3B50DF]">{regSelectedBranch}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Roll No</span>
                          <span className="font-mono font-bold text-[#151B3B]">#{regParsedRoll.rollSequence}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assisted Branch Selection (if assisted mode or student wants to verify) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1.5">
                      Verify Your Official Branch *
                    </label>
                    <select
                      value={regSelectedBranch}
                      onChange={(e) => setRegSelectedBranch(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                    >
                      {BRANCH_MASTER.map((b) => (
                        <option key={b.code} value={b.shortName}>
                          {b.shortName} — {b.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    disabled={isRollChecking}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-[#3B50DF] hover:bg-[#2E3FB8] text-white flex items-center justify-center transition shadow-md shadow-[#3B50DF]/20 disabled:opacity-50"
                  >
                    {isRollChecking ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Verifying Roll Number...
                      </>
                    ) : (
                      <>
                        <span>Continue to Account Setup</span>
                        <ArrowRight size={15} className="ml-1.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: ACCOUNT CREDENTIALS */}
              {registerStep === 2 && (
                <div className="space-y-4">
                  {/* Read-Only Identity Card */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                    <span>Roll: <strong>{regRollNumber}</strong></span>
                    <span>Branch: <strong>{regSelectedBranch}</strong></span>
                    <span>Batch: <strong>{regParsedRoll?.batch}</strong></span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Raja Rajeshwari"
                      className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Official College Email *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="student@college.edu"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Password (Min 6 chars) *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-[#3B50DF] hover:bg-[#2E3FB8] text-white flex items-center justify-center transition shadow-md shadow-[#3B50DF]/20"
                  >
                    <span>Continue to Basic Profile</span>
                    <ArrowRight size={15} className="ml-1.5" />
                  </button>
                </div>
              )}

              {/* STEP 3: BASIC PERSONAL PROFILE */}
              {registerStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Date of Birth (Optional)
                      </label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#F1F5F9] pt-3">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                      Parent / Guardian Information (Optional)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#64748B] mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={regMotherName}
                          onChange={(e) => setRegMotherName(e.target.value)}
                          placeholder="Mother's name"
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#64748B] mb-1">Mother's Mobile</label>
                        <input
                          type="tel"
                          value={regMotherMobile}
                          onChange={(e) => setRegMotherMobile(e.target.value)}
                          placeholder="9876543211"
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#64748B] mb-1">Father / Guardian Name</label>
                        <input
                          type="text"
                          value={regFatherName}
                          onChange={(e) => setRegFatherName(e.target.value)}
                          placeholder="Father's name"
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#64748B] mb-1">Father's Mobile</label>
                        <input
                          type="tel"
                          value={regFatherMobile}
                          onChange={(e) => setRegFatherMobile(e.target.value)}
                          placeholder="9876543212"
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep3}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-[#3B50DF] hover:bg-[#2E3FB8] text-white flex items-center justify-center transition shadow-md shadow-[#3B50DF]/20"
                  >
                    <span>Continue to Academic Scores</span>
                    <ArrowRight size={15} className="ml-1.5" />
                  </button>
                </div>
              )}

              {/* STEP 4: ACADEMIC PROFILE */}
              {registerStep === 4 && (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Qualification
                      </label>
                      <select
                        value={regQualification}
                        onChange={(e) => setRegQualification(e.target.value as any)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                      >
                        <option value="Intermediate">Intermediate</option>
                        <option value="Diploma">Diploma (Polytechnic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        SSC (10th) Percentage % *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={regSscPercentage}
                        onChange={(e) => setRegSscPercentage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        {regQualification} % *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={regInterPercentage}
                        onChange={(e) => setRegInterPercentage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Current CGPA *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={regCgpa}
                        onChange={(e) => setRegCgpa(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                        Active Backlogs *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={regBacklogs}
                        onChange={(e) => setRegBacklogs(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] font-mono focus:outline-none focus:border-[#3B50DF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#151B3B] uppercase tracking-wider mb-1">
                      Primary Career Interest *
                    </label>
                    <input
                      type="text"
                      value={regCareerInterest}
                      onChange={(e) => setRegCareerInterest(e.target.value)}
                      placeholder="e.g. Full Stack Development, Cloud Architecture, AI/ML"
                      className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-xs bg-[#3B50DF] hover:bg-[#2E3FB8] text-white flex items-center justify-center transition shadow-md shadow-[#3B50DF]/25 disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Creating Student Profile...
                      </>
                    ) : (
                      <>
                        <span>Complete Registration & Access Portal</span>
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DEVELOPMENT / TEST DEMO ACCESS (Clean, secondary bar)         */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm text-xs">
            <span className="text-[#64748B] font-medium text-[11px]">Development Demo Access:</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('23SS1A0535', 'demo123', 'student')}
              className="px-2.5 py-1 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FE] text-[#3B50DF] font-bold text-[11px] transition"
            >
              Student Demo (23SS1A0535) →
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('admin@college.edu', 'admin123', 'tpo')}
              className="px-2.5 py-1 rounded-lg bg-[#151B3B] hover:bg-[#1F2752] text-white font-bold text-[11px] transition"
            >
              TPO Demo (Placement Cell) →
            </button>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-20 border-t border-[#E2E8F0] bg-white px-6 py-4 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} CampusTrack — JNTUH University College of Engineering Sulthanpur.</span>
          <div className="flex items-center space-x-3">
            <span>Training & Placement Cell</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[#3B50DF] hover:underline font-semibold"
            >
              Contact TPO Helpdesk
            </button>
          </div>
        </div>
      </footer>

      {/* Success/Error Modal */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              {popup.type === 'success' ? (
                <div className="h-12 w-12 rounded-2xl bg-[#EEF2FF] text-[#3B50DF] flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <UserX size={28} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#151B3B]">{popup.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{popup.message}</p>
            </div>

            <button
              type="button"
              onClick={closePopupAndProceed}
              className="w-full py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition shadow-sm"
            >
              Continue to Portal
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2 font-bold text-sm text-[#151B3B]">
                <HelpCircle size={18} className="text-[#3B50DF]" />
                <span>Placement Cell Institutional Helpdesk</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-[#94A3B8] hover:text-[#1E1E1E] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#64748B] space-y-3">
              <p>
                <strong className="text-[#151B3B]">Student Access:</strong> Log in using your Institutional Roll Number (e.g. <code className="text-[#3B50DF] font-bold">23SS1A0535</code>). If you need an account reset or branch correction, contact your Department Coordinator.
              </p>
              <p>
                <strong className="text-[#151B3B]">Placement Officers / Staff:</strong> Use your registered official institutional email address (<code className="text-[#3B50DF] font-bold">admin@college.edu</code>).
              </p>
              <div className="p-3.5 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] text-[#151B3B]">
                <span className="font-bold block mb-1">Official Contact:</span>
                Email: <span className="font-mono text-[#3B50DF] font-bold">tpo@college.edu</span><br />
                Office: Training & Placement Cell, Administrative Block, JNTUH UCE Sulthanpur
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition"
              >
                Close Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
