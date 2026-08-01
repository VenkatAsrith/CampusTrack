import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, BookOpen, GraduationCap, Compass, Github, Linkedin, Globe, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface ProfileFormValues {
  fullName: string;
  phone: string;
  section: string;
  semester: number;
  cgpa: number;
  careerInterest: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resumeLink: string;
}

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<ProfileFormValues>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/profile');
        setProfile(res.data.data);
        reset({
          fullName: res.data.data.fullName,
          phone: res.data.data.phone,
          section: res.data.data.section,
          semester: res.data.data.semester,
          cgpa: res.data.data.cgpa,
          careerInterest: res.data.data.careerInterest,
          github: res.data.data.github || '',
          linkedin: res.data.data.linkedin || '',
          portfolio: res.data.data.portfolio || '',
          resumeLink: res.data.data.resumeLink || '',
        });
      } catch (err) {
        console.error('Failed to load profile.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.put('/students/profile', values);
      if (res.data.status === 'success') {
        setSuccessMsg('Profile updated successfully! Completion score recalculated.');
        setProfile(res.data.data);
        
        // Update local stored student name
        const student = JSON.parse(localStorage.getItem('campustrack_student') || '{}');
        localStorage.setItem('campustrack_student', JSON.stringify({
          ...student,
          fullName: res.data.data.fullName
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-5">
          <div className="h-16 w-16 bg-slate-800 border border-slate-700/80 text-brand-400 font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg">
            {profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">{profile.fullName}</h1>
            <p className="text-slate-400 text-xs mt-1.5 font-mono">{profile.rollNumber} • CSE • Section {profile.section}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">Batch {profile.batch}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Completeness Score</p>
          <div className="text-2xl font-black text-brand-400 mt-1">{profile.profileCompletion}%</div>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-6">Edit Personal & Career Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {successMsg && (
            <div className="flex items-center p-3.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-450 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center p-3.5 bg-rose-955/20 border border-rose-900/40 text-rose-450 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><User size={16} /></span>
                <input
                  type="text"
                  {...register('fullName')}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Phone size={16} /></span>
                <input
                  type="text"
                  {...register('phone')}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* CGPA */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current CGPA</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><GraduationCap size={16} /></span>
                <input
                  type="number"
                  step="0.01"
                  {...register('cgpa', { valueAsNumber: true })}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Semester</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><BookOpen size={16} /></span>
                <select
                  {...register('semester', { valueAsNumber: true })}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Career Interest */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Career Interest</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Compass size={16} /></span>
                <input
                  type="text"
                  {...register('careerInterest')}
                  placeholder="e.g. Full Stack Development"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* GitHub */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub Profile URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Github size={16} /></span>
                <input
                  type="url"
                  {...register('github')}
                  placeholder="https://github.com/username"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Linkedin size={16} /></span>
                <input
                  type="url"
                  {...register('linkedin')}
                  placeholder="https://linkedin.com/in/username"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portfolio Website URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Globe size={16} /></span>
                <input
                  type="url"
                  {...register('portfolio')}
                  placeholder="https://username.dev"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Resume Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Google Drive Resume Link</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><FileText size={16} /></span>
                <input
                  type="url"
                  {...register('resumeLink')}
                  placeholder="https://drive.google.com/..."
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-slate-955 font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-brand-500/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
