import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, PlusCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { NPTELRecord } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploader from '../components/FileUploader';

const NPTELRecords: React.FC = () => {
  const [records, setRecords] = useState<NPTELRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NPTELRecord | null>(null);

  // Dialog actions
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [score, setScore] = useState('');
  const [certificationType, setCertificationType] = useState<'Participation' | 'Elite' | 'Elite + Silver' | 'Elite + Gold'>('Participation');
  const [eliteStatus, setEliteStatus] = useState(false);
  const [rank, setRank] = useState('');
  const [examDate, setExamDate] = useState('');
  const [certificate, setCertificate] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/nptel');
      setRecords(res.data.data);
    } catch (err) {
      console.error('Failed to load NPTEL records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setCourseName('');
    setCourseId('');
    setScore('');
    setCertificationType('Participation');
    setEliteStatus(false);
    setRank('');
    setExamDate('');
    setCertificate(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (r: NPTELRecord) => {
    setEditingRecord(r);
    setCourseName(r.courseName);
    setCourseId(r.courseId);
    setScore(r.score.toString());
    setCertificationType(r.certificationType);
    setEliteStatus(r.eliteStatus);
    setRank(r.rank?.toString() || '');
    setExamDate(r.examDate ? r.examDate.split('T')[0] : '');
    setCertificate(r.certificate?._id || null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/nptel/${deleteId}`);
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
      const res = await api.post(`/nptel/${submitId}/submit`);
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
      courseName,
      courseId,
      score: Number(score),
      certificationType,
      eliteStatus,
      rank: rank ? Number(rank) : undefined,
      examDate,
      certificate: certificate || undefined,
    };

    try {
      if (editingRecord) {
        const res = await api.patch(`/nptel/${editingRecord._id}`, payload);
        if (res.data.status === 'success') {
          setRecords(records.map(r => r._id === editingRecord._id ? res.data.data : r));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/nptel', payload);
        if (res.data.status === 'success') {
          setRecords([...records, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save NPTEL record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading NPTEL records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">NPTEL Courses</h1>
          <p className="text-[#6C757D] text-xs mt-1">Submit SWAYAM/NPTEL online course examination records for verification.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-sm rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Course
        </button>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
          <BookOpen className="h-14 w-14 text-[#94A3B8] mb-3" />
          <h3 className="text-base font-bold text-[#1E1E1E]">No NPTEL courses added yet</h3>
          <p className="text-[#6C757D] text-xs mt-1.5 max-w-sm">Add SWAYAM NPTEL computer science courses to enhance your profile credentials.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add course now
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
                        {r.certificationType}
                      </span>
                      <h3 className="font-extrabold text-[#1E1E1E] text-base mt-2 truncate max-w-xs">{r.courseName}</h3>
                      <p className="text-[#6C757D] text-xs mt-0.5 font-semibold">{r.courseId}</p>
                    </div>
                    <StatusBadge status={r.verification.status} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-center">
                    <div>
                      <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Score</span>
                      <p className="text-sm font-bold text-[#1E1E1E] mt-1">{r.score}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Elite</span>
                      <p className="text-sm font-bold text-[#1E1E1E] mt-1">{r.eliteStatus ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Rank</span>
                      <p className="text-sm font-bold text-[#1E1E1E] mt-1">{r.rank || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-[10px] text-slate-550 font-semibold uppercase tracking-wider">
                    Exam Date: <strong className="text-slate-450">{r.examDate.split('T')[0]}</strong>
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
                    {r.certificate && (
                      <a href={`/api/v1/documents/${r.certificate._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:text-brand-350 underline font-semibold">
                        View Course Certificate
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
                {editingRecord ? 'Edit Course Details' : 'Add NPTEL Record'}
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
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Software Engineering"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Course NOC ID *</label>
                  <input
                    type="text"
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    placeholder="e.g. noc24-cs10"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Exam Score *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 85"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Exam Rank</label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 15 (Optional)"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Certification Type *</label>
                  <select
                    value={certificationType}
                    onChange={(e) => setCertificationType(e.target.value as any)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['Participation', 'Elite', 'Elite + Silver', 'Elite + Gold'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="eliteStatus"
                    checked={eliteStatus}
                    onChange={(e) => setEliteStatus(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#3B50DF] focus:ring-[#3B50DF]"
                  />
                  <label htmlFor="eliteStatus" className="text-xs text-[#1E1E1E] font-semibold select-none cursor-pointer">
                    Elite Course status achieved
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <FileUploader 
                  label="Upload Supporting NPTEL Certificate file"
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
                  {editingRecord ? 'Save Changes' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Remove NPTEL Record"
        message="Are you sure you want to permanently delete this NPTEL record? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Delete"
        type="danger"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog 
        isOpen={submitId !== null}
        title="Submit Course for Verification"
        message="Are you sure you want to submit this NPTEL record for verification? Once submitted, it cannot be modified until reviewed."
        onConfirm={handleSubmitVerification}
        onCancel={() => setSubmitId(null)}
        isLoading={submitLoading}
        confirmLabel="Submit for Verification"
        type="info"
      />
    </div>
  );
};

export default NPTELRecords;
