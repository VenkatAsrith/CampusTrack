import React, { useEffect, useState } from 'react';
import { Code2, Plus, Edit2, Trash2, Globe, PlusCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { CodingProfile } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

const CodingProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<CodingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CodingProfile | null>(null);
  
  // Dialog confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Form states
  const [platform, setPlatform] = useState('LeetCode');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [currentRating, setCurrentRating] = useState('');
  const [highestRating, setHighestRating] = useState('');
  const [rank, setRank] = useState('');
  const [problemsSolved, setProblemsSolved] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/coding-profiles');
      setProfiles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch coding profiles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openAddModal = () => {
    setEditingProfile(null);
    setPlatform('LeetCode');
    setUsername('');
    setProfileUrl('');
    setCurrentRating('');
    setHighestRating('');
    setRank('');
    setProblemsSolved('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: CodingProfile) => {
    setEditingProfile(p);
    setPlatform(p.platform);
    setUsername(p.username);
    setProfileUrl(p.profileUrl);
    setCurrentRating(p.currentRating?.toString() || '');
    setHighestRating(p.highestRating?.toString() || '');
    setRank(p.rank?.toString() || '');
    setProblemsSolved(p.problemsSolved?.toString() || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/coding-profiles/${deleteId}`);
      setProfiles(profiles.filter(p => p._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      platform,
      username,
      profileUrl,
      currentRating: Number(currentRating) || 0,
      highestRating: Number(highestRating) || 0,
      rank: Number(rank) || 0,
      problemsSolved: Number(problemsSolved) || 0,
    };

    try {
      if (editingProfile) {
        // Edit Mode
        const res = await api.patch(`/coding-profiles/${editingProfile._id}`, payload);
        if (res.data.status === 'success') {
          setProfiles(profiles.map(p => p._id === editingProfile._id ? res.data.data : p));
          setModalOpen(false);
        }
      } else {
        // Add Mode
        const res = await api.post('/coding-profiles', payload);
        if (res.data.status === 'success') {
          setProfiles([...profiles, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save coding profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading coding profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">Coding Platform Profiles</h1>
          <p className="text-[#6C757D] text-xs mt-1">Add links to your competitive programming profiles to showcase solving statistics.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white shadow-sm rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Platform
        </button>
      </div>

      {/* Grid of profiles */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
          <Code2 className="h-14 w-14 text-[#94A3B8] mb-3" />
          <h3 className="text-base font-bold text-[#1E1E1E]">No coding profiles added yet</h3>
          <p className="text-[#6C757D] text-xs mt-1.5 max-w-sm">Connect your LeetCode, CodeChef, GeeksforGeeks, or Codeforces accounts to update metrics.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl shadow-sm transition active:scale-95"
          >
            <PlusCircle size={14} className="mr-1.5" />
            Add platform now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div 
              key={p._id}
              className="bg-white border border-[#E5E9F2] rounded-2xl shadow-sm hover:shadow-md p-5 hover:border-[#3B50DF] transition-all flex flex-col justify-between shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] flex items-center justify-center font-black text-[#3B50DF]">
                    {p.platform[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E1E1E] text-base leading-none">{p.platform}</h3>
                    <span className="text-xs text-[#6C757D] font-mono mt-1.5 block">{p.username}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 text-[#6C757D] hover:text-white hover:bg-[#F4F6FA] rounded-lg transition-colors"
                    title="Edit profile details"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p._id)}
                    className="p-2 text-[#6C757D] hover:text-rose-450 hover:bg-rose-955/20 rounded-lg transition-colors"
                    title="Remove profile"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-center">
                <div>
                  <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Rating</span>
                  <p className="text-sm font-bold text-[#1E1E1E] mt-1">{p.currentRating || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Solved</span>
                  <p className="text-sm font-bold text-[#1E1E1E] mt-1">{p.problemsSolved || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6C757D] uppercase font-bold tracking-wider">Rank</span>
                  <p className="text-sm font-bold text-[#1E1E1E] mt-1">{p.rank || '-'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E9F2] flex items-center justify-between text-xs">
                <a 
                  href={p.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#3B50DF] hover:underline flex items-center"
                >
                  <Globe size={12} className="mr-1.5" />
                  Visit coding profile
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151B3B]/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F2] mb-4">
              <h3 className="text-base font-extrabold text-[#1E1E1E]">
                {editingProfile ? `Edit ${platform} Details` : 'Add Coding Platform'}
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
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Platform *</label>
                <select
                  disabled={!!editingProfile}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15 disabled:opacity-50"
                >
                  {['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Codeforces', 'Other'].map(plat => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Platform Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rollno_name"
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Profile URL *</label>
                <input
                  type="url"
                  required
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://..."
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Current Rating</label>
                  <input
                    type="number"
                    value={currentRating}
                    onChange={(e) => setCurrentRating(e.target.value)}
                    placeholder="e.g. 1540"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Highest Rating</label>
                  <input
                    type="number"
                    value={highestRating}
                    onChange={(e) => setHighestRating(e.target.value)}
                    placeholder="e.g. 1620"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Global Rank</label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 23500"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] uppercase tracking-wider mb-1">Problems Solved</label>
                  <input
                    type="number"
                    value={problemsSolved}
                    onChange={(e) => setProblemsSolved(e.target.value)}
                    placeholder="e.g. 250"
                    className="block w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
                  />
                </div>
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
                  {editingProfile ? 'Save Changes' : 'Add Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Remove Coding Profile"
        message="Are you sure you want to remove this coding platform profile link? This will recalculate your profile completion score."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLoading}
        confirmLabel="Remove"
        type="danger"
      />
    </div>
  );
};

export default CodingProfiles;
