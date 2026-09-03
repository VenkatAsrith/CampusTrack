import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Eye,
  EyeOff,
  Building2,
  Search
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import type { Announcement } from '../types';

const TpoAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deadlineModalItem, setDeadlineModalItem] = useState<Announcement | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  
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
    driveDate: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    linkTitle: 'Application Link',
    linkUrl: '',
    minCGPA: 6.5,
    maxBacklogs: 0,
    eligibleYears: '3, 4',
  });

  const fetchTpoAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/admin/all', {
        params: { search: search || undefined, limit: 50 },
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
      driveDate: formData.driveDate ? new Date(formData.driveDate) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      links,
      eligibility: {
        minCGPA: Number(formData.minCGPA) || 0,
        maxBacklogs: Number(formData.maxBacklogs) || 0,
        eligibleYears: eligibleYearsArray,
      },
    };

    try {
      if (editingItem) {
        await api.put(`/announcements/${editingItem._id}`, payload);
        setSuccessMsg('Announcement updated successfully!');
      } else {
        await api.post('/announcements', payload);
        setSuccessMsg('Announcement published successfully!');
      }
      setShowCreateModal(false);
      setEditingItem(null);
      fetchTpoAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/publish`);
      fetchTpoAnnouncements();
    } catch (err) {
      console.error('Failed toggling publish state', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setSuccessMsg('Announcement removed.');
      fetchTpoAnnouncements();
    } catch (err) {
      console.error('Failed deleting announcement', err);
    }
  };

  const handleUpdateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineModalItem || !newDeadline) return;
    try {
      await api.patch(`/announcements/${deadlineModalItem._id}/deadline`, { deadline: newDeadline });
      setSuccessMsg(`Deadline updated for "${deadlineModalItem.title}".`);
      setDeadlineModalItem(null);
      setNewDeadline('');
      fetchTpoAnnouncements();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed updating deadline.');
    }
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      isPlacementDrive: item.isPlacementDrive,
      companyName: item.companyName || '',
      jobRole: item.jobRole || '',
      driveDate: item.driveDate ? new Date(item.driveDate).toISOString().split('T')[0] : '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      linkTitle: item.links && item.links.length > 0 ? item.links[0].label : 'Application Link',
      linkUrl: item.links && item.links.length > 0 ? item.links[0].url : '',
      minCGPA: item.eligibility?.minCGPA || 0,
      maxBacklogs: item.eligibility?.maxBacklogs || 0,
      eligibleYears: item.eligibility?.eligibleYears ? item.eligibility.eligibleYears.join(', ') : '3, 4',
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#1E1E1E] flex items-center tracking-tight leading-tight">
            <Megaphone className="mr-2.5 text-[#3B50DF]" size={24} />
            TPO Announcement & Drive Management
          </h1>
          <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
            Publish recruitment notices, modify application deadlines, and monitor announcement lifecycles.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              title: '',
              description: '',
              type: 'Placement',
              isPlacementDrive: true,
              companyName: '',
              jobRole: '',
              driveDate: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              linkTitle: 'Application Link',
              linkUrl: '',
              minCGPA: 6.5,
              maxBacklogs: 0,
              eligibleYears: '3, 4',
            });
            setShowCreateModal(true);
          }}
          className="relative z-10 flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-[13px] font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95 shrink-0"
        >
          <Plus size={16} className="mr-1.5" />
          Create Announcement
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center p-4 bg-[#EEF2FF] border border-[#C7D2FE] text-[#3B50DF] rounded-xl text-xs font-semibold">
          <CheckCircle2 size={16} className="mr-2 text-[#3B50DF] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Announcements Table */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5E9F2] flex items-center justify-between gap-4">
          <h2 className="text-[14px] font-bold text-[#1E1E1E]">Active, Upcoming & Historical Notices ({announcements.length})</h2>
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTpoAnnouncements()}
              placeholder="Search announcements..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B50DF]"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-[#94A3B8]" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#6C757D] text-xs font-semibold">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-[#6C757D] text-xs">No announcements found. Click "Create Announcement" to post.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E1E1E]">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#6C757D] uppercase tracking-wider border-b border-[#E5E9F2]">
                <tr>
                  <th className="px-5 py-3.5">Title & Company</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Posted / Deadline</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Visibility</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#1E1E1E]">
                {announcements.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F8FAFD] transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#1E1E1E] leading-snug">{item.title}</div>
                      {item.companyName && (
                        <div className="text-[11px] text-[#6C757D] mt-0.5 flex items-center font-medium">
                          <Building2 size={12} className="mr-1 text-[#3B50DF]" />
                          {item.companyName} {item.jobRole && `• ${item.jobRole}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-[#1E1E1E]">
                      <div>Start: {new Date(item.startDate).toLocaleDateString()}</div>
                      <div className="text-[#6C757D] mt-0.5">
                        End: {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'No Deadline'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleTogglePublish(item._id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          item.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {item.isPublished ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                        {item.isPublished ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setDeadlineModalItem(item);
                            setNewDeadline(item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '');
                          }}
                          className="p-1.5 rounded-lg bg-[#EEF2FF] hover:bg-[#D9E1FC] border border-[#D9E1FC] text-[#3B50DF] transition shadow-sm"
                          title="Change Deadline / Expiration Date"
                        >
                          <Clock size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E1E1E] transition shadow-sm"
                          title="Edit Announcement"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition shadow-sm"
                          title="Delete Announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-2xl w-full my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Pinned Modal Header (Never clips or scrolls off) */}
            <div className="px-6 py-4 border-b border-[#E5E9F2] flex items-center justify-between shrink-0 bg-white">
              <h2 className="text-[18px] font-extrabold text-[#1E1E1E]">
                {editingItem ? 'Edit Announcement' : 'Create New TPO Announcement'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. TCS Digital Campus Drive 2026"
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Category Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  >
                    <option value="Placement">Placement</option>
                    <option value="Drive">Drive</option>
                    <option value="Internship">Internship</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Placement Drive?</label>
                  <select
                    value={formData.isPlacementDrive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isPlacementDrive: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  >
                    <option value="true">Yes — Corporate Drive</option>
                    <option value="false">No — General Notice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Google, TCS, Infosys"
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Job Role</label>
                  <input
                    type="text"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    placeholder="e.g. Associate Software Engineer"
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Deadline / End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Drive Date</label>
                  <input
                    type="date"
                    value={formData.driveDate}
                    onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide complete eligibility details, package, assessment rounds..."
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] leading-relaxed"
                />
              </div>

              {/* Eligibility Criteria */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-[#1E1E1E] uppercase block">Eligibility Thresholds</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#6C757D] uppercase font-bold">Min CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.minCGPA}
                      onChange={(e) => setFormData({ ...formData, minCGPA: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E1E1E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6C757D] uppercase font-bold">Max Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxBacklogs}
                      onChange={(e) => setFormData({ ...formData, maxBacklogs: parseInt(e.target.value, 10) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E1E1E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6C757D] uppercase font-bold">Eligible Years</label>
                    <input
                      type="text"
                      value={formData.eligibleYears}
                      onChange={(e) => setFormData({ ...formData, eligibleYears: e.target.value })}
                      placeholder="e.g. 3, 4"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E1E1E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* External Link */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">Button / Link Label</label>
                  <input
                    type="text"
                    value={formData.linkTitle}
                    onChange={(e) => setFormData({ ...formData, linkTitle: e.target.value })}
                    placeholder="e.g. Apply on Company Portal"
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">External Application URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E9F2] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#6C757D] hover:bg-[#F4F6FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition"
                >
                  {actionLoading ? 'Saving...' : editingItem ? 'Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deadline Modification Modal */}
      {deadlineModalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center">
              <Clock size={16} className="mr-2 text-[#3B50DF]" />
              Modify Deadline: {deadlineModalItem.title}
            </h3>
            <p className="text-xs text-[#6C757D]">
              Only TPO can update or extend the official registration deadline.
            </p>

            <form onSubmit={handleUpdateDeadline} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1E1E1E] uppercase mb-1">New End Date / Deadline *</label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeadlineModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#6C757D] hover:bg-[#F4F6FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition"
                >
                  Update Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TpoAnnouncements;
