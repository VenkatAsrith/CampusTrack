import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Github,
  Code2, FolderGit2, Briefcase, Award, BookOpen, Trophy, Sparkles,
  User, Users2, Home, GraduationCap, ExternalLink,
  KeyRound, Lock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const AdminStudentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  // Verification dialog states
  const [reviewRecord, setReviewRecord] = useState<{ record: any; module: string } | null>(null);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // TPO Password Change modal states (Part 16 & 17)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post(`/admin/students/${id}/change-password`, {
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess(res.data.message || 'Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update student password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      const res = await api.get(`/admin/students/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load student details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStudentData();
  }, [id]);

  const handleVerify = async (action: 'VERIFIED' | 'REJECTED') => {
    if (!reviewRecord) return;
    setReviewLoading(true);
    setReviewError(null);

    try {
      const res = await api.post(`/admin/verify/${reviewRecord.module}/${reviewRecord.record._id}`, {
        status: action,
        rejectionReason: action === 'REJECTED' ? comment : undefined,
      });

      if (res.data.status === 'success') {
        await fetchStudentData();
        setReviewRecord(null);
        setComment('');
        setActionType(null);
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit verification status.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 select-none">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading student profile details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-[#6C757D] text-sm font-semibold select-none">
        Student profile not found.
      </div>
    );
  }

  const { student, projects = [], internships = [], certifications = [], nptel = [], hackathons = [], achievements = [], codingProfiles = [] } = data;

  const tabs = [
    { id: 'projects', name: 'Projects', count: projects.length, icon: <FolderGit2 size={16} /> },
    { id: 'internships', name: 'Internships', count: internships.length, icon: <Briefcase size={16} /> },
    { id: 'certifications', name: 'Certifications', count: certifications.length, icon: <Award size={16} /> },
    { id: 'nptel', name: 'NPTEL Courses', count: nptel.length, icon: <BookOpen size={16} /> },
    { id: 'hackathons', name: 'Hackathons', count: hackathons.length, icon: <Trophy size={16} /> },
    { id: 'achievements', name: 'Achievements', count: achievements.length, icon: <Sparkles size={16} /> },
    { id: 'coding', name: 'Coding Profiles', count: codingProfiles.length, icon: <Code2 size={16} /> },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/directory')}
        className="flex items-center text-xs font-bold text-[#6C757D] hover:text-[#1E1E1E] transition-colors"
      >
        <ArrowLeft size={16} className="mr-1.5 text-[#3B50DF]" />
        Back to Student Directory
      </button>

      {/* Top Student Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="h-14 w-14 bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] font-black text-xl rounded-2xl flex items-center justify-center shadow-sm">
            {student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#1E1E1E] tracking-tight">{student.fullName}</h1>
            <p className="text-[#6C757D] text-xs mt-0.5 font-mono">
              {student.rollNumber} • {student.branch} • Year {student.year || 1} (Sem {student.semester})
            </p>
            <p className="text-[11px] text-[#6C757D] mt-0.5 uppercase font-semibold">Batch {student.batch}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="text-right">
            <span className="text-[#6C757D] text-[10px] uppercase font-bold tracking-wider block">Overall CGPA</span>
            <span className="text-[22px] font-bold text-[#1E1E1E]">{student.cgpa ? student.cgpa.toFixed(2) : '0.00'}</span>
          </div>
          <div className="h-8 w-px bg-[#E5E9F2]" />
          <div className="text-right">
            <span className="text-[#6C757D] text-[10px] uppercase font-bold tracking-wider block">Backlogs</span>
            <span className={`text-[20px] font-bold ${student.numberOfBacklogs === 0 ? 'text-[#1E1E1E]' : 'text-rose-600'}`}>
              {student.numberOfBacklogs ?? 0}
            </span>
          </div>
          <div className="h-8 w-px bg-[#E5E9F2]" />
          <div className="text-right">
            <span className="text-[#6C757D] text-[10px] uppercase font-bold tracking-wider block">Completeness</span>
            <span className="text-[22px] font-bold text-[#3B50DF]">{student.profileCompletion}%</span>
          </div>
          <div className="h-8 w-px bg-[#E5E9F2]" />
          <button
            type="button"
            onClick={() => {
              setPasswordError(null);
              setPasswordSuccess(null);
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#D0D7E5] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#1E1E1E] rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            title="Reset student password"
          >
            <KeyRound size={14} className="text-[#3B50DF]" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Expanded Student Information Blocks: Personal, Parent, Address, Academics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Personal Contact */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <User size={14} className="mr-1.5 text-[#3B50DF]" /> Personal Contact
          </h3>
          <div className="text-xs space-y-1 text-[#1E1E1E]">
            <p><span className="text-[#6C757D]">Email:</span> {student.email}</p>
            <p><span className="text-[#6C757D]">Mobile:</span> {student.studentMobile || student.phone || 'N/A'}</p>
            <p><span className="text-[#6C757D]">Student ID:</span> {student.studentId || 'N/A'}</p>
            <p><span className="text-[#6C757D]">Gender:</span> {student.gender || 'N/A'}</p>
          </div>
        </div>

        {/* Card 2: Parent / Guardian Details */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <Users2 size={14} className="mr-1.5 text-[#3B50DF]" /> Parent / Guardian
          </h3>
          <div className="text-xs space-y-1 text-[#1E1E1E]">
            <p><span className="text-[#6C757D]">Mother:</span> {student.motherName || 'N/A'}</p>
            <p><span className="text-[#6C757D]">Mother Mobile:</span> {student.motherMobile || 'N/A'}</p>
            <p><span className="text-[#6C757D]">Father/Guardian:</span> {student.fatherGuardianName || 'N/A'}</p>
            <p><span className="text-[#6C757D]">Father Mobile:</span> {student.fatherGuardianMobile || 'N/A'}</p>
          </div>
        </div>

        {/* Card 3: Permanent Address */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <Home size={14} className="mr-1.5 text-[#3B50DF]" /> Permanent Address
          </h3>
          <p className="text-xs text-[#1E1E1E] leading-relaxed">
            {[
              student.address?.doorNo,
              student.address?.street,
              student.address?.city,
              student.address?.district,
              student.address?.state,
              student.address?.pincode,
            ]
              .filter(Boolean)
              .join(', ') || 'No address provided.'}
          </p>
        </div>

        {/* Card 4: Academic Performance Summary */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <GraduationCap size={14} className="mr-1.5 text-[#3B50DF]" /> Academics & Career
          </h3>
          <div className="text-xs space-y-1 text-[#1E1E1E]">
            <p><span className="text-[#6C757D]">SSC %:</span> {student.sscPercentage ? `${student.sscPercentage}%` : 'N/A'}</p>
            <p>
              <span className="text-[#6C757D]">{student.academicQualification || 'Inter'} %:</span>{' '}
              {student.academicQualification === 'Diploma'
                ? student.diplomaPercentage ? `${student.diplomaPercentage}%` : 'N/A'
                : student.intermediatePercentage ? `${student.intermediatePercentage}%` : 'N/A'}
            </p>
            <p><span className="text-[#6C757D]">Career Interest:</span> {student.careerInterest || 'General'}</p>
          </div>
        </div>
      </div>

      {/* Semester Percentages Grid */}
      <div className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center justify-between">
          <span>B.Tech Semester Results (Current Semester: {student.semester})</span>
          <span className="text-[#3B50DF] font-mono font-bold">Overall CGPA: {student.cgpa ? student.cgpa.toFixed(2) : '0.00'}</span>
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sNum) => {
            const found = (student.semesterResults || []).find((sr: any) => sr.semester === sNum);
            const isCompleted = sNum <= student.semester;
            return (
              <div
                key={sNum}
                className={`p-2.5 rounded-xl text-center border ${
                  isCompleted
                    ? 'bg-[#EEF2FF] border-[#D9E1FC] text-[#1E1E1E]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <div className="text-[10px] font-semibold text-[#6C757D]">Sem {sNum}</div>
                <div className="text-xs font-bold font-mono mt-0.5">
                  {found && found.percentage ? `${found.percentage}%` : isCompleted ? 'N/A' : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio Submodules Review Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E9F2] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#3B50DF] text-white shadow-sm shadow-[#3B50DF]/20'
                : 'bg-white text-[#6C757D] hover:text-[#1E1E1E] border border-[#E2E8F0]'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ml-1 ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#6C757D]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No projects submitted.</div>
            ) : (
              projects.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.projectName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC] font-semibold">{item.category}</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D] line-clamp-2">{item.description}</p>
                    <div className="text-[11px] text-[#6C757D] pt-1 font-mono">
                      Tech: {item.technologies.join(', ')} • Role: {item.studentRole}
                    </div>
                    {item.githubUrl && (
                      <a href={item.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-bold text-[#3B50DF] hover:underline pt-1">
                        <Github size={12} className="mr-1" /> View GitHub Repository
                      </a>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'projects' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'projects' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INTERNSHIPS TAB */}
        {activeTab === 'internships' && (
          <div className="space-y-3">
            {internships.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No internships registered.</div>
            ) : (
              internships.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.companyName}</h4>
                      <span className="text-[10px] text-[#6C757D] font-mono">({item.role})</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D]">
                      Duration: {item.duration} • Mode: {item.mode} • Stipend: {item.stipend ? `₹${item.stipend}/mo` : 'Unpaid'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'internships' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'internships' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CERTIFICATIONS TAB */}
        {activeTab === 'certifications' && (
          <div className="space-y-3">
            {certifications.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No certifications registered.</div>
            ) : (
              certifications.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.courseName}</h4>
                      <span className="text-[10px] text-[#3B50DF] bg-[#EEF2FF] border border-[#D9E1FC] px-2 py-0.5 rounded-full font-semibold">{item.issuer}</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D]">
                      Issue Date: {new Date(item.issueDate).toLocaleDateString()} {item.credentialId && `• ID: ${item.credentialId}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'certifications' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'certifications' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NPTEL TAB */}
        {activeTab === 'nptel' && (
          <div className="space-y-3">
            {nptel.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No NPTEL records registered.</div>
            ) : (
              nptel.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.courseName}</h4>
                      <span className="text-[10px] text-[#3B50DF] bg-[#EEF2FF] border border-[#D9E1FC] px-2 py-0.5 rounded-full font-semibold">{item.certificationType}</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D]">
                      Score: {item.finalScore}% • Timeline: {item.timeline}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'nptel' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'nptel' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HACKATHONS TAB */}
        {activeTab === 'hackathons' && (
          <div className="space-y-3">
            {hackathons.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No hackathon participations registered.</div>
            ) : (
              hackathons.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.hackathonName}</h4>
                      <span className="text-[10px] text-[#3B50DF] bg-[#EEF2FF] border border-[#D9E1FC] px-2 py-0.5 rounded-full font-semibold">{item.position}</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D]">
                      Organizer: {item.organizer} • Project: {item.projectTitle}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'hackathons' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'hackathons' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="space-y-3">
            {achievements.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl shadow-sm">No achievements registered.</div>
            ) : (
              achievements.map((item: any) => (
                <div key={item._id} className="p-5 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#1E1E1E]">{item.title}</h4>
                      <span className="text-[10px] text-[#3B50DF] bg-[#EEF2FF] border border-[#D9E1FC] px-2 py-0.5 rounded-full font-semibold">{item.category}</span>
                      <StatusBadge status={item.verification.status} />
                    </div>
                    <p className="text-xs text-[#6C757D]">{item.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'achievements' }); setActionType('VERIFIED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => { setReviewRecord({ record: item, module: 'achievements' }); setActionType('REJECTED'); }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CODING PROFILES TAB */}
        {activeTab === 'coding' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {codingProfiles.length === 0 ? (
              <div className="p-8 text-center text-[#6C757D] text-xs bg-white border border-[#E5E9F2] rounded-xl col-span-3 shadow-sm">No coding platform links added.</div>
            ) : (
              codingProfiles.map((item: any) => (
                <div key={item._id} className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1E1E1E]">{item.platform}</span>
                    <span className="text-[10px] text-[#3B50DF] font-mono font-bold bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#D9E1FC]">
                      Rating: {item.rating || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6C757D]">
                    Problems Solved: <strong className="text-[#1E1E1E]">{item.problemsSolved || 0}</strong>
                  </p>
                  {item.profileUrl && (
                    <a href={item.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-[#3B50DF] hover:underline pt-1 font-semibold">
                      <ExternalLink size={12} className="mr-1" /> View Profile
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Verification Decision Modal */}
      {reviewRecord && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E1E1E]">
                {actionType === 'VERIFIED' ? 'Approve & Verify Record' : 'Reject Submission with Feedback'}
              </h3>
              <button onClick={() => setReviewRecord(null)} className="text-[#6C757D] hover:text-[#1E1E1E]">✕</button>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {reviewError}
              </div>
            )}

            <p className="text-xs text-[#6C757D] leading-relaxed">
              Confirming verification status for this submission under <strong className="text-[#1E1E1E]">{reviewRecord.module}</strong>.
            </p>

            {actionType === 'REJECTED' && (
              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">
                  Rejection Reason / Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Attached certificate is blurry or credential ID cannot be verified..."
                  className="w-full p-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewRecord(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#6C757D] hover:bg-[#F4F6FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewLoading || (actionType === 'REJECTED' && !comment.trim())}
                onClick={() => handleVerify(actionType)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  actionType === 'VERIFIED'
                    ? 'bg-[#3B50DF] hover:bg-[#2E3FB8] text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {reviewLoading ? 'Processing...' : actionType === 'VERIFIED' ? 'Confirm Verification' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TPO Secure Change Password Modal (Part 16 & 17) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full my-auto shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E9F2] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#3B50DF]">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E1E1E]">
                    Change Student Password
                  </h3>
                  <p className="text-[11px] text-[#6C757D] font-mono">
                    Roll: {student.rollNumber} • {student.fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                  <Lock size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                  <Lock size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#6C757D] leading-relaxed">
                🔒 <strong>Password Security Notice:</strong> Passwords are never displayed or stored in plaintext. Saving this will re-hash the password with bcrypt (10 rounds) in MongoDB and immediately allow the student to sign in.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={passwordLoading}
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#6C757D] hover:bg-[#F4F6FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95 disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentView;
