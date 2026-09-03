import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Clock, 
  ExternalLink, 
  Search, 
  Building2,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import type { Announcement } from '../types';

const StudentAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements', {
        params: {
          search: search || undefined,
          type: filterType !== 'all' ? filterType : undefined,
        },
      });
      setAnnouncements(res.data.data.all || []);
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

  const types = ['all', 'Placement', 'Drive', 'Internship', 'Academic', 'Event', 'General'];

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="glow-orb top-0 right-0 w-64 h-64 bg-[#3B50DF]/5" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-2">
            <Megaphone size={14} />
            <span>Placement & Notice Feed</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1E1E1E]">
            Announcements & Placement Drives
          </h1>
          <p className="text-[#6C757D] text-xs mt-1">
            Stay updated with recruitment schedules, registration deadlines, and department notices.
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
                  : 'bg-[#F4F6FA] text-[#6C757D] hover:text-[#1E1E1E] border border-[#E2E8F0]'
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
            placeholder="Search by company or title..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B50DF] focus:ring-2 focus:ring-[#3B50DF]/15"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]" />
        </form>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <div className="h-8 w-8 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#6C757D] text-xs font-semibold">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-12 text-center text-[#6C757D] shadow-sm">
          <Megaphone size={36} className="mx-auto text-[#94A3B8] mb-3" />
          <p className="text-sm font-semibold text-[#1E1E1E]">No active announcements matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {announcements.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedAnnouncement(item)}
              className="bg-white border border-[#E5E9F2] hover:border-[#3B50DF] rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between hover-lift cursor-pointer transition relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                    {item.type}
                  </span>
                  <StatusBadge status={item.status} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#1E1E1E] line-clamp-1 group-hover:text-[#3B50DF] transition">
                    {item.title}
                  </h3>
                  {item.companyName && (
                    <p className="text-xs text-[#3B50DF] font-semibold mt-1 flex items-center">
                      <Building2 size={12} className="mr-1" />
                      {item.companyName} {item.jobRole && `• ${item.jobRole}`}
                    </p>
                  )}
                </div>

                <p className="text-xs text-[#6C757D] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {item.eligibility && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.eligibility.minCGPA ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F6FA] text-[#6C757D] border border-[#E2E8F0]">
                        Min {item.eligibility.minCGPA} CGPA
                      </span>
                    ) : null}
                    {item.eligibility.eligibleBranches && item.eligibility.eligibleBranches.length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F6FA] text-[#6C757D] border border-[#E2E8F0]">
                        {item.eligibility.eligibleBranches.slice(0, 2).join(', ')}
                        {item.eligibility.eligibleBranches.length > 2 && ' +more'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E9F2] flex items-center justify-between text-xs text-[#6C757D]">
                <div className="flex items-center space-x-1">
                  <Clock size={12} className="text-[#3B50DF]" />
                  <span className="text-[11px]">
                    {item.endDate ? `Deadline: ${new Date(item.endDate).toLocaleDateString()}` : 'Open ended'}
                  </span>
                </div>

                <span className="text-xs font-bold text-[#3B50DF] flex items-center group-hover:translate-x-0.5 transition-transform">
                  View Details <ChevronRight size={14} className="ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm"
            onClick={() => setSelectedAnnouncement(null)}
          />

          <div className="relative bg-white border border-[#E5E9F2] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                    {selectedAnnouncement.type}
                  </span>
                  <StatusBadge status={selectedAnnouncement.status} />
                </div>
                <h3 className="text-lg font-extrabold text-[#1E1E1E] leading-snug">
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
                className="p-1.5 rounded-xl bg-[#F4F6FA] text-[#6C757D] hover:text-[#1E1E1E] hover:bg-[#E2E8F0] transition"
              >
                ✕
              </button>
            </div>

            {/* Dates Bar */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
              <div>
                <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Posted Date</span>
                <span className="text-[#1E1E1E] font-mono font-semibold">
                  {new Date(selectedAnnouncement.startDate || selectedAnnouncement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#6C757D] text-[10px] uppercase font-bold block">Registration Deadline</span>
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
                <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center">
                  <GraduationCap size={14} className="mr-1.5 text-[#3B50DF]" /> Eligibility Criteria
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#6C757D]">
                  <div>Min CGPA: <strong className="text-[#1E1E1E]">{selectedAnnouncement.eligibility.minCGPA || 0}</strong></div>
                  <div>Max Backlogs: <strong className="text-[#1E1E1E]">{selectedAnnouncement.eligibility.maxBacklogs ?? 'Any'}</strong></div>
                  {selectedAnnouncement.eligibility.eligibleYears && selectedAnnouncement.eligibility.eligibleYears.length > 0 && (
                    <div className="col-span-2">
                      Eligible Years: <strong className="text-[#1E1E1E]">{selectedAnnouncement.eligibility.eligibleYears.map((y) => `Year ${y}`).join(', ')}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Notice Description</h4>
              <p className="text-xs text-[#1E1E1E] leading-relaxed whitespace-pre-line bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                {selectedAnnouncement.description}
              </p>
            </div>

            {/* Action Links & CTAs */}
            {selectedAnnouncement.links && selectedAnnouncement.links.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Application / Registration Links</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedAnnouncement.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-md shadow-[#3B50DF]/20 transition active:scale-95"
                    >
                      <ExternalLink size={14} className="mr-1.5" />
                      {link.label || 'Apply Now / Open Form'}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#E5E9F2] flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2 rounded-xl bg-[#F4F6FA] border border-[#E2E8F0] text-xs font-semibold text-[#1E1E1E] hover:bg-[#E2E8F0] transition"
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
