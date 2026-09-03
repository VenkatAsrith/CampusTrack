import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Edit2, Trash2, PlusCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Achievement } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploader from '../components/FileUploader';

const Achievements: React.FC = () => {
  const [records, setRecords] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Achievement | null>(null);

  // Dialog actions
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [achievementTitle, setAchievementTitle] = useState('');
  const [category, setCategory] = useState<'Academic' | 'Sports' | 'Cultural' | 'Leadership' | 'Competition' | 'Other'>('Academic');
  const [level, setLevel] = useState<'College' | 'University' | 'District' | 'State' | 'National' | 'International'>('College');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [proofDocument, setProofDocument] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/achievements');
      setRecords(res.data.data);
    } catch (err) {
      console.error('Failed to load achievements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setAchievementTitle('');
    setCategory('Academic');
    setLevel('College');
    setDate('');
    setDescription('');
    setProofDocument(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (r: Achievement) => {
    setEditingRecord(r);
    setAchievementTitle(r.achievementTitle);
    setCategory(r.category);
    setLevel(r.level);
    setDate(r.date ? r.date.split('T')[0] : '');
    setDescription(r.description);
    setProofDocument(r.proofDocument?._id || null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/achievements/${deleteId}`);
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
      const res = await api.post(`/achievements/${submitId}/submit`);
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
      achievementTitle,
      category,
      level,
      date,
      description,
      proofDocument: proofDocument || undefined,
    };

    try {
      if (editingRecord) {
        const res = await api.patch(`/achievements/${editingRecord._id}`, payload);
        if (res.data.status === 'success') {
          setRecords(records.map(r => r._id === editingRecord._id ? res.data.data : r));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/achievements', payload);
        if (res.data.status === 'success') {
          setRecords([...records, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save achievement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">Extracurricular Achievements</h1>
          <p className="text-[#6C757D] text-xs mt-1">Submit academic awards, sports, leadership, or cultural competition achievements.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-sm rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Achievement
        </button>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
          <Sparkles className="h-14 w-14 text-[#94A3B8] mb-3" />
          <h3 className="text-base font-bold text-[#1E1E1E]">No achievements recorded yet</h3>
          <p className="text-[#6C757D] text-xs mt-1.5 max-w-sm">Add details of any leadership positions, national/district sports events, cultural festivals, or academic prizes you have won.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add achievement now
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
                        {r.level} • {r.category}
                      </span>
                      <h3 className="font-extrabold text-[#1E1E1E] text-base mt-2 truncate max-w-xs">{r.achievementTitle}</h3>
                    </div>
                    <StatusBadge status={r.verification.status} />
                  </div>

                  <p className="text-[#6C757D] text-xs mt-4 leading-relaxed line-clamp-3">{r.description}</p>

                  <div className="mt-4 text-[10px] text-slate-550 font-semibold uppercase tracking-wider">
                    Date Achieved: <strong className="text-slate-450">{r.date.split('T')[0]}</strong>
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
                    {r.proofDocument && (
                      <a href={`/api/v1/documents/${r.proofDocument._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:text-brand-350 underline font-semibold">
                        View Supporting Certificate
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
                          className="p-1.5 text-[#6C757D] hover:text-rose-455 hover:bg-rose-955/20 rounded-lg transition-colors border border-[#E5E9F2] hover:border-rose-900/30"
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
                {editingRecord ? 'Edit Achievement Details' : 'Add Achievement Record'}
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

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Achievement Title *</label>
                <input
                  type="text"
                  required
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  placeholder="e.g. Winner of All-India Inter-College CodeSprint"
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['Academic', 'Sports', 'Cultural', 'Leadership', 'Competition', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['College', 'University', 'District', 'State', 'National', 'International'].map(lev => (
                      <option key={lev} value={lev}>{lev}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Date Achieved *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your achievement, the competition context, criteria for selection..."
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div className="pt-2">
                <FileUploader 
                  label="Upload Supporting Proof file"
                  onUploadSuccess={(id) => setProofDocument(id)}
                  initialFileName={editingRecord?.proofDocument?.originalName}
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
        title="Remove Achievement Record"
        message="Are you sure you want to permanently delete this achievement record? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Delete"
        type="danger"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog 
        isOpen={submitId !== null}
        title="Submit Achievement for Verification"
        message="Are you sure you want to submit this achievement record for verification? Once submitted, it cannot be modified until reviewed."
        onConfirm={handleSubmitVerification}
        onCancel={() => setSubmitId(null)}
        isLoading={submitLoading}
        confirmLabel="Submit for Verification"
        type="info"
      />
    </div>
  );
};

export default Achievements;
