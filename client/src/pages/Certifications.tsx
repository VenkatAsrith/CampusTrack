import React, { useEffect, useState } from 'react';
import { Award, Plus, Edit2, Trash2, PlusCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Certification } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploader from '../components/FileUploader';

const Certifications: React.FC = () => {
  const [records, setRecords] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Certification | null>(null);

  // Dialog actions
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [certificationName, setCertificationName] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [category, setCategory] = useState('Programming');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [certificateFile, setCertificateFile] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/certifications');
      setRecords(res.data.data);
    } catch (err) {
      console.error('Failed to load certifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openAddModal = () => {
    setEditingRecord(null);
    setCertificationName('');
    setIssuingOrganization('');
    setCategory('Programming');
    setIssueDate('');
    setCredentialId('');
    setCredentialUrl('');
    setCertificateFile(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (r: Certification) => {
    setEditingRecord(r);
    setCertificationName(r.certificationName);
    setIssuingOrganization(r.issuingOrganization);
    setCategory(r.category);
    setIssueDate(r.issueDate ? r.issueDate.split('T')[0] : '');
    setCredentialId(r.credentialId || '');
    setCredentialUrl(r.credentialUrl || '');
    setCertificateFile(r.certificateFile?._id || null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/certifications/${deleteId}`);
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
      const res = await api.post(`/certifications/${submitId}/submit`);
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
      certificationName,
      issuingOrganization,
      category,
      issueDate,
      credentialId,
      credentialUrl,
      certificateFile: certificateFile || undefined,
    };

    try {
      if (editingRecord) {
        const res = await api.patch(`/certifications/${editingRecord._id}`, payload);
        if (res.data.status === 'success') {
          setRecords(records.map(r => r._id === editingRecord._id ? res.data.data : r));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/certifications', payload);
        if (res.data.status === 'success') {
          setRecords([...records, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save certification.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading certifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Certifications</h1>
          <p className="text-slate-400 text-xs mt-1">Manage certifications from AWS, GCP, Coursera, Meta, etc.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-slate-955 rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Certification
        </button>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <Award className="h-16 w-16 text-slate-700 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-white">No certifications recorded yet</h3>
          <p className="text-slate-500 text-xs mt-2 max-w-sm">Showcase your specialized tech knowledge by adding your industry-standard cloud, cybersecurity, coding, or AI certifications.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl transition-all"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add certification now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((r) => {
            const isDraftOrRejected = r.verification.status === 'DRAFT' || r.verification.status === 'REJECTED';
            return (
              <div 
                key={r._id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-750 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-brand-400 font-extrabold uppercase tracking-wider bg-slate-950 px-2.5 py-1 border border-slate-850 rounded">
                        {r.category}
                      </span>
                      <h3 className="font-extrabold text-white text-lg mt-2 truncate max-w-xs">{r.certificationName}</h3>
                      <p className="text-slate-550 text-[10px] mt-1 font-semibold">{r.issuingOrganization}</p>
                    </div>
                    <StatusBadge status={r.verification.status} />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    {r.credentialId && <p>ID: <strong className="font-mono text-slate-300">{r.credentialId}</strong></p>}
                    <p>Issue Date: <strong className="text-slate-350">{r.issueDate.split('T')[0]}</strong></p>
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

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex space-x-3 text-xs">
                    {r.credentialUrl && (
                      <a href={r.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-slate-450 hover:text-white underline">
                        Verify URL
                      </a>
                    )}
                    {r.certificateFile && (
                      <a href={`/api/v1/documents/${r.certificateFile._id}`} target="_blank" rel="noopener noreferrer" className="text-brand-450 hover:text-brand-355 underline font-semibold">
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
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 hover:border-slate-700"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteId(r._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-955/20 rounded-lg transition-colors border border-slate-800 hover:border-rose-900/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingRecord ? 'Edit Certification details' : 'Add Certification Record'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-955/20 border border-rose-900/40 text-rose-450 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Certification Name</label>
                  <input
                    type="text"
                    required
                    value={certificationName}
                    onChange={(e) => setCertificationName(e.target.value)}
                    placeholder="e.g. AWS Certified Cloud Practitioner"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issuing Organization</label>
                  <input
                    type="text"
                    required
                    value={issuingOrganization}
                    onChange={(e) => setIssuingOrganization(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {['Programming', 'Cloud', 'Data', 'AI/ML', 'Database', 'Cybersecurity', 'DevOps', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Credential ID (optional)</label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="e.g. AWS-12345"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Credential URL (optional)</label>
                  <input
                    type="url"
                    value={credentialUrl}
                    onChange={(e) => setCredentialUrl(e.target.value)}
                    placeholder="https://..."
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <FileUploader 
                  label="Upload Supporting Certificate file"
                  onUploadSuccess={(id) => setCertificateFile(id)}
                  initialFileName={editingRecord?.certificateFile?.originalName}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-355 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-955 rounded-xl text-sm font-bold shadow-md flex items-center"
                >
                  {saving && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />}
                  {editingRecord ? 'Save Changes' : 'Add Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Remove Certification"
        message="Are you sure you want to permanently delete this certification record? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Delete"
        type="danger"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog 
        isOpen={submitId !== null}
        title="Submit Certification for Verification"
        message="Are you sure you want to submit this certification record for verification? Once submitted, it cannot be modified until reviewed."
        onConfirm={handleSubmitVerification}
        onCancel={() => setSubmitId(null)}
        isLoading={submitLoading}
        confirmLabel="Submit for Verification"
        type="info"
      />
    </div>
  );
};

export default Certifications;
