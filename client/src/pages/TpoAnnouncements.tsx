import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Building2, 
  FileSpreadsheet, 
  Users, 
  X, 
  ListPlus, 
  Sliders 
} from 'lucide-react';
import api from '../services/api';
import type { Announcement, PlacementApplication, FormField } from '../types';
import { OFFICIAL_BRANCHES } from '../config/branchConfig';

const BATCH_OPTIONS = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];

const TpoAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Applications Drawer / Modal
  const [viewingDriveApps, setViewingDriveApps] = useState<Announcement | null>(null);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [appsMetrics, setAppsMetrics] = useState<any>(null);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appFilterBranch, setAppFilterBranch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState('');
  const [appFilterBatch, setAppFilterBatch] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);
  
  // Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Placement',
    isPlacementDrive: true,
    companyName: '',
    jobRole: '',
    compensation: '',
    location: '',
    driveDate: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    linkTitle: 'External Link',
    linkUrl: '',
    minCGPA: 6.5,
    maxBacklogs: 0,
    eligibleYears: '3, 4',
    eligibleBranches: ['CSE', 'CSM', 'CSC', 'ECE'] as string[],
    eligibleBatches: ['2022-2026', '2023-2027'] as string[],
    customFields: [] as FormField[],
  });

  const fetchTpoAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/admin/all', {
        params: { limit: 50 },
      });
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Failed to load announcements for TPO', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTpoAnnouncements();
  }, []);

  // Restore saved draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('campustrack_tpo_drive_draft');
      if (draft && !editingItem) {
        const d = JSON.parse(draft);
        if (d.companyName || d.title || d.jobRole) {
          setFormData((prev) => ({ ...prev, ...d }));
        }
      }
    } catch {}
  }, []);

  // Auto-save drive creation draft locally
  useEffect(() => {
    if (!editingItem && (formData.companyName || formData.title || formData.jobRole)) {
      try {
        localStorage.setItem('campustrack_tpo_drive_draft', JSON.stringify(formData));
      } catch {}
    }
  }, [formData, editingItem]);

  const resetForm = () => {
    localStorage.removeItem('campustrack_tpo_drive_draft');
    setFormData({
      title: '',
      description: '',
      type: 'Placement',
      isPlacementDrive: true,
      companyName: '',
      jobRole: '',
      compensation: '',
      location: '',
      driveDate: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      linkTitle: 'External Link',
      linkUrl: '',
      minCGPA: 6.5,
      maxBacklogs: 0,
      eligibleYears: '3, 4',
      eligibleBranches: ['CSE', 'CSM', 'CSC', 'ECE'],
      eligibleBatches: ['2022-2026', '2023-2027'],
      customFields: [],
    });
    setEditingItem(null);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      isPlacementDrive: item.isPlacementDrive,
      companyName: item.companyName || '',
      jobRole: item.jobRole || '',
      compensation: item.compensation || '',
      location: item.location || '',
      driveDate: item.driveDate ? new Date(item.driveDate).toISOString().split('T')[0] : '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      linkTitle: item.links?.[0]?.label || '',
      linkUrl: item.links?.[0]?.url || '',
      minCGPA: item.eligibility?.minCGPA ?? 6.5,
      maxBacklogs: item.eligibility?.maxBacklogs ?? 0,
      eligibleYears: item.eligibility?.eligibleYears?.join(', ') || '3, 4',
      eligibleBranches: item.eligibility?.eligibleBranches || ['CSE', 'CSM', 'CSC', 'ECE'],
      eligibleBatches: item.eligibility?.eligibleBatches || ['2022-2026', '2023-2027'],
      customFields: item.applicationForm?.fields || [],
    });
    setShowCreateModal(true);
  };

  // Add / Remove Questions in Form Builder
  const handleAddQuestion = () => {
    const newField: FormField = {
      id: `q_${Date.now()}`,
      label: 'Question / Requirement',
      type: 'RADIO',
      required: true,
      options: ['Yes', 'No'],
      placeholder: '',
      helpText: '',
    };
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  const handleRemoveQuestion = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.id !== id),
    }));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  // Submit Notice / Drive
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const links = formData.linkUrl ? [{ label: formData.linkTitle || 'Apply', url: formData.linkUrl }] : [];
    const eligibleYearsArray = formData.eligibleYears
      ? formData.eligibleYears.split(',').map((y) => parseInt(y.trim(), 10)).filter((y) => !isNaN(y))
      : [];

    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      isPlacementDrive: formData.isPlacementDrive,
      companyName: formData.companyName,
      jobRole: formData.jobRole,
      compensation: formData.compensation,
      location: formData.location,
      driveDate: formData.driveDate ? new Date(formData.driveDate) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      links,
      eligibility: {
        minCGPA: Number(formData.minCGPA) || 0,
        maxBacklogs: Number(formData.maxBacklogs) || 0,
        eligibleBranches: formData.eligibleBranches,
        eligibleBatches: formData.eligibleBatches,
        eligibleYears: eligibleYearsArray,
      },
      applicationForm: {
        enabled: formData.isPlacementDrive,
        fields: formData.customFields,
      },
    };

    try {
      if (editingItem) {
        await api.put(`/announcements/${editingItem._id}`, payload);
        setSuccessMsg(`Placement announcement "${formData.title}" updated successfully.`);
      } else {
        await api.post('/announcements', payload);
        setSuccessMsg(`Placement announcement "${formData.title}" created & published.`);
      }

      setShowCreateModal(false);
      resetForm();
      await fetchTpoAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.delete(`/announcements/${id}`);
      setSuccessMsg(`Announcement deleted.`);
      await fetchTpoAnnouncements();
    } catch (err: any) {
      setErrorMsg('Failed to delete announcement.');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/publish`);
      await fetchTpoAnnouncements();
    } catch (err) {
      setErrorMsg('Failed to update publish status.');
    }
  };

  // Applications Drawer / Modal
  const openDriveApplications = async (drive: Announcement) => {
    setViewingDriveApps(drive);
    setAppsLoading(true);
    setAppFilterBranch('');
    setAppFilterStatus('');
    setAppFilterBatch('');
    try {
      const res = await api.get(`/announcements/${drive._id}/applications`);
      setApplications(res.data?.data || []);
      setAppsMetrics(res.data?.metrics || null);
    } catch (err) {
      console.error('Failed to load drive applications', err);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    if (!viewingDriveApps) return;
    try {
      await api.patch(`/announcements/${viewingDriveApps._id}/applications/${appId}/status`, { status });
      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: status as any } : a))
      );
      // Refresh metrics
      const res = await api.get(`/announcements/${viewingDriveApps._id}/applications`);
      setAppsMetrics(res.data?.metrics || null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update candidate status.');
    }
  };

  const handleShortlistAllEligible = async () => {
    if (!viewingDriveApps) return;
    const eligibleAppIds = applications
      .filter((a) => a.status === 'SUBMITTED')
      .map((a) => a._id);

    if (eligibleAppIds.length === 0) {
      alert('No pending submitted applications to shortlist.');
      return;
    }

    try {
      await api.post(`/announcements/${viewingDriveApps._id}/applications/bulk-status`, {
        applicationIds: eligibleAppIds,
        status: 'SHORTLISTED',
      });
      // Refresh
      const res = await api.get(`/announcements/${viewingDriveApps._id}/applications`);
      setApplications(res.data?.data || []);
      setAppsMetrics(res.data?.metrics || null);
      alert(`Successfully shortlisted ${eligibleAppIds.length} candidate(s).`);
    } catch (err: any) {
      alert('Failed to shortlist candidates.');
    }
  };

  const handleExportDriveExcel = async (driveId: string, title: string) => {
    setExportingExcel(true);
    try {
      const response = await api.get(`/announcements/${driveId}/applications/export-excel`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Verified_Applicants.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download Excel report.');
    } finally {
      setExportingExcel(false);
    }
  };

  const filteredApplications = applications.filter((a) => {
    if (appFilterBranch && a.systemData.branch !== appFilterBranch) return false;
    if (appFilterBatch && a.systemData.batch !== appFilterBatch) return false;
    if (appFilterStatus && a.status !== appFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-2">
            <Megaphone size={14} />
            <span>TPO Recruitment Control Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#151B3B] tracking-tight">
            Placement Drives & Institutional Announcements
          </h1>
          <p className="text-[#64748B] text-xs mt-1">
            Build corporate drives, custom application forms, eligibility criteria, and export deterministic Excel rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95"
        >
          <Plus size={15} />
          <span>Post New Drive / Notice</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between font-semibold">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
          <div className="h-8 w-8 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#64748B] font-semibold">Loading placement announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white border border-[#E5E9F2] rounded-2xl">
          No announcements posted yet. Click "Post New Drive / Notice" to publish one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {announcements.map((item) => {
            const isDrive = item.isPlacementDrive || item.type === 'Placement' || item.type === 'Drive';

            return (
              <div
                key={item._id}
                className="bg-white border border-[#E5E9F2] hover:border-[#3B50DF] rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                        {item.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item._id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                          item.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span>{item.isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-[#64748B] hover:text-[#3B50DF] rounded hover:bg-[#EEF2FF]"
                        title="Edit Notice"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.title)}
                        className="p-1 text-[#64748B] hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#151B3B] line-clamp-1">{item.title}</h3>
                    {item.companyName && (
                      <p className="text-xs text-[#3B50DF] font-semibold mt-0.5 flex items-center">
                        <Building2 size={12} className="mr-1 shrink-0" />
                        <span>{item.companyName} {item.jobRole && `• ${item.jobRole}`}</span>
                      </p>
                    )}
                  </div>

                  {(item.compensation || item.location) && (
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                      {item.compensation && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {item.compensation}
                        </span>
                      )}
                      {item.location && (
                        <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                          {item.location}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-[#64748B] line-clamp-2">{item.description}</p>

                  {item.eligibility && (
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B] space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span>Min CGPA: <strong>{item.eligibility.minCGPA || 0}</strong></span>
                        <span>Max BL: <strong>{item.eligibility.maxBacklogs ?? 0}</strong></span>
                      </div>
                      {item.eligibility.eligibleBranches && item.eligibility.eligibleBranches.length > 0 && (
                        <p className="truncate text-[10px]">
                          Branches: <strong className="text-[#151B3B]">{item.eligibility.eligibleBranches.join(', ')}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E9F2] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {item.endDate ? `Ends: ${new Date(item.endDate).toLocaleDateString()}` : 'No deadline'}
                  </span>

                  {isDrive ? (
                    <button
                      type="button"
                      onClick={() => openDriveApplications(item)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#3B50DF] text-[#3B50DF] hover:text-white font-bold transition text-xs border border-[#D9E1FC]"
                    >
                      <Users size={13} />
                      <span>View Applicants</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE / EDIT DRIVE WITH FORM & ELIGIBILITY BUILDER   */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />

          <div className="relative bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#151B3B]">
                {editingItem ? 'Edit Placement Notice' : 'Post New Placement Drive / Circular'}
              </h2>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Amazon Summer Internship & Placement Drive 2026"
                  className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  >
                    <option value="Placement">Placement</option>
                    <option value="Drive">Drive</option>
                    <option value="Internship">Internship</option>
                    <option value="Academic">Academic</option>
                    <option value="General">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Amazon, Google, TCS"
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Job Role</label>
                  <input
                    type="text"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    placeholder="e.g. SDE-1"
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Package / CTC</label>
                  <input
                    type="text"
                    value={formData.compensation}
                    onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                    placeholder="e.g. ₹14 LPA"
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Job Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hyderabad / Bengaluru"
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Drive / Interview Date</label>
                  <input
                    type="date"
                    value={formData.driveDate}
                    onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">Description / Details *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed job description, rounds of interviews, service agreement, etc."
                  className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E1E1E]"
                />
              </div>

              {/* VISUAL ELIGIBILITY BUILDER */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#151B3B]">
                  <Sliders size={14} className="text-[#3B50DF]" />
                  <span>Visual Eligibility Builder (Automated Candidate Filtering)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Minimum CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.minCGPA}
                      onChange={(e) => setFormData({ ...formData, minCGPA: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Max Active Backlogs Allowed</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxBacklogs}
                      onChange={(e) => setFormData({ ...formData, maxBacklogs: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Branch Selection Pills */}
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Eligible Branches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {OFFICIAL_BRANCHES.map((b) => {
                      const isSelected = formData.eligibleBranches.includes(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? formData.eligibleBranches.filter((x) => x !== b)
                              : [...formData.eligibleBranches, b];
                            setFormData({ ...formData, eligibleBranches: next });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                            isSelected
                              ? 'bg-[#3B50DF] text-white border-[#3B50DF]'
                              : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#3B50DF]'
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Selection Pills */}
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Eligible Batches</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BATCH_OPTIONS.map((bt) => {
                      const isSelected = formData.eligibleBatches.includes(bt);
                      return (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? formData.eligibleBatches.filter((x) => x !== bt)
                              : [...formData.eligibleBatches, bt];
                            setFormData({ ...formData, eligibleBatches: next });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                            isSelected
                              ? 'bg-[#151B3B] text-white border-[#151B3B]'
                              : 'bg-white text-[#64748B] border-[#CBD5E1]'
                          }`}
                        >
                          {bt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* UNIVERSAL FORM BUILDER */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#151B3B]">
                    <ListPlus size={14} className="text-[#3B50DF]" />
                    <span>Universal Form Builder (Google-Forms-Style Custom Questions)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-[11px] font-bold transition"
                  >
                    <Plus size={12} />
                    <span>Add Question</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#64748B]">
                  Candidate academic identity (Name, Roll, Branch, Batch, CGPA, Backlogs, Resume) is pre-filled automatically. Add only custom questions here.
                </p>

                {formData.customFields.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl bg-white">
                    No custom questions added. Students will apply with their verified profile.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.customFields.map((field, idx) => (
                      <div key={field.id} className="p-3 bg-white border border-[#CBD5E1] rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-[#94A3B8]">Q{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(field.id)}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateQuestion(field.id, { label: e.target.value })}
                              placeholder="e.g. Are you willing to relocate to Bengaluru?"
                              className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleUpdateQuestion(field.id, { type: e.target.value as any })
                              }
                              className="w-full px-2 py-1.5 border border-[#CBD5E1] rounded-lg text-xs"
                            >
                              <option value="RADIO">Radio (Yes/No / Single)</option>
                              <option value="DROPDOWN">Dropdown</option>
                              <option value="CHECKBOX">Checkboxes (Multi)</option>
                              <option value="TEXT">Short Text</option>
                              <option value="LONG_TEXT">Paragraph</option>
                              <option value="NUMBER">Number</option>
                              <option value="URL">Website / Portfolio URL</option>
                            </select>
                          </div>
                        </div>

                        {['RADIO', 'DROPDOWN', 'CHECKBOX'].includes(field.type) && (
                          <div>
                            <input
                              type="text"
                              value={(field.options || []).join(', ')}
                              onChange={(e) =>
                                handleUpdateQuestion(field.id, {
                                  options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              placeholder="Options separated by commas: Yes, No, Maybe"
                              className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: TPO CANDIDATE APPLICATIONS & EXCEL EXPORT             */}
      {/* ------------------------------------------------------------- */}
      {viewingDriveApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm" onClick={() => setViewingDriveApps(null)} />

          <div className="relative bg-white border border-[#E2E8F0] rounded-2xl max-w-5xl w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
                  Verified Candidate Submissions
                </span>
                <h2 className="text-xl font-extrabold text-[#151B3B] mt-1">
                  {viewingDriveApps.companyName || viewingDriveApps.title}
                </h2>
                <p className="text-xs text-[#64748B]">
                  {viewingDriveApps.jobRole} • Sorted strictly by Branch → Batch → Roll Number
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={exportingExcel}
                  onClick={() => handleExportDriveExcel(viewingDriveApps._id, viewingDriveApps.companyName || viewingDriveApps.title)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  <FileSpreadsheet size={15} />
                  <span>{exportingExcel ? 'Generating...' : 'Export ExcelJS Workbook'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingDriveApps(null)}
                  className="p-1.5 rounded-xl bg-[#F4F6FA] text-[#64748B] hover:text-[#1E1E1E]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* KPI Metrics Breakdown */}
            {appsMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Applied</span>
                  <span className="text-lg font-bold text-[#151B3B]">{appsMetrics.total}</span>
                </div>
                <div className="p-3 bg-[#EEF2FF] border border-[#D9E1FC] rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-[#3B50DF] block">Submitted</span>
                  <span className="text-lg font-bold text-[#3B50DF]">{appsMetrics.submitted}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Shortlisted</span>
                  <span className="text-lg font-bold text-emerald-700">{appsMetrics.shortlisted}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-800 block">Selected</span>
                  <span className="text-lg font-bold text-purple-700">{appsMetrics.selected}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Rejected</span>
                  <span className="text-lg font-bold text-rose-700">{appsMetrics.rejected}</span>
                </div>
              </div>
            )}

            {/* Filters Bar & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={appFilterBranch}
                  onChange={(e) => setAppFilterBranch(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  <option value="">All Branches</option>
                  {OFFICIAL_BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  value={appFilterBatch}
                  onChange={(e) => setAppFilterBatch(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  <option value="">All Batches</option>
                  {BATCH_OPTIONS.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>

                <select
                  value={appFilterStatus}
                  onChange={(e) => setAppFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleShortlistAllEligible}
                className="px-3.5 py-1.5 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold rounded-lg transition"
              >
                Shortlist All Pending ({appsMetrics?.submitted ?? 0})
              </button>
            </div>

            {/* Applications Table */}
            {appsLoading ? (
              <div className="p-12 text-center text-xs text-[#64748B]">Loading candidate applications...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                No applications found matching the selected filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#151B3B] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Branch & Batch</th>
                      <th className="p-3">CGPA / BL</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-[#F8FAFC]">
                        <td className="p-3 font-semibold text-[#151B3B]">
                          <div>{app.systemData.name}</div>
                          <span className="font-mono text-[10px] text-[#64748B]">{app.systemData.rollNumber}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-[#3B50DF]">{app.systemData.branch}</span>
                          <span className="text-[10px] text-[#64748B] block font-mono">{app.systemData.batch}</span>
                        </td>
                        <td className="p-3 font-mono">
                          <div>CGPA {app.systemData.cgpa ? Number(app.systemData.cgpa).toFixed(2) : '0.00'}</div>
                          <span className="text-[10px] text-[#64748B]">{app.systemData.backlogs ?? 0} Backlogs</span>
                        </td>
                        <td className="p-3 text-[11px] text-[#64748B]">
                          <div>{app.systemData.email}</div>
                          <div className="font-mono">{app.systemData.phone}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            app.status === 'SHORTLISTED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : app.status === 'SELECTED'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateAppStatus(app._id, 'SHORTLISTED')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200"
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppStatus(app._id, 'SELECTED')}
                            className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[10px] border border-purple-200"
                          >
                            Select
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAppStatus(app._id, 'REJECTED')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TpoAnnouncements;
