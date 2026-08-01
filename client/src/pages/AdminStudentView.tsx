import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Compass, Github, Linkedin, Globe, FileText, Loader2,
  Code2, FolderGit2, Briefcase, Award, BookOpen, Trophy, Sparkles, AlertTriangle
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
        // Refresh local student data records
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading student profile aggregates...</p>
      </div>
    );
  }

  const { student, codingProfiles, projects, internships, certifications, nptel, hackathons, achievements } = data;

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
    <div className="space-y-6">
      {/* Back to directory */}
      <button
        onClick={() => navigate('/admin/directory')}
        className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Student Registry
      </button>

      {/* Student Profile Summary Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 bg-slate-800 border border-slate-700/85 text-brand-400 font-extrabold text-xl rounded-2xl flex items-center justify-center shadow-md">
            {student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none">{student.fullName}</h2>
            <p className="text-slate-400 text-xs mt-1.5 font-mono">{student.rollNumber} • CSE • Section {student.section}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">BATCH {student.batch}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-center md:text-left">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CGPA</span>
            <p className="text-lg font-black text-white mt-0.5">{student.cgpa.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Semester</span>
            <p className="text-lg font-black text-white mt-0.5">{student.semester}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Completion</span>
            <p className="text-lg font-black text-brand-400 mt-0.5">{student.profileCompletion}%</p>
          </div>
        </div>
      </div>

      {/* Info & links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Contact Bio Info */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md text-xs">
          <h3 className="font-bold text-white mb-2">Student Information</h3>
          
          <div className="flex items-center space-x-3 text-slate-350">
            <Mail size={14} className="text-slate-500 shrink-0" />
            <span className="truncate">{student.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-350">
            <Phone size={14} className="text-slate-500 shrink-0" />
            <span>{student.phone}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-350">
            <Compass size={14} className="text-slate-500 shrink-0" />
            <span>{student.careerInterest}</span>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <h4 className="font-bold text-white">Professional Portfolio Links</h4>
            {student.github ? (
              <a href={student.github} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2.5 text-slate-350 hover:text-brand-400">
                <Github size={14} className="text-slate-500" />
                <span className="truncate">GitHub Profile</span>
              </a>
            ) : <p className="text-[10px] text-slate-600">No GitHub link provided</p>}
            
            {student.linkedin ? (
              <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2.5 text-slate-350 hover:text-brand-400">
                <Linkedin size={14} className="text-slate-500" />
                <span className="truncate">LinkedIn Profile</span>
              </a>
            ) : <p className="text-[10px] text-slate-600">No LinkedIn link provided</p>}

            {student.portfolio ? (
              <a href={student.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2.5 text-slate-350 hover:text-brand-400">
                <Globe size={14} className="text-slate-500" />
                <span className="truncate">Portfolio Web</span>
              </a>
            ) : <p className="text-[10px] text-slate-600">No Portfolio website</p>}

            {student.resumeLink ? (
              <a href={student.resumeLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2.5 text-brand-450 hover:underline">
                <FileText size={14} className="text-slate-500" />
                <span className="truncate">View Google Drive Resume</span>
              </a>
            ) : <p className="text-[10px] text-slate-600">No Resume uploaded</p>}
          </div>
        </div>

        {/* Right 2 Cols: Tabs & Details lists */}
        <div className="md:col-span-2 space-y-6">
          {/* Navigation tabs */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto p-1.5 space-x-1.5 scrollbar-none select-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-950/40 text-[10px] text-slate-500 font-bold border border-slate-850">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Details Panels */}
          <div className="space-y-4">
            {/* PROJECTS */}
            {activeTab === 'projects' && (
              projects.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No projects added yet.</p> :
              projects.map((p: any) => (
                <div key={p._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">{p.projectType}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{p.projectName}</h4>
                      <p className="text-slate-500 text-[10px] font-semibold">{p.category}</p>
                    </div>
                    <StatusBadge status={p.verification.status} />
                  </div>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">{p.description}</p>
                  <p className="text-slate-500 text-[10px] mt-3 font-semibold">Tech: {p.technologies.join(', ')}</p>
                  {p.verification.status === 'REJECTED' && (
                    <p className="text-rose-400 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {p.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex space-x-3 text-xs">
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-450 hover:underline">GitHub</a>}
                      {p.proofDocument && (
                        <a href={`/api/v1/documents/${p.proofDocument._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline font-semibold">
                          View Proof Document
                        </a>
                      )}
                    </div>
                    {p.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: p, module: 'projects' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* INTERNSHIPS */}
            {activeTab === 'internships' && (
              internships.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No internships added yet.</p> :
              internships.map((i: any) => (
                <div key={i._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">{i.internshipType}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{i.role}</h4>
                      <p className="text-slate-500 text-[10px] font-semibold">{i.company}</p>
                    </div>
                    <StatusBadge status={i.verification.status} />
                  </div>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">{i.description}</p>
                  <p className="text-[10px] text-slate-550 mt-3">Duration: {i.startDate.split('T')[0]} to {i.endDate.split('T')[0]}</p>
                  {i.verification.status === 'REJECTED' && (
                    <p className="text-rose-400 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {i.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex space-x-3 text-xs">
                      {i.offerLetter && <a href={`/api/v1/documents/${i.offerLetter._id}`} target="_blank" rel="noopener noreferrer" className="text-slate-450 hover:underline">Offer Letter</a>}
                      {i.certificate && <a href={`/api/v1/documents/${i.certificate._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline font-semibold">Certificate Proof</a>}
                    </div>
                    {i.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: i, module: 'internships' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* CERTIFICATIONS */}
            {activeTab === 'certifications' && (
              certifications.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No certifications added yet.</p> :
              certifications.map((c: any) => (
                <div key={c._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">{c.category}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{c.certificationName}</h4>
                      <p className="text-slate-550 text-[10px] font-semibold">{c.issuingOrganization}</p>
                    </div>
                    <StatusBadge status={c.verification.status} />
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-slate-400">
                    {c.credentialId && <p>ID: <strong className="font-mono text-slate-300">{c.credentialId}</strong></p>}
                    <p>Issue Date: <strong className="text-slate-350">{c.issueDate.split('T')[0]}</strong></p>
                  </div>
                  {c.verification.status === 'REJECTED' && (
                    <p className="text-rose-455 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {c.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex space-x-3 text-xs">
                      {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-slate-450 hover:underline">Verify Link</a>}
                      {c.certificateFile && <a href={`/api/v1/documents/${c.certificateFile._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline font-semibold">Certificate File</a>}
                    </div>
                    {c.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: c, module: 'certifications' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* NPTEL */}
            {activeTab === 'nptel' && (
              nptel.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No NPTEL records added yet.</p> :
              nptel.map((n: any) => (
                <div key={n._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-955 px-2 py-0.5 border border-slate-850 rounded">{n.certificationType}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{n.courseName}</h4>
                      <p className="text-slate-550 text-[10px] font-semibold">{n.courseId}</p>
                    </div>
                    <StatusBadge status={n.verification.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
                      <p className="text-sm font-bold text-white mt-1">{n.score}%</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Elite</span>
                      <p className="text-sm font-bold text-white mt-1">{n.eliteStatus ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rank</span>
                      <p className="text-sm font-bold text-white mt-1">{n.rank || '-'}</p>
                    </div>
                  </div>
                  {n.verification.status === 'REJECTED' && (
                    <p className="text-rose-455 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {n.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {n.certificate && (
                      <a href={`/api/v1/documents/${n.certificate._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline text-xs font-semibold">
                        View Course Certificate
                      </a>
                    )}
                    {n.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: n, module: 'nptel' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* HACKATHONS */}
            {activeTab === 'hackathons' && (
              hackathons.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No hackathons recorded yet.</p> :
              hackathons.map((h: any) => (
                <div key={h._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">{h.position}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{h.hackathonName}</h4>
                      <p className="text-slate-550 text-[10px] font-semibold">{h.organizer}</p>
                    </div>
                    <StatusBadge status={h.verification.status} />
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-slate-400">
                    {h.projectName && <p>Project: <strong className="text-slate-300">{h.projectName}</strong></p>}
                    <p>Team: <strong className="text-slate-350">{h.teamName || 'N/A'}</strong> • Role: <strong className="text-slate-350">{h.studentRole}</strong></p>
                  </div>
                  {h.verification.status === 'REJECTED' && (
                    <p className="text-rose-455 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {h.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex space-x-3 text-xs">
                      {h.projectLink && <a href={h.projectLink} target="_blank" rel="noopener noreferrer" className="text-slate-455 hover:underline">Project Code</a>}
                      {h.certificate && <a href={`/api/v1/documents/${h.certificate._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline font-semibold">View Certificate</a>}
                    </div>
                    {h.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: h, module: 'hackathons' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              achievements.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No achievements recorded yet.</p> :
              achievements.map((a: any) => (
                <div key={a._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-brand-400 font-extrabold uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">{a.level} • {a.category}</span>
                      <h4 className="font-extrabold text-white text-base mt-2">{a.achievementTitle}</h4>
                    </div>
                    <StatusBadge status={a.verification.status} />
                  </div>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">{a.description}</p>
                  {a.verification.status === 'REJECTED' && (
                    <p className="text-rose-455 text-xs bg-rose-955/20 border border-rose-900/30 rounded p-2 mt-3 font-semibold">
                      Reason: {a.verification.rejectionReason}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {a.proofDocument && (
                      <a href={`/api/v1/documents/${a.proofDocument._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:underline text-xs font-semibold">
                        View Supporting Certificate
                      </a>
                    )}
                    {a.verification.status === 'SUBMITTED' && (
                      <button
                        onClick={() => setReviewRecord({ record: a, module: 'achievements' })}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Review Submission
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* CODING PROFILES (Admin view only) */}
            {activeTab === 'coding' && (
              codingProfiles.length === 0 ? <p className="text-xs text-slate-600 text-center py-10">No coding handles connected.</p> :
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {codingProfiles.map((p: any) => (
                  <div key={p._id} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{p.platform}</h4>
                      <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-400 hover:underline">Link</a>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">User: {p.username}</p>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 text-center mt-3">
                      <div>
                        <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider block">Rating</span>
                        <span className="text-xs font-bold text-slate-200">{p.currentRating || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider block">Solved</span>
                        <span className="text-xs font-bold text-slate-200">{p.problemsSolved || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider block">Rank</span>
                        <span className="text-xs font-bold text-slate-200">{p.rank || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Verification Action Modal */}
      {reviewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setReviewRecord(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center space-x-2 text-indigo-400">
              <AlertTriangle size={18} />
              <h3 className="text-base font-bold text-white">Verification Decision Review</h3>
            </div>
            
            <p className="text-xs text-slate-400 mt-2">
              Reviewing <strong>{reviewRecord.record.projectName || reviewRecord.record.certificationName || reviewRecord.record.courseName || reviewRecord.record.achievementTitle || reviewRecord.record.role}</strong>. Please select your verification action:
            </p>

            {reviewError && (
              <div className="mt-3 p-2 bg-rose-955/20 border border-rose-900/40 text-rose-455 text-xs font-semibold rounded-lg">
                {reviewError}
              </div>
            )}

            {actionType === 'REJECTED' && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rejection Comment / Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Specify what detail was incorrect or what proof document was blurry..."
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="mt-6 flex justify-between space-x-3 pt-3 border-t border-slate-800/80">
              {actionType === 'REJECTED' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-350 text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify('REJECTED')}
                    disabled={reviewLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-center"
                  >
                    {reviewLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />}
                    Confirm Rejection
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setReviewRecord(null)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-350 text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setActionType('REJECTED')}
                      className="px-4 py-2 bg-rose-955/40 hover:bg-rose-950/60 border border-rose-900/30 text-rose-400 text-xs font-semibold rounded-xl transition-all"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActionType('VERIFIED'); handleVerify('VERIFIED'); }}
                      disabled={reviewLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center"
                    >
                      {reviewLoading && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />}
                      Approve
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentView;
