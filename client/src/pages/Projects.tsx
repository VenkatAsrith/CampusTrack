import React, { useEffect, useState } from 'react';
import { FolderGit2, Plus, Edit2, Trash2, Globe, Github, PlusCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Project } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploader from '../components/FileUploader';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Dialog actions
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [studentRole, setStudentRole] = useState('Full Stack Developer');
  const [projectType, setProjectType] = useState('Academic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [proofDocument, setProofDocument] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openAddModal = () => {
    setEditingProject(null);
    setProjectName('');
    setDescription('');
    setTechnologies('');
    setCategory('Web Development');
    setGithubUrl('');
    setLiveDemoUrl('');
    setStudentRole('Full Stack Developer');
    setProjectType('Academic');
    setStartDate('');
    setEndDate('');
    setProofDocument(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setProjectName(p.projectName);
    setDescription(p.description);
    setTechnologies(p.technologies.join(', '));
    setCategory(p.category);
    setGithubUrl(p.githubUrl || '');
    setLiveDemoUrl(p.liveDemoUrl || '');
    setStudentRole(p.studentRole);
    setProjectType(p.projectType);
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setProofDocument(p.proofDocument?._id || null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/projects/${deleteId}`);
      setProjects(projects.filter(p => p._id !== deleteId));
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
      const res = await api.post(`/projects/${submitId}/submit`);
      if (res.data.status === 'success') {
        setProjects(projects.map(p => p._id === submitId ? res.data.data : p));
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
      projectName,
      description,
      technologies: technologies.split(',').map(t => t.trim()).filter(t => t !== ''),
      category,
      githubUrl,
      liveDemoUrl,
      studentRole,
      projectType,
      startDate,
      endDate: endDate || undefined,
      proofDocument: proofDocument || undefined,
    };

    try {
      if (editingProject) {
        const res = await api.patch(`/projects/${editingProject._id}`, payload);
        if (res.data.status === 'success') {
          setProjects(projects.map(p => p._id === editingProject._id ? res.data.data : p));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/projects', payload);
        if (res.data.status === 'success') {
          setProjects([...projects, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading projects portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">Projects Portfolio</h1>
          <p className="text-[#6C757D] text-xs mt-1">Manage academic, personal, or minor/major project records.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-sm rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Project
        </button>
      </div>

      {/* Grid List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
          <FolderGit2 className="h-14 w-14 text-[#94A3B8] mb-3" />
          <h3 className="text-base font-bold text-[#1E1E1E]">No projects added yet</h3>
          <p className="text-[#6C757D] text-xs mt-1.5 max-w-sm">Build your portfolio by documenting your capstone, minor, major, or personal projects.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add project now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const isDraftOrRejected = p.verification.status === 'DRAFT' || p.verification.status === 'REJECTED';
            return (
              <div 
                key={p._id}
                className="bg-white border border-[#E5E9F2] rounded-2xl shadow-sm hover:shadow-md p-6 hover:border-[#3B50DF]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-[#3B50DF] font-extrabold uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-1 border border-[#D9E1FC] rounded">
                        {p.projectType}
                      </span>
                      <h3 className="font-extrabold text-[#1E1E1E] text-base mt-2 truncate max-w-xs">{p.projectName}</h3>
                      <p className="text-[#6C757D] text-xs mt-0.5 font-semibold">{p.category}</p>
                    </div>
                    <StatusBadge status={p.verification.status} />
                  </div>

                  {/* Description */}
                  <p className="text-[#6C757D] text-xs mt-4 leading-relaxed line-clamp-3">{p.description}</p>

                  {/* Technologies tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.technologies.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#F4F6FA] text-[10px] text-[#1E1E1E] rounded">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Date details */}
                  <div className="mt-4 text-[10px] text-[#6C757D] font-semibold uppercase tracking-wider flex space-x-4">
                    <span>Role: <strong className="text-[#6C757D]">{p.studentRole}</strong></span>
                    <span>Date: <strong className="text-[#6C757D]">{p.startDate.split('T')[0]}</strong></span>
                  </div>

                  {/* Rejection comment banner */}
                  {p.verification.status === 'REJECTED' && (
                    <div className="mt-4 p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-350 flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 shrink-0 text-rose-450 mt-0.5" />
                      <div>
                        <p className="font-bold">Rejection Feedback:</p>
                        <p className="mt-0.5 font-normal text-rose-400 leading-relaxed">{p.verification.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="mt-6 pt-4 border-t border-[#E5E9F2]/80 flex items-center justify-between">
                  <div className="flex space-x-3 text-xs">
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#6C757D] hover:text-white flex items-center">
                        <Github size={13} className="mr-1.5" />
                        Code
                      </a>
                    )}
                    {p.liveDemoUrl && (
                      <a href={p.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-[#6C757D] hover:text-white flex items-center">
                        <Globe size={13} className="mr-1.5" />
                        Live Demo
                      </a>
                    )}
                    {p.proofDocument && (
                      <a 
                        href={`/api/v1/documents/${p.proofDocument._id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#3B50DF] hover:underline flex items-center"
                      >
                        View Proof File
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isDraftOrRejected && (
                      <>
                        <button
                          onClick={() => setSubmitId(p._id)}
                          className="flex items-center px-3 py-1.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                          title="Submit this project for verification"
                        >
                          <Send size={12} className="mr-1" />
                          Submit
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-[#6C757D] hover:text-white hover:bg-[#F4F6FA] rounded-lg transition-colors border border-[#E5E9F2] hover:border-[#3B50DF]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="p-1.5 text-[#6C757D] hover:text-rose-400 hover:bg-rose-955/20 rounded-lg transition-colors border border-[#E5E9F2] hover:border-rose-900/30"
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
                {editingProject ? 'Edit Project Details' : 'Add Project Record'}
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
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. CampusTrack"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Project Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['Web Development', 'Data Science', 'Machine Learning', 'AI', 'Data Engineering', 'Mobile', 'Cloud', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Project Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project, features, challenges solved..."
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Technologies (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="React, TypeScript, Express, MongoDB"
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Your Role *</label>
                  <input
                    type="text"
                    required
                    value={studentRole}
                    onChange={(e) => setStudentRole(e.target.value)}
                    placeholder="e.g. Lead Backend Developer"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Project Type *</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  >
                    {['Academic', 'Personal', 'Minor Project', 'Major Project', 'Hackathon'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">GitHub Repository Link</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Live Demo Link</label>
                  <input
                    type="url"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              {/* Proof File Uploader */}
              <div className="pt-2">
                <FileUploader 
                  label="Supporting Project Proof (Source code ZIP or Readme PDF)"
                  onUploadSuccess={(id) => setProofDocument(id)}
                  initialFileName={editingProject?.proofDocument?.originalName}
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
                  {editingProject ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Remove Project Record"
        message="Are you sure you want to permanently delete this project record? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Delete"
        type="danger"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog 
        isOpen={submitId !== null}
        title="Submit Project for Verification"
        message="Are you sure you want to submit this project record to the administrator queue? Once submitted, you cannot edit or delete it unless a coordinator rejects it."
        onConfirm={handleSubmitVerification}
        onCancel={() => setSubmitId(null)}
        isLoading={submitLoading}
        confirmLabel="Submit for Verification"
        type="info"
      />
    </div>
  );
};

export default Projects;
