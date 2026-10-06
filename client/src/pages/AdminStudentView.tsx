import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Github,
  Code2, FolderGit2, Briefcase, Award, BookOpen, Trophy, Sparkles,
  User, Users2, Home, GraduationCap, ExternalLink,
  KeyRound, Lock, CheckCircle2, AlertTriangle, FileText, Globe, Linkedin, Paperclip,
  Download, Eye
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  getDocumentDownloadUrl, 
  resolveDocumentViewUrl, 
  resolveDocumentDownloadUrl 
} from '../utils/documentUrl';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

const AdminStudentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  // Document online preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    documentUrl: string;
    downloadUrl?: string;
    fileName?: string;
    fileSize?: number;
    documentType?: string;
  }>({
    isOpen: false,
    title: '',
    documentUrl: '',
  });

  const openDocumentPreview = (title: string, docIdOrLink?: string, fileName?: string, fileSize?: number, documentType?: string) => {
    if (!docIdOrLink) return;
    const viewUrl = resolveDocumentViewUrl(docIdOrLink, data?.documents);
    const downloadUrl = resolveDocumentDownloadUrl(docIdOrLink, data?.documents);
    setPreviewModal({
      isOpen: true,
      title: title || fileName || 'Document Preview',
      documentUrl: viewUrl,
      downloadUrl: downloadUrl,
      fileName: fileName || title,
      fileSize,
      documentType,
    });
  };

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

  const { student, projects = [], internships = [], certifications = [], nptel = [], hackathons = [], achievements = [], codingProfiles = [], documents = [] } = data;

  const tabs = [
    { id: 'projects', name: 'Projects', count: projects.length, icon: <FolderGit2 size={16} /> },
    { id: 'internships', name: 'Internships', count: internships.length, icon: <Briefcase size={16} /> },
    { id: 'certifications', name: 'Certifications', count: certifications.length, icon: <Award size={16} /> },
    { id: 'nptel', name: 'NPTEL Courses', count: nptel.length, icon: <BookOpen size={16} /> },
    { id: 'hackathons', name: 'Hackathons', count: hackathons.length, icon: <Trophy size={16} /> },
    { id: 'achievements', name: 'Achievements', count: achievements.length, icon: <Sparkles size={16} /> },
    { id: 'coding', name: 'Coding Profiles', count: codingProfiles.length, icon: <Code2 size={16} /> },
    { id: 'documents', name: 'Document Vault', count: documents.length, icon: <FileText size={16} /> },
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
          <div className="h-16 w-16 bg-[#EEF2FF] border-2 border-white text-[#3B50DF] font-black text-xl rounded-2xl flex items-center justify-center shadow-md shadow-[#3B50DF]/15 overflow-hidden shrink-0">
            {student.profilePhoto ? (
              <img 
                src={student.profilePhoto} 
                alt={student.fullName} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)
            )}
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
          
          {/* Quick Resume Actions for TPO */}
          {student.resumeLink && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => openDocumentPreview(`${student.fullName} - Resume`, student.resumeLink, `${student.rollNumber}_Resume.pdf`, undefined, 'resume')}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                title="Preview resume online inside browser"
              >
                <Eye size={14} />
                <span>View Resume</span>
              </button>
              <a
                href={resolveDocumentDownloadUrl(student.resumeLink, data?.documents)}
                download={`${student.rollNumber}_Resume.pdf`}
                className="flex items-center space-x-1 px-2.5 py-2 bg-white border border-[#D0D7E5] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#1E1E1E] rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                title="Download resume directly to disk"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          )}

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

      {/* Professional Portfolio & Institutional Documents Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Professional & Social Links */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
            <Globe size={14} className="mr-1.5 text-[#3B50DF]" /> Professional & Portfolio Profiles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {student.github ? (
              <a href={student.github} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#3B50DF] hover:bg-[#EEF2FF]/50 text-[#1E1E1E] transition">
                <Github size={14} className="text-[#3B50DF]" />
                <span className="truncate font-semibold">GitHub Profile</span>
                <ExternalLink size={11} className="ml-auto text-[#6C757D]" />
              </a>
            ) : (
              <div className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#94A3B8] flex items-center space-x-2">
                <Github size={14} /> <span>GitHub: Not provided</span>
              </div>
            )}

            {student.linkedin ? (
              <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#3B50DF] hover:bg-[#EEF2FF]/50 text-[#1E1E1E] transition">
                <Linkedin size={14} className="text-[#3B50DF]" />
                <span className="truncate font-semibold">LinkedIn Profile</span>
                <ExternalLink size={11} className="ml-auto text-[#6C757D]" />
              </a>
            ) : (
              <div className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#94A3B8] flex items-center space-x-2">
                <Linkedin size={14} /> <span>LinkedIn: Not provided</span>
              </div>
            )}

            {student.portfolio ? (
              <a href={student.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#3B50DF] hover:bg-[#EEF2FF]/50 text-[#1E1E1E] transition sm:col-span-2">
                <Globe size={14} className="text-[#3B50DF]" />
                <span className="truncate font-semibold">Personal Portfolio: {student.portfolio}</span>
                <ExternalLink size={11} className="ml-auto text-[#6C757D]" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Cloud Documents Vault */}
        <div className="p-4 bg-white border border-[#E5E9F2] rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
              <FileText size={14} className="mr-1.5 text-[#3B50DF]" /> Institutional Documents Vault
            </h3>
            <span className="text-[10px] font-bold text-[#3B50DF] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
              Cloudinary Storage
            </span>
          </div>

          <div className="space-y-2">
            {student.resumeLink && (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#D9E1FC] bg-[#EEF2FF]/40 text-xs">
                <div className="flex items-center space-x-2">
                  <FileText size={15} className="text-[#3B50DF]" />
                  <div>
                    <span className="font-bold text-[#1E1E1E] block">Official Placement Resume</span>
                    <span className="text-[10px] text-[#6C757D]">Verified PDF Document</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => openDocumentPreview(`${student.fullName} - Resume`, student.resumeLink, `${student.rollNumber}_Resume.pdf`, undefined, 'resume')}
                    className="px-2.5 py-1 bg-[#3B50DF] text-white rounded-lg text-[11px] font-bold hover:bg-[#2E3FB8] flex items-center space-x-1 transition active:scale-95 shadow-sm"
                    title="View resume online"
                  >
                    <Eye size={11} />
                    <span>View</span>
                  </button>
                  <a
                    href={resolveDocumentDownloadUrl(student.resumeLink, data?.documents)}
                    download={`${student.rollNumber}_Resume.pdf`}
                    className="p-1 bg-white border border-[#D0D7E5] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#475569] hover:text-[#3B50DF] rounded-lg text-[11px] font-bold transition shadow-sm"
                    title="Download resume file"
                  >
                    <Download size={12} />
                  </a>
                </div>
              </div>
            )}

            {data?.documents && data.documents.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {data.documents.map((doc: any) => (
                  <div key={doc._id} className="flex items-center justify-between p-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText size={13} className="text-[#6C757D] shrink-0" />
                      <span className="truncate font-medium text-[#1E1E1E]">{doc.originalName}</span>
                      <span className="text-[10px] uppercase font-bold text-[#3B50DF] bg-[#EEF2FF] px-1.5 py-0.2 rounded shrink-0">
                        {doc.documentType?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => openDocumentPreview(doc.originalName || doc.filename, doc._id, doc.originalName, doc.size, doc.documentType)}
                        className="text-[#3B50DF] hover:underline font-bold text-[11px] px-1.5 py-0.5 rounded hover:bg-[#EEF2FF]"
                      >
                        View
                      </button>
                      <a
                        href={getDocumentDownloadUrl(doc._id)}
                        download={doc.originalName || doc.filename}
                        className="text-[#64748B] hover:text-[#3B50DF] p-1 rounded hover:bg-[#EEF2FF]"
                        title="Download file"
                      >
                        <Download size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : !student.resumeLink ? (
              <p className="text-xs text-[#94A3B8] italic py-2">No documents uploaded yet by this student.</p>
            ) : null}
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
                      <a href={item.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-bold text-[#3B50DF] hover:underline pt-1 mr-3">
                        <Github size={12} className="mr-1" /> View GitHub Repository
                      </a>
                    )}
                    {item.proofDocument && (
                      <div className="inline-flex items-center space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(`Project Proof - ${item.projectName}`, item.proofDocument)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                        >
                          <Eye size={12} />
                          <span>View Proof</span>
                        </button>
                        <a
                          href={resolveDocumentDownloadUrl(item.proofDocument, data?.documents)}
                          className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                          title="Download proof"
                        >
                          <Download size={13} />
                        </a>
                      </div>
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
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.certificate && (
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(`Internship Certificate - ${item.companyName}`, item.certificate)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                          >
                            <Eye size={12} />
                            <span>View Certificate</span>
                          </button>
                          <a
                            href={resolveDocumentDownloadUrl(item.certificate, data?.documents)}
                            className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                            title="Download certificate"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      )}
                      {item.offerLetter && (
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(`Offer Letter - ${item.companyName}`, item.offerLetter)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#3B50DF] text-[#475569] hover:text-white border border-[#E2E8F0] rounded-lg text-xs font-semibold transition"
                          >
                            <Eye size={12} />
                            <span>View Offer Letter</span>
                          </button>
                          <a
                            href={resolveDocumentDownloadUrl(item.offerLetter, data?.documents)}
                            className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                            title="Download offer letter"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      )}
                    </div>
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
                    {item.certificateFile && (
                      <div className="flex items-center space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(`Certificate - ${item.courseName}`, item.certificateFile)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                        >
                          <Eye size={12} />
                          <span>View Certificate</span>
                        </button>
                        <a
                          href={resolveDocumentDownloadUrl(item.certificateFile, data?.documents)}
                          className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                          title="Download certificate"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
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
                    {item.certificate && (
                      <div className="flex items-center space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(`NPTEL Certificate - ${item.courseName}`, item.certificate)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                        >
                          <Eye size={12} />
                          <span>View Certificate</span>
                        </button>
                        <a
                          href={resolveDocumentDownloadUrl(item.certificate, data?.documents)}
                          className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                          title="Download certificate"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
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
                    {item.certificate && (
                      <div className="flex items-center space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(`Hackathon Certificate - ${item.hackathonName}`, item.certificate)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                        >
                          <Eye size={12} />
                          <span>View Certificate</span>
                        </button>
                        <a
                          href={resolveDocumentDownloadUrl(item.certificate, data?.documents)}
                          className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                          title="Download certificate"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
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
                    {item.proofDocument && (
                      <div className="flex items-center space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => openDocumentPreview(`Achievement Proof - ${item.title}`, item.proofDocument)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white border border-[#D9E1FC] rounded-lg text-xs font-semibold transition"
                        >
                          <Eye size={12} />
                          <span>View Proof</span>
                        </button>
                        <a
                          href={resolveDocumentDownloadUrl(item.proofDocument, data?.documents)}
                          className="p-1 text-[#6C757D] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF] transition"
                          title="Download proof"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
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

        {/* DOCUMENTS & CREDENTIALS VAULT TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center space-x-2">
                    <FileText size={16} className="text-[#3B50DF]" />
                    <span>Institutional Document & Credentials Vault</span>
                  </h3>
                  <p className="text-xs text-[#6C757D] mt-0.5">
                    Production file storage powered by Cloudinary CDN & MongoDB Atlas metadata tracking.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC] shrink-0">
                  {documents.length} Files Stored
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center text-[#6C757D] text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  No documents or proofs have been uploaded by this student yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc: any) => {
                    const isImg = doc.documentType === 'profile_photo' || doc.mimeType?.startsWith('image/');
                    const isPdf = doc.mimeType === 'application/pdf' || doc.originalName?.endsWith('.pdf');
                    return (
                      <div key={doc._id} className="p-4 bg-white border border-[#E2E8F0] hover:border-[#3B50DF] rounded-xl shadow-sm transition flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-xl bg-[#EEF2FF] text-[#3B50DF] flex items-center justify-center shrink-0 border border-[#D9E1FC]">
                            {isImg ? (
                              doc.cloudinarySecureUrl ? (
                                <img src={doc.cloudinarySecureUrl} alt="" className="h-full w-full object-cover rounded-xl" />
                              ) : <User size={18} />
                            ) : isPdf ? (
                              <FileText size={18} />
                            ) : (
                              <Paperclip size={18} />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-bold text-[#1E1E1E] truncate" title={doc.originalName || doc.filename}>
                              {doc.originalName || doc.filename}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
                                {doc.documentType || 'proof'}
                              </span>
                              <span className="text-[10px] text-[#6C757D] font-mono">
                                {(doc.size / 1024).toFixed(1)} KB
                              </span>
                              {doc.optimizedSize && doc.originalSize && doc.originalSize > doc.optimizedSize && (
                                <span className="text-[9px] text-emerald-600 font-bold">
                                  Saved {Math.round((1 - doc.optimizedSize / doc.originalSize) * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#94A3B8] mt-1 font-mono">
                              {new Date(doc.createdAt).toLocaleDateString()} at {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(doc.originalName || doc.filename, doc._id, doc.originalName, doc.size, doc.documentType)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-[11px] font-bold shadow-sm transition active:scale-95"
                            title="Preview document online"
                          >
                            <Eye size={12} className="mr-1" />
                            <span>View</span>
                          </button>
                          <a
                            href={getDocumentDownloadUrl(doc._id)}
                            download={doc.originalName || doc.filename}
                            className="inline-flex items-center px-2 py-1.5 rounded-lg bg-white border border-[#D0D7E5] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#475569] hover:text-[#3B50DF] text-[11px] font-bold transition shadow-sm"
                            title="Download document file"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

            {/* Attached Proof Document Preview in Verification Modal */}
            {(() => {
              const docAttachment = reviewRecord.record.proofDocument || reviewRecord.record.certificate || reviewRecord.record.certificateFile || reviewRecord.record.offerLetter;
              if (!docAttachment) return null;
              const docId = typeof docAttachment === 'object' ? docAttachment._id : docAttachment;
              const docName = typeof docAttachment === 'object' ? (docAttachment.originalName || docAttachment.filename) : 'Attached Proof Document';
              return (
                <div className="p-3 bg-[#EEF2FF] border border-[#D9E1FC] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText size={14} className="text-[#3B50DF] shrink-0" />
                    <span className="font-semibold text-[#1E1E1E] truncate">Proof: {docName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => openDocumentPreview(`Proof - ${docName}`, docId, docName)}
                      className="px-2.5 py-1 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 transition shadow-sm"
                    >
                      <Eye size={11} />
                      <span>View Proof</span>
                    </button>
                  </div>
                </div>
              );
            })()}

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

      {/* Online Document Preview Modal */}
      <DocumentPreviewModal
        {...previewModal}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminStudentView;
