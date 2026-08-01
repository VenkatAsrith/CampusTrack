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
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading coding profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Coding Platform Profiles</h1>
          <p className="text-slate-400 text-xs mt-1">Add links to your competitive programming profiles to showcase solving statistics.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-slate-955 rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} className="mr-1" />
          Add Platform
        </button>
      </div>

      {/* Grid of profiles */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <Code2 className="h-16 w-16 text-slate-700 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-white">No coding profiles added yet</h3>
          <p className="text-slate-500 text-xs mt-2 max-w-sm">Connect your LeetCode, CodeChef, GeeksforGeeks, or Codeforces accounts to update metrics.</p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center px-4 py-2 text-xs font-bold border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl transition-all"
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
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-brand-400">
                    {p.platform[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-none">{p.platform}</h3>
                    <span className="text-xs text-slate-500 font-mono mt-1.5 block">{p.username}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit profile details"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p._id)}
                    className="p-2 text-slate-400 hover:text-rose-450 hover:bg-rose-955/20 rounded-lg transition-colors"
                    title="Remove profile"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-850 rounded-xl p-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rating</span>
                  <p className="text-sm font-bold text-white mt-1">{p.currentRating || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Solved</span>
                  <p className="text-sm font-bold text-white mt-1">{p.problemsSolved || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rank</span>
                  <p className="text-sm font-bold text-white mt-1">{p.rank || '-'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <a 
                  href={p.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline flex items-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingProfile ? `Edit ${platform} Details` : 'Add Coding Platform'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-955/20 border border-rose-900/40 text-rose-450 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Platform</label>
                <select
                  disabled={!!editingProfile}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  {['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Codeforces', 'Other'].map(plat => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Platform Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rollno_name"
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Profile URL</label>
                <input
                  type="url"
                  required
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://..."
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Rating</label>
                  <input
                    type="number"
                    value={currentRating}
                    onChange={(e) => setCurrentRating(e.target.value)}
                    placeholder="e.g. 1540"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Highest Rating</label>
                  <input
                    type="number"
                    value={highestRating}
                    onChange={(e) => setHighestRating(e.target.value)}
                    placeholder="e.g. 1620"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Global Rank</label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 23500"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Problems Solved</label>
                  <input
                    type="number"
                    value={problemsSolved}
                    onChange={(e) => setProblemsSolved(e.target.value)}
                    placeholder="e.g. 250"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-350 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-955 rounded-xl text-sm font-bold shadow-md flex items-center"
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
