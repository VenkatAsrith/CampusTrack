import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Clock, 
  Search, 
  Building2, 
  GraduationCap, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Loader2, 
  Lock, 
  Sparkles, 
  MapPin, 
  Banknote, 
  X 
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import type { Announcement, PlacementApplication, FormField } from '../types';
import { normalizeBranch } from '../config/branchConfig';

const StudentAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Application Modal State
  const [applyingDrive, setApplyingDrive] = useState<Announcement | null>(null);
  const [applicationResponses, setApplicationResponses] = useState<Record<string, any>>({});
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  // Student's existing applications map (keyed by driveId)
  const [myApplications, setMyApplications] = useState<Record<string, PlacementApplication>>({});

  // Fetch Student Profile
  useEffect(() => {
    const cachedStudent = localStorage.getItem('campustrack_student');
    if (cachedStudent) {
      try {
        setStudentProfile(JSON.parse(cachedStudent));
      } catch {}
    }

    api.get('/students/profile/me')
      .then((res) => {
        if (res.data?.data) {
          setStudentProfile(res.data.data);
          localStorage.setItem('campustrack_student', JSON.stringify(res.data.data));
        }
      })
      .catch(() => {});
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements', {
        params: {
          search: search || undefined,
          type: filterType !== 'all' ? filterType : undefined,
        },
      });
      const list: Announcement[] = res.data.data.all || [];
      setAnnouncements(list);

      // Fetch applications status for placement drives
      const placementItems = list.filter((a) => a.isPlacementDrive || a.type === 'Placement' || a.type === 'Drive');
      const appsMap: Record<string, PlacementApplication> = {};

      await Promise.allSettled(
        placementItems.map(async (item) => {
          try {
            const appRes = await api.get(`/announcements/${item._id}/my-application`);
            if (appRes.data?.data) {
              appsMap[item._id] = appRes.data.data;
            }
          } catch {}
        })
      );
      setMyApplications(appsMap);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  // Eligibility Evaluation Engine
  const evaluateEligibility = (drive: Announcement) => {
    if (!studentProfile || !drive.eligibility) {
      return { eligible: true, reasons: [] };
    }
    const elig = drive.eligibility;
    const reasons: string[] = [];

    if (elig.minCGPA && (studentProfile.cgpa || 0) < elig.minCGPA) {
      reasons.push(`Minimum CGPA required is ${elig.minCGPA} (Your CGPA: ${(studentProfile.cgpa || 0).toFixed(2)})`);
    }

    if (elig.maxBacklogs !== undefined && elig.maxBacklogs !== null && (studentProfile.numberOfBacklogs ?? 0) > elig.maxBacklogs) {
      reasons.push(`Maximum backlogs allowed is ${elig.maxBacklogs} (You have: ${studentProfile.numberOfBacklogs || 0})`);
    }

    if (elig.eligibleBranches && elig.eligibleBranches.length > 0) {
      const studentBranchNorm = normalizeBranch(studentProfile.branch);
      const isAllowed = elig.eligibleBranches.some((b) => normalizeBranch(b) === studentBranchNorm);
      if (!isAllowed) {
        reasons.push(`Open for branches: ${elig.eligibleBranches.join(', ')} (Your branch: ${studentProfile.branch})`);
      }
    }

    if (elig.eligibleBatches && elig.eligibleBatches.length > 0) {
      if (!elig.eligibleBatches.includes(studentProfile.batch)) {
        reasons.push(`Open for batches: ${elig.eligibleBatches.join(', ')} (Your batch: ${studentProfile.batch})`);
      }
    }

    if (elig.eligibleYears && elig.eligibleYears.length > 0) {
      if (!elig.eligibleYears.includes(studentProfile.year)) {
        reasons.push(`Open for: ${elig.eligibleYears.map((y) => `Year ${y}`).join(', ')} (Your year: Year ${studentProfile.year})`);
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  };

  const handleOpenApplication = (drive: Announcement) => {
    setSelectedAnnouncement(null);
    setApplyingDrive(drive);
    setApplicationResponses({});
    setAppError(null);
    setAppSuccess(null);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingDrive) return;

    // Validate required custom fields
    const customFields = applyingDrive.applicationForm?.fields || [];
    for (const f of customFields) {
      if (f.required) {
        const val = applicationResponses[f.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          setAppError(`Please answer: "${f.label}"`);
          return;
        }
      }
    }

    setSubmittingApp(true);
    setAppError(null);
    setAppSuccess(null);

    try {
      const res = await api.post(`/announcements/${applyingDrive._id}/apply`, {
        responses: applicationResponses,
      });

      const newApp = res.data?.data;
      setAppSuccess('Your application has been successfully submitted! The TPO has received your verified profile.');
      if (newApp) {
        setMyApplications((prev) => ({ ...prev, [applyingDrive._id]: newApp }));
      }
      setTimeout(() => {
        setApplyingDrive(null);
        setAppSuccess(null);
      }, 2000);
    } catch (err: any) {
      setAppError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const types = ['all', 'Placement', 'Drive', 'Internship', 'Academic', 'Event', 'General'];

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-2">
            <Megaphone size={14} />
            <span>Placement & Notice Feed</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#151B3B] tracking-tight">
            Announcements & Placement Drives
          </h1>
          <p className="text-[#64748B] text-xs mt-1">
            Real-time corporate recruitment pipelines, eligibility filters, and department circulars.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-[#E5E9F2] p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === t
                  ? 'bg-[#3B50DF] text-white shadow-sm'
                  : 'bg-[#F4F6FA] text-[#64748B] hover:text-[#1E1E1E] border border-[#E2E8F0]'
              }`}
            >
              {t === 'all' ? 'All Updates' : t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
        </form>
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="h-8 w-8 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-xs font-semibold">Loading placement announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-12 text-center text-[#64748B] shadow-sm">
          <Megaphone size={36} className="mx-auto text-[#94A3B8] mb-3" />
          <p className="text-sm font-semibold text-[#1E1E1E]">No active announcements matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {announcements.map((item) => {
            const isDrive = item.isPlacementDrive || item.type === 'Placement' || item.type === 'Drive';
            const { eligible, reasons } = evaluateEligibility(item);
            const existingApplication = myApplications[item._id];
            const isDeadlinePassed = item.endDate && new Date() > new Date(item.endDate);

            return (
              <div
                key={item._id}
                className="bg-white border border-[#E5E9F2] hover:border-[#3B50DF] rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                      {item.type}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#151B3B] line-clamp-1 group-hover:text-[#3B50DF] transition">
                      {item.title}
                    </h3>
                    {item.companyName && (
                      <p className="text-xs text-[#3B50DF] font-semibold mt-1 flex items-center">
                        <Building2 size={13} className="mr-1 shrink-0" />
                        <span>{item.companyName} {item.jobRole && `• ${item.jobRole}`}</span>
                      </p>
                    )}
                  </div>

                  {/* Compensation & Location Badges */}
                  {(item.compensation || item.location) && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-mono">
                      {item.compensation && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          <Banknote size={12} className="mr-1" />
                          {item.compensation}
                        </span>
                      )}
                      {item.location && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                          <MapPin size={11} className="mr-1 text-slate-500" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* AUTOMATED ELIGIBILITY STATUS BADGE */}
                  {isDrive && (
                    <div className="pt-2">
                      {existingApplication ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Applied: {existingApplication.status}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700">
                            {new Date(existingApplication.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : eligible ? (
                        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex items-center space-x-1.5 font-bold">
                          <Sparkles size={13} className="text-emerald-600 shrink-0" />
                          <span>Eligible for you ✓</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-0.5">
                          <div className="flex items-center space-x-1 font-bold text-amber-800">
                            <AlertCircle size={12} className="shrink-0 text-amber-600" />
                            <span>Not eligible for this drive</span>
                          </div>
                          <p className="text-[10px] text-amber-700 leading-tight">
                            {reasons[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E9F2] flex items-center justify-between text-xs text-[#64748B]">
                  <div className="flex items-center space-x-1">
                    <Clock size={12} className="text-[#3B50DF]" />
                    <span className="text-[11px]">
                      {item.endDate ? `Deadline: ${new Date(item.endDate).toLocaleDateString()}` : 'Open ended'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Direct Apply Button if Drive & Eligible & Not Applied */}
                    {isDrive && eligible && !existingApplication && !isDeadlinePassed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenApplication(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="text-xs font-bold text-[#3B50DF] hover:underline flex items-center"
                      >
                        Details <ChevronRight size={13} className="ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: GOOGLE-FORMS-STYLE UNIVERSAL APPLICATION MODAL        */}
      {/* ------------------------------------------------------------- */}
      {applyingDrive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm"
            onClick={() => !submittingApp && setApplyingDrive(null)}
          />

          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E5E9F2]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
                  Placement Drive Application
                </span>
                <h3 className="text-lg font-extrabold text-[#151B3B] mt-1">
                  {applyingDrive.companyName || applyingDrive.title}
                </h3>
                <p className="text-xs text-[#64748B] font-mono">
                  {applyingDrive.jobRole} {applyingDrive.compensation && `• ${applyingDrive.compensation}`}
                </p>
              </div>

              <button
                type="button"
                disabled={submittingApp}
                onClick={() => setApplyingDrive(null)}
                className="p-1.5 rounded-xl bg-[#F4F6FA] text-[#64748B] hover:text-[#1E1E1E] transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Success Alert */}
            {appSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-bold animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{appSuccess}</span>
              </div>
            )}

            {/* Error Alert */}
            {appError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{appError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-6">
              {/* SYSTEM FIELDS: AUTO-PREFILLED & VERIFIED (READ-ONLY) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#151B3B]">
                    <Lock size={13} className="text-[#3B50DF]" />
                    <span>Verified Academic Identity (Auto-Prefilled from CampusTrack)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    Read Only
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Candidate Name</span>
                    <span className="font-semibold text-[#151B3B] truncate block" title={studentProfile?.fullName}>
                      {studentProfile?.fullName}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Roll Number</span>
                    <span className="font-mono font-bold text-[#151B3B]">
                      {studentProfile?.rollNumber}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Branch & Batch</span>
                    <span className="font-semibold text-[#3B50DF]">
                      {studentProfile?.branch} ({studentProfile?.batch})
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">CGPA / Backlogs</span>
                    <span className="font-mono font-bold text-[#151B3B]">
                      {studentProfile?.cgpa ? Number(studentProfile.cgpa).toFixed(2) : '0.00'} • {studentProfile?.numberOfBacklogs ?? 0} BL
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#64748B] pt-1">
                  <div>Email: <strong className="text-[#1E1E1E]">{studentProfile?.email}</strong></div>
                  <div>Phone: <strong className="text-[#1E1E1E]">{studentProfile?.studentMobile || studentProfile?.phone}</strong></div>
                </div>
              </div>

              {/* CUSTOM QUESTIONS (GOOGLE FORMS STYLE BUILDER OUTPUT) */}
              {applyingDrive.applicationForm?.fields && applyingDrive.applicationForm.fields.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#151B3B] uppercase tracking-wider">
                    <FileText size={14} className="text-[#3B50DF]" />
                    <span>Company Specific Questions</span>
                  </div>

                  {applyingDrive.applicationForm.fields.map((field: FormField) => (
                    <div key={field.id} className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-[#151B3B]">
                        {field.label} {field.required && <span className="text-rose-600">*</span>}
                      </label>
                      {field.helpText && (
                        <p className="text-[11px] text-[#64748B]">{field.helpText}</p>
                      )}

                      {/* TEXT / EMAIL / PHONE / NUMBER INPUT */}
                      {['TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'URL'].includes(field.type) && (
                        <input
                          type={field.type === 'NUMBER' ? 'number' : field.type === 'EMAIL' ? 'email' : 'text'}
                          placeholder={field.placeholder || 'Your response...'}
                          value={applicationResponses[field.id] || ''}
                          onChange={(e) =>
                            setApplicationResponses({ ...applicationResponses, [field.id]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                        />
                      )}

                      {/* LONG TEXT */}
                      {field.type === 'LONG_TEXT' && (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || 'Your response...'}
                          value={applicationResponses[field.id] || ''}
                          onChange={(e) =>
                            setApplicationResponses({ ...applicationResponses, [field.id]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                        />
                      )}

                      {/* RADIO / YES_NO */}
                      {(field.type === 'RADIO' || field.type === 'YES_NO') && (
                        <div className="space-y-1.5 pt-1">
                          {(field.type === 'YES_NO' ? ['Yes', 'No'] : field.options || []).map((opt) => (
                            <label key={opt} className="flex items-center space-x-2 text-xs text-[#1E1E1E] cursor-pointer">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={applicationResponses[field.id] === opt}
                                onChange={() =>
                                  setApplicationResponses({ ...applicationResponses, [field.id]: opt })
                                }
                                className="accent-[#3B50DF]"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* DROPDOWN */}
                      {field.type === 'DROPDOWN' && (
                        <select
                          value={applicationResponses[field.id] || ''}
                          onChange={(e) =>
                            setApplicationResponses({ ...applicationResponses, [field.id]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                        >
                          <option value="">Select option...</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* CHECKBOX / MULTI_SELECT */}
                      {(field.type === 'CHECKBOX' || field.type === 'MULTI_SELECT') && (
                        <div className="space-y-1.5 pt-1">
                          {(field.options || []).map((opt) => {
                            const curList: string[] = applicationResponses[field.id] || [];
                            const isChecked = curList.includes(opt);
                            return (
                              <label key={opt} className="flex items-center space-x-2 text-xs text-[#1E1E1E] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = isChecked
                                      ? curList.filter((x) => x !== opt)
                                      : [...curList, opt];
                                    setApplicationResponses({ ...applicationResponses, [field.id]: next });
                                  }}
                                  className="accent-[#3B50DF]"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submission CTA */}
              <div className="pt-4 border-t border-[#E5E9F2] flex items-center justify-between">
                <p className="text-[11px] text-[#64748B]">
                  Clicking submit binds your verified credentials to this drive.
                </p>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={submittingApp}
                    onClick={() => setApplyingDrive(null)}
                    className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApp}
                    className="px-6 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-[#3B50DF]/20 disabled:opacity-50"
                  >
                    {submittingApp ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: NOTICE DETAILS MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm"
            onClick={() => setSelectedAnnouncement(null)}
          />

          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                  {selectedAnnouncement.type}
                </span>
                <h3 className="text-lg font-extrabold text-[#151B3B] leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                {selectedAnnouncement.companyName && (
                  <p className="text-xs font-semibold text-[#3B50DF] flex items-center">
                    <Building2 size={13} className="mr-1" />
                    {selectedAnnouncement.companyName} {selectedAnnouncement.jobRole && `• ${selectedAnnouncement.jobRole}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-xl bg-[#F4F6FA] text-[#64748B] hover:text-[#1E1E1E] transition"
              >
                ✕
              </button>
            </div>

            {/* Dates Bar */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold block">Posted Date</span>
                <span className="text-[#151B3B] font-mono font-semibold">
                  {new Date(selectedAnnouncement.startDate || selectedAnnouncement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold block">Registration Deadline</span>
                <span className="text-[#3B50DF] font-mono font-bold">
                  {selectedAnnouncement.endDate
                    ? new Date(selectedAnnouncement.endDate).toLocaleDateString()
                    : 'No Expiry / Open'}
                </span>
              </div>
            </div>

            {/* Eligibility Info */}
            {selectedAnnouncement.eligibility && (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-[#151B3B] uppercase tracking-wider flex items-center">
                  <GraduationCap size={14} className="mr-1.5 text-[#3B50DF]" /> Eligibility Criteria
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                  <div>Min CGPA: <strong className="text-[#151B3B]">{selectedAnnouncement.eligibility.minCGPA || 0}</strong></div>
                  <div>Max Backlogs: <strong className="text-[#151B3B]">{selectedAnnouncement.eligibility.maxBacklogs ?? 'Any'}</strong></div>
                  {selectedAnnouncement.eligibility.eligibleBranches && selectedAnnouncement.eligibility.eligibleBranches.length > 0 && (
                    <div className="col-span-2">
                      Branches: <strong className="text-[#151B3B]">{selectedAnnouncement.eligibility.eligibleBranches.join(', ')}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#151B3B] uppercase tracking-wider">Notice Description</h4>
              <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-line bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                {selectedAnnouncement.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E9F2] flex items-center justify-between">
              {/* Direct Apply CTA if eligible */}
              {(selectedAnnouncement.isPlacementDrive || selectedAnnouncement.type === 'Placement' || selectedAnnouncement.type === 'Drive') && (
                <button
                  type="button"
                  onClick={() => handleOpenApplication(selectedAnnouncement)}
                  className="px-5 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition shadow-sm"
                >
                  Apply for this Drive →
                </button>
              )}

              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2 rounded-xl bg-[#F4F6FA] border border-[#E2E8F0] text-xs font-semibold text-[#1E1E1E] hover:bg-[#E2E8F0] transition ml-auto"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
