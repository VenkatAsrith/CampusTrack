import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  GraduationCap, 
  Compass, 
  Github, 
  Linkedin, 
  Globe, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Home,
  Users2,
  Layers,
  Award
} from 'lucide-react';
import api from '../services/api';
import type { Student, SemesterResult } from '../types';

interface ProfileFormValues {
  fullName: string;
  studentId: string;
  phone: string;
  studentMobile: string;
  gender: string;
  dob: string;
  branch: string;
  year: number;
  semester: number;
  motherName: string;
  motherMobile: string;
  fatherGuardianName: string;
  fatherGuardianMobile: string;
  doorNo: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  academicQualification: 'Intermediate' | 'Diploma';
  sscPercentage: number;
  intermediatePercentage: number;
  diplomaPercentage: number;
  numberOfBacklogs: number;
  careerInterest: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resumeLink: string;
}

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'parent' | 'address' | 'academic' | 'professional'>('personal');

  // Semester results state for dynamic semester percentages
  const [semesterResults, setSemesterResults] = useState<SemesterResult[]>([]);

  const { register, handleSubmit, reset, watch, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      year: 1,
      semester: 1,
      academicQualification: 'Intermediate',
      numberOfBacklogs: 0,
    }
  });

  const currentSemester = watch('semester') || 1;
  const qualification = watch('academicQualification') || 'Intermediate';

  // Calculate live CGPA from current semesterResults
  const liveCGPA = useMemo(() => {
    if (!semesterResults || semesterResults.length === 0) return 0;
    const valid = semesterResults.filter((s) => s.percentage > 0 && s.semester <= currentSemester);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, curr) => acc + curr.percentage, 0);
    return Number(((sum / valid.length) / 10).toFixed(2));
  }, [semesterResults, currentSemester]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/profile');
        const data: Student = res.data.data;
        setProfile(data);

        // Sync form values
        reset({
          fullName: data.fullName || '',
          studentId: data.studentId || '',
          phone: data.phone || data.studentMobile || '',
          studentMobile: data.studentMobile || data.phone || '',
          gender: data.gender || '',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          branch: data.branch || 'Computer Science & Engineering',
          year: data.year || 1,
          semester: data.semester || 1,
          motherName: data.motherName || '',
          motherMobile: data.motherMobile || '',
          fatherGuardianName: data.fatherGuardianName || '',
          fatherGuardianMobile: data.fatherGuardianMobile || '',
          doorNo: data.address?.doorNo || '',
          street: data.address?.street || '',
          city: data.address?.city || '',
          district: data.address?.district || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
          academicQualification: data.academicQualification === 'Diploma' ? 'Diploma' : 'Intermediate',
          sscPercentage: data.sscPercentage || 0,
          intermediatePercentage: data.intermediatePercentage || 0,
          diplomaPercentage: data.diplomaPercentage || 0,
          numberOfBacklogs: data.numberOfBacklogs || 0,
          careerInterest: data.careerInterest || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          portfolio: data.portfolio || '',
          resumeLink: data.resumeLink || '',
        });

        // Initialize semester results
        const existingResults: SemesterResult[] = data.semesterResults || [];
        const fullResults: SemesterResult[] = [];
        for (let s = 1; s <= 8; s++) {
          const match = existingResults.find((r) => r.semester === s);
          fullResults.push({
            semester: s,
            percentage: match ? match.percentage : 0,
          });
        }
        setSemesterResults(fullResults);
      } catch (err) {
        console.error('Failed to load profile.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  // Adjust semester when year changes if needed
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yr = Number(e.target.value);
    setValue('year', yr);
    // Suggest default semester based on year if outside range
    const maxSem = yr * 2;
    const minSem = maxSem - 1;
    if (currentSemester < minSem || currentSemester > maxSem) {
      setValue('semester', maxSem);
    }
  };

  const handleSemesterPercentChange = (semNumber: number, percentVal: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(percentVal) || 0));
    setSemesterResults((prev) =>
      prev.map((item) => (item.semester === semNumber ? { ...item, percentage: num } : item))
    );
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Filter semester results only up to selected current semester
      const activeSemesters = semesterResults.filter((s) => s.semester <= Number(values.semester));

      const payload = {
        fullName: values.fullName,
        studentId: values.studentId,
        phone: values.phone || values.studentMobile,
        studentMobile: values.studentMobile || values.phone,
        gender: values.gender,
        dob: values.dob || undefined,
        branch: values.branch,
        year: Number(values.year),
        semester: Number(values.semester),
        motherName: values.motherName,
        motherMobile: values.motherMobile,
        fatherGuardianName: values.fatherGuardianName,
        fatherGuardianMobile: values.fatherGuardianMobile,
        address: {
          doorNo: values.doorNo,
          street: values.street,
          city: values.city,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        },
        academicQualification: values.academicQualification,
        sscPercentage: Number(values.sscPercentage),
        intermediatePercentage: values.academicQualification === 'Intermediate' ? Number(values.intermediatePercentage) : 0,
        diplomaPercentage: values.academicQualification === 'Diploma' ? Number(values.diplomaPercentage) : 0,
        semesterResults: activeSemesters,
        numberOfBacklogs: Number(values.numberOfBacklogs),
        careerInterest: values.careerInterest,
        github: values.github,
        linkedin: values.linkedin,
        portfolio: values.portfolio,
        resumeLink: values.resumeLink,
      };

      const res = await api.put('/students/profile', payload);

      if (res.data.status === 'success') {
        setSuccessMsg('Profile and Academic information updated successfully! Overall CGPA recalculated.');
        setProfile(res.data.data);

        // Update local stored student
        const local = JSON.parse(localStorage.getItem('campustrack_student') || '{}');
        localStorage.setItem(
          'campustrack_student',
          JSON.stringify({
            ...local,
            fullName: res.data.data.fullName,
          })
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#E5E9F2] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header Profile Overview Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="glow-orb top-0 right-0 w-64 h-64 bg-[#3B50DF]/5" />
        
        <div className="flex items-center space-x-5 relative z-10">
          <div className="h-16 w-16 bg-[#3B50DF] border border-[#5B6EF5] text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-md shadow-[#3B50DF]/30">
            {profile?.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'ST'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1E1E1E] leading-tight">{profile?.fullName}</h1>
            <p className="text-[#6C757D] text-xs mt-1 font-mono">
              {profile?.rollNumber} • {profile?.branch} • Year {profile?.year || 1} (Sem {profile?.semester || 1})
            </p>
            <p className="text-[10px] text-[#3B50DF] mt-1 uppercase font-bold tracking-wider">Batch {profile?.batch}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 relative z-10">
          <div className="text-right">
            <p className="text-[#6C757D] text-[10px] uppercase font-bold tracking-wider">Overall CGPA</p>
            <div className="text-3xl font-extrabold text-[#3B50DF] mt-0.5">{profile?.cgpa || liveCGPA}</div>
          </div>
          <div className="h-10 w-[1px] bg-[#E5E9F2]"></div>
          <div className="text-right">
            <p className="text-[#6C757D] text-[10px] uppercase font-bold tracking-wider">Completeness</p>
            <div className="text-2xl font-extrabold text-[#3B50DF] mt-0.5">{profile?.profileCompletion}%</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm">
        {[
          { id: 'personal', label: 'Personal Information', icon: <User size={16} /> },
          { id: 'parent', label: 'Parent / Guardian', icon: <Users2 size={16} /> },
          { id: 'address', label: 'Permanent Address', icon: <Home size={16} /> },
          { id: 'academic', label: 'Academic Performance', icon: <GraduationCap size={16} /> },
          { id: 'professional', label: 'Professional Links', icon: <Globe size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#3B50DF] text-white shadow-sm'
                : 'text-[#6C757D] hover:bg-[#EEF2FF] hover:text-[#3B50DF]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {successMsg && (
            <div className="flex items-center p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-2.5 text-white shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4 w-4 mr-2.5 text-[#3B50DF] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-[#1E1E1E] border-b border-[#E5E9F2] pb-3">
                1. Basic Student Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Student Name</label>
                  <input
                    type="text"
                    {...register('fullName', { required: true })}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Roll Number (Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.rollNumber || ''}
                    className="block w-full px-4 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-sm text-[#6C757D] cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Student ID</label>
                  <input
                    type="text"
                    {...register('studentId')}
                    placeholder="e.g. STU-2023-089"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Institutional Email (Locked)</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="block w-full px-4 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-sm text-[#6C757D] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Student Mobile Number</label>
                  <input
                    type="tel"
                    {...register('studentMobile', { required: true })}
                    placeholder="10-digit mobile number"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Gender</label>
                  <select
                    {...register('gender')}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Branch</label>
                  <select
                    {...register('branch', { required: true })}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                    <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning (AIML)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                    <option value="Civil Engineering">Civil Engineering (CE)</option>
                    <option value="Data Science">Data Science (DS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Current Year</label>
                  <select
                    {...register('year', { valueAsNumber: true, required: true })}
                    onChange={handleYearChange}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Current Semester</label>
                  <select
                    {...register('semester', { valueAsNumber: true, required: true })}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s} (Year {Math.ceil(s / 2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARENT / GUARDIAN INFORMATION */}
          {activeTab === 'parent' && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-[#1E1E1E] border-b border-[#E5E9F2] pb-3">
                2. Parent / Guardian Contact Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center">
                    <User size={16} className="mr-2 text-[#3B50DF]" /> Mother Details
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Mother's Name</label>
                    <input
                      type="text"
                      {...register('motherName')}
                      placeholder="Mother's full name"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Mother's Mobile Number</label>
                    <input
                      type="tel"
                      {...register('motherMobile')}
                      placeholder="10-digit mobile number"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>

                <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center">
                    <User size={16} className="mr-2 text-[#3B50DF]" /> Father / Guardian Details
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">
                      Father's Name / Guardian Name
                    </label>
                    <input
                      type="text"
                      {...register('fatherGuardianName')}
                      placeholder="Father's or Guardian's full name"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">
                      Father's Mobile / Guardian Mobile
                    </label>
                    <input
                      type="tel"
                      {...register('fatherGuardianMobile')}
                      placeholder="10-digit mobile number"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERMANENT ADDRESS */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-[#1E1E1E] border-b border-[#E5E9F2] pb-3">
                3. Permanent Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">House / Door Number</label>
                  <input
                    type="text"
                    {...register('doorNo')}
                    placeholder="e.g. Flat 402, Plot 12"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Street / Area / Locality</label>
                  <input
                    type="text"
                    {...register('street')}
                    placeholder="e.g. Gandhi Nagar, Road No 5"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Village / Town / City</label>
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="e.g. Hyderabad"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">District</label>
                  <input
                    type="text"
                    {...register('district')}
                    placeholder="e.g. Rangareddy"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    placeholder="e.g. Telangana"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">PIN Code</label>
                  <input
                    type="text"
                    {...register('pincode')}
                    placeholder="6-digit PIN code"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMIC PERFORMANCE (DYNAMIC SEMESTERS & AUTO CGPA) */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E9F2]/20 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">4. Academic Information & B.Tech Semester Performance</h2>
                  <p className="text-[#6C757D] text-xs mt-0.5">
                    Semester inputs dynamically adjust based on your current semester ({currentSemester}).
                  </p>
                </div>
                <div className="flex items-center space-x-3 bg-[#3B50DF]/20 border border-[#3B50DF] px-4 py-2 rounded-xl">
                  <Award size={18} className="text-white" />
                  <div>
                    <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider block">Calculated CGPA</span>
                    <span className="text-xl font-black text-white">{liveCGPA}</span>
                  </div>
                </div>
              </div>

              {/* School & Pre-University */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">SSC Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('sscPercentage', { valueAsNumber: true })}
                    placeholder="e.g. 88.5"
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Academic Qualification</label>
                  <select
                    {...register('academicQualification')}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    <option value="Intermediate">Intermediate (10+2)</option>
                    <option value="Diploma">Diploma (Polytechnic)</option>
                  </select>
                </div>

                {qualification === 'Intermediate' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">
                      Intermediate Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register('intermediatePercentage', { valueAsNumber: true })}
                      placeholder="e.g. 92.4"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">
                      Diploma Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register('diplomaPercentage', { valueAsNumber: true })}
                      placeholder="e.g. 84.2"
                      className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                )}
              </div>

              {/* Backlogs */}
              <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">
                    Number of Academic Backlogs
                  </label>
                  <p className="text-[#6C757D] text-xs">Enter 0 if all subjects are cleared.</p>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    {...register('numberOfBacklogs', { valueAsNumber: true })}
                    className="block w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-center text-base font-bold text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              {/* Dynamic Semester Percentage Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center">
                    <Layers size={16} className="mr-2 text-[#3B50DF]" />
                    Semester-wise Percentages (Completed up to Semester {currentSemester})
                  </h3>
                  <span className="text-[10px] text-[#6C757D] uppercase tracking-widest font-mono">
                    Future semesters hidden
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                    const isApplicable = semNum <= currentSemester;
                    const semVal = semesterResults.find((s) => s.semester === semNum)?.percentage || 0;

                    if (!isApplicable) return null;

                    return (
                      <div
                        key={semNum}
                        className="p-4 bg-black/60 border border-[#E5E9F2]/30 rounded-xl space-y-2 hover:border-[#3B50DF] transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Semester {semNum}</span>
                          <span className="text-[10px] text-[#6C757D]">Year {Math.ceil(semNum / 2)}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={semVal > 0 ? semVal : ''}
                            onChange={(e) => handleSemesterPercentChange(semNum, e.target.value)}
                            placeholder="Percentage %"
                            className="block w-full pr-8 pl-3 py-2 glass-input rounded-lg text-sm text-white font-mono focus:outline-none focus:border-[#3B50DF]"
                          />
                          <span className="absolute right-3 top-2 text-xs text-[#94A3B8] font-bold">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROFESSIONAL / CAREER LINKS */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-[#1E1E1E] border-b border-[#E5E9F2] pb-3">
                5. Career Interest & Professional Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Primary Career Interest</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                      <Compass size={18} />
                    </span>
                    <input
                      type="text"
                      {...register('careerInterest')}
                      placeholder="e.g. Full Stack Web Development, Cloud Engineering, Machine Learning"
                      className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">GitHub Profile URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                      <Github size={18} />
                    </span>
                    <input
                      type="url"
                      {...register('github')}
                      placeholder="https://github.com/username"
                      className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                      <Linkedin size={18} />
                    </span>
                    <input
                      type="url"
                      {...register('linkedin')}
                      placeholder="https://linkedin.com/in/username"
                      className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Portfolio Website URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                      <Globe size={18} />
                    </span>
                    <input
                      type="url"
                      {...register('portfolio')}
                      placeholder="https://yourname.dev"
                      className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-2">Google Drive Resume Link</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8]">
                      <FileText size={18} />
                    </span>
                    <input
                      type="url"
                      {...register('resumeLink')}
                      placeholder="https://drive.google.com/file/d/..."
                      className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Submit Footer */}
          <div className="mt-8 pt-6 border-t border-[#E5E9F2]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#6C757D] text-xs">
              All changes are audited and verified during placement drives.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white font-bold text-sm tracking-wide rounded-xl shadow-md shadow-[#3B50DF]/20 border border-[#3B50DF] transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Profile & Academics'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
