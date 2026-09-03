import React, { useEffect, useState } from 'react';
import { Trophy, Plus, Edit2, Trash2, PlusCircle, AlertTriangle, Send, Loader2, Globe } from 'lucide-react';
import api from '../services/api';
import type { Hackathon } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploader from '../components/FileUploader';

const Hackathons: React.FC = () => {
  const [records, setRecords] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Hackathon | null>(null);

  // Dialog actions
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [hackathonName, setHackathonName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [teamName, setTeamName] = useState('');
  const [studentRole, setStudentRole] = useState('');
  const [projectName, setProjectName] = useState('');
  const [position, setPosition] = useState<'Participant' | 'Finalist' | 'Top 100' | 'Top 50' | 'Top 10' | 'Winner' | 'Runner-up'>('Participant');
  const [projectLink, setProjectLink] = useState('');
  const [certificate, setCertificate] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/hackathons');
      setRecords(res.data.data);
    } catch (err) {
      console.error('Failed to load hackathons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setHackathonName('');
    setOrganizer('');
    setDate('');
    setTeamName('');
    setStudentRole('');
    setProjectName('');
    setPosition('Participant');
    setProjectLink('');
    setCertificate(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (r: Hackathon) => {
    setEditingRecord(r);
    setHackathonName(r.hackathonName);
    setOrganizer(r.organizer);
    setDate(r.date ? r.date.split('T')[0] : '');
    setTeamName(r.teamName || '');
    setStudentRole(r.studentRole);
    setProjectName(r.projectName || '');
    setPosition(r.position);
    setProjectLink(r.projectLink || '');
    setCertificate(r.certificate?._id || null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/hackathons/${deleteId}`);
      setRecords(records.filter(r => r._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!submitId) return;
    setSubmitLoading(true);
    try {
      const res = await api.post(`/hackathons/${submitId}/submit`);
      if (res.data.status === 'success') {
        setRecords(records.map(r => r._id === submitId ? res.data.data : r));
        setSubmitId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      hackathonName,
      organizer,
      date,
      teamName,
      studentRole,
      projectName,
      position,
      projectLink,
      certificate: certificate || undefined,
    };

    try {
      if (editingRecord) {
        const res = await api.patch(`/hackathons/${editingRecord._id}`, payload);
        if (res.data.status === 'success') {
          setRecords(records.map(r => r._id === editingRecord._id ? res.data.data : r));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/hackathons', payload);
        if (res.data.status === 'success') {
          setRecords([...records, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save hackathon record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading hackathons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">Hackathons</h1>
          <p className="text-[#6C757D] text-xs mt-1">Manage hackathons participation, team roles, and awards.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-sm rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Hackathon
        </button>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
          <Trophy className="h-14 w-14 text-[#94A3B8] mb-3" />
          <h3 className="text-base font-bold text-[#1E1E1E]">No hackathons recorded yet</h3>
          <p className="text-[#6C757D] text-xs mt-1.5 max-w-sm">Log your hackathon entries, team code repositories, and positions achieved to highlight active development.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add hackathon now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((r) => {
            const isDraftOrRejected = r.verification.status === 'DRAFT' || r.verification.status === 'REJECTED';
            return (
              <div 
                key={r._id}
                className="bg-white border border-[#E5E9F2] rounded-2xl shadow-sm hover:shadow-md p-6 hover:border-[#3B50DF]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-[#3B50DF] font-extrabold uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-1 border border-[#D9E1FC] rounded">
                        {r.position}
                      </span>
                      <h3 className="font-extrabold text-[#1E1E1E] text-base mt-2 truncate max-w-xs">{r.hackathonName}</h3>
                      <p className="text-[#6C757D] text-xs mt-0.5 font-semibold">{r.organizer}</p>
                    </div>
                    <StatusBadge status={r.verification.status} />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-[#6C757D]">
                    {r.projectName && <p>Project: <strong className="text-[#1E1E1E]">{r.projectName}</strong></p>}
                    {r.teamName && <p>Team Name: <strong className="text-[#1E1E1E]">{r.teamName}</strong></p>}
                    <p>My Role: <strong className="text-slate-350">{r.studentRole}</strong></p>
                    <p>Event Date: <strong className="text-slate-350">{r.date.split('T')[0]}</strong></p>
                  </div>

                  {r.verification.status === 'REJECTED' && (
                    <div className="mt-4 p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-350 flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 shrink-0 text-rose-455 mt-0.5" />
                      <div>
                        <p className="font-bold">Rejection Feedback:</p>
                        <p className="mt-0.5 font-normal text-rose-400 leading-relaxed">{r.verification.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E9F2]/80 flex items-center justify-between">
                  <div className="flex space-x-3 text-xs">
                    {r.projectLink && (
                      <a href={r.projectLink} target="_blank" rel="noopener noreferrer" className="text-slate-450 hover:text-white flex items-center">
                        <Globe size={12} className="mr-1.5" />
                        Code Repository
                      </a>
                    )}
                    {r.certificate && (
                      <a href={`/api/v1/documents/${r.certificate._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:text-brand-350 underline font-semibold">
                        View Certificate
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isDraftOrRejected && (
                      <>
                        <button
                          onClick={() => setSubmitId(r._id)}
                          className="flex items-center px-3 py-1.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                        >
                          <Send size={12} className="mr-1" />
                          Submit
                        </button>
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-[#6C757D] hover:text-white hover:bg-[#F4F6FA] rounded-lg transition-colors border border-[#E5E9F2] hover:border-[#3B50DF]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteId(r._id)}
                          className="p-1.5 text-[#6C757D] hover:text-rose-450 hover:bg-rose-955/20 rounded-lg transition-colors border border-[#E5E9F2] hover:border-rose-900/30"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F2] mb-4">
              <h3 className="text-base font-extrabold text-[#1E1E1E]">
                {editingRecord ? 'Edit Hackathon Details' : 'Add Hackathon Record'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:text-[#1E1E1E] hover:bg-[#F4F6FA] transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Hackathon Name *</label>
                  <input
                    type="text"
                    required
                    value={hackathonName}
                    onChange={(e) => setHackathonName(e.target.value)}
                    placeholder="e.g. Smart India Hackathon"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Organizer *</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. Govt. Ministry of India"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Team Name (optional)</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. ByteBusters"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">My Role *</label>
                  <input
                    type="text"
                    required
                    value={studentRole}
                    onChange={(e) => setStudentRole(e.target.value)}
                    placeholder="e.g. Presentation & ML Dev"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Project Name (optional)</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Agribot Analytics"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Achieved Position *</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['Participant', 'Finalist', 'Top 100', 'Top 50', 'Top 10', 'Winner', 'Runner-up'].map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Submission Link (optional)</label>
                <input
                  type="url"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div className="pt-2">
                <FileUploader 
                  label="Upload Supporting Hackathon Certificate file"
                  onUploadSuccess={(id) => setCertificate(id)}
                  initialFileName={editingRecord?.certificate?.originalName}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-[#E5E9F2]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] bg-white rounded-xl text-[#6C757D] text-xs font-semibold hover:bg-[#F4F6FA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#3B50DF] hover:bg-[#2E3FB8] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#3B50DF]/20 flex items-center transition active:scale-95"
                >
                  {saving && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />}
                  {editingRecord ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Remove Hackathon Record"
        message="Are you sure you want to permanently delete this hackathon record? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Delete"
        type="danger"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog 
        isOpen={submitId !== null}
        title="Submit Hackathon for Verification"
        message="Are you sure you want to submit this hackathon record for verification? Once submitted, it cannot be modified until reviewed."
        onConfirm={handleSubmitVerification}
        onCancel={() => setSubmitId(null)}
        isLoading={submitLoading}
        confirmLabel="Submit for Verification"
        type="info"
      />
    </div>
  );
};

export default Hackathons;
