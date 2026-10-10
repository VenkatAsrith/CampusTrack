import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CheckSquare, 
  Hourglass, 
  Award, 
  Briefcase, 
  Megaphone, 
  GraduationCap, 
  AlertTriangle,
  RefreshCw,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie 
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { resolveDocumentViewUrl, resolveDocumentDownloadUrl } from '../utils/documentUrl';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';

// Modern Education palette colors for charts
const EDU_CHART_COLORS = [
  '#3B50DF', // Royal Blue
  '#5B6EF5', // Slate Indigo
  '#8194F8', // Soft Sky Blue
  '#38BDF8', // Cyan Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
];

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/analytics')
      ]);
      setStats(statsRes.data.data);
      setChartData(analyticsRes.data.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load TPO stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);

    // Visibility-aware auto-polling (Section 53 & 54): 30 seconds interval, paused when browser tab is inactive
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 select-none">
        <div className="h-10 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const recentUpdates = stats?.recentProfileUpdates || [];

  return (
    <div className="space-y-6 select-none">
      {/* Main Header with Real-Time Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1E1E] tracking-tight leading-tight">
              Training & Placement Officer (TPO) Dashboard
            </h1>
          </div>
          <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
            Monitor student academic benchmarks, backlogs, verification queues, and recruitment drive pipelines.
          </p>
        </div>

        {/* Live Status & Manual Refresh Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-0.5"></span>
            <span>Live Auto-Sync Active</span>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D9E1FC] hover:border-[#3B50DF] hover:bg-[#EEF2FF] text-[#3B50DF] text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Fetch immediate updates from students"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Live Feed'}</span>
          </button>
        </div>
      </div>

      {/* Primary Row Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users size={20} />} 
          description="Enrolled across all branches"
        />
        <StatCard 
          title="Average CGPA" 
          value={stats.averageCgpa ? stats.averageCgpa.toFixed(2) : '0.00'} 
          icon={<GraduationCap size={20} />} 
          description="College-wide academic average"
        />
        <StatCard 
          title="Zero Backlogs" 
          value={stats.zeroBacklogsStudents ?? 0} 
          icon={<CheckSquare size={20} />} 
          description="Direct placement eligible"
          trend={{ value: `${stats.zeroBacklogsStudents ?? 0} students`, type: 'positive' }}
        />
        <StatCard 
          title="With Backlogs" 
          value={stats.withBacklogsStudents ?? 0} 
          icon={<AlertTriangle size={20} />} 
          description="Requires academic intervention"
          trend={{ value: `${stats.withBacklogsStudents ?? 0} students`, type: 'negative' }}
        />
      </div>

      {/* Secondary Row Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Awaiting Review" 
          value={stats.awaitingVerification} 
          icon={<Hourglass size={20} />} 
          description="Proofs pending verification"
          trend={{ value: `${stats.awaitingVerification} pending`, type: stats.awaitingVerification > 0 ? 'negative' : 'neutral' }}
        />
        <StatCard 
          title="Verified Records" 
          value={stats.verifiedRecords} 
          icon={<Award size={20} />} 
          description="Total approved achievements"
        />
        <StatCard 
          title="Active Notices" 
          value={stats.activeAnnouncementsCount ?? 0} 
          icon={<Megaphone size={20} />} 
          description="Published student notices"
        />
        <StatCard 
          title="Upcoming Drives" 
          value={stats.upcomingDrivesCount ?? 0} 
          icon={<Briefcase size={20} />} 
          description="Recruitment drives scheduled"
        />
      </div>

      {/* Tertiary Submodule Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-[#E5E9F2] rounded-2xl p-4 shadow-sm">
        <div className="text-center p-3 border-r border-[#E5E9F2]">
          <p className="text-[#6C757D] text-[11px] uppercase font-bold tracking-widest">Total Projects</p>
          <p className="text-[22px] font-bold text-[#1E1E1E] mt-1">{stats.totalProjects}</p>
        </div>
        <div className="text-center p-3 border-r border-[#E5E9F2]">
          <p className="text-[#6C757D] text-[11px] uppercase font-bold tracking-widest">Internships</p>
          <p className="text-[22px] font-bold text-[#1E1E1E] mt-1">{stats.totalInternships}</p>
        </div>
        <div className="text-center p-3 border-r border-[#E5E9F2]">
          <p className="text-[#6C757D] text-[11px] uppercase font-bold tracking-widest">Certifications</p>
          <p className="text-[22px] font-bold text-[#1E1E1E] mt-1">{stats.totalCertifications}</p>
        </div>
        <div className="text-center p-3">
          <p className="text-[#6C757D] text-[11px] uppercase font-bold tracking-widest">Hackathons</p>
          <p className="text-[22px] font-bold text-[#1E1E1E] mt-1">{stats.totalHackathons}</p>
        </div>
      </div>

      {/* Real-Time Student Profile Updates Section */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base font-bold text-[#1E1E1E]">
                Live Student Profile Updates (Real-Time Feed)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
                {recentUpdates.length} Active Records
              </span>
            </div>
            <p className="text-xs text-[#6C757D] mt-0.5">
              Live updates when students modify their profiles, upload photos, or update Cloudinary documents.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#6C757D] font-mono">
            <Sparkles size={13} className="text-[#3B50DF]" />
            <span>Synced: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {recentUpdates.length === 0 ? (
          <div className="p-8 text-center text-[#6C757D] text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            No student profile modifications recorded yet. Updates will appear here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentUpdates.map((student: any) => {
              const resumeViewUrl = student.resumeLink ? resolveDocumentViewUrl(student.resumeLink) : null;
              const resumeDownloadUrl = student.resumeLink ? resolveDocumentDownloadUrl(student.resumeLink) : null;

              return (
                <div 
                  key={student._id} 
                  className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#3B50DF] hover:shadow-md bg-white transition-all duration-150 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start space-x-3.5">
                    {/* Student Photo with Cloudinary URL or Initials */}
                    <div className="h-12 w-12 rounded-xl bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] font-extrabold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {student.profilePhoto ? (
                        <img 
                          src={student.profilePhoto} 
                          alt={student.fullName} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        student.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'ST'
                      )}
                    </div>

                    {/* Student Details */}
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#1E1E1E] truncate" title={student.fullName}>
                          {student.fullName}
                        </h3>
                        <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 ml-2">
                          {formatRelativeTime(student.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6C757D] font-mono mt-0.5">
                        {student.rollNumber} • {student.branch} (Y{student.year || 1}-S{student.semester || 1})
                      </p>

                      {/* Performance Indicators */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (student.cgpa || 0) >= 8.0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (student.cgpa || 0) >= 7.0
                            ? 'bg-[#EEF2FF] text-[#3B50DF] border-[#D9E1FC]'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          CGPA {student.cgpa ? Number(student.cgpa).toFixed(2) : '0.00'}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (student.numberOfBacklogs ?? 0) === 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {student.numberOfBacklogs ?? 0} Backlogs
                        </span>

                        <div className="flex items-center space-x-1.5 text-[10px] text-[#6C757D] font-mono ml-auto">
                          <span>Profile:</span>
                          <span className="font-bold text-[#3B50DF]">{student.profileCompletion ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Links: Resume & Full Profile */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    {resumeViewUrl ? (
                      <div className="flex items-center space-x-2">
                        <a
                          href={resumeViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#3B50DF] hover:underline"
                          title="Preview resume online inside browser"
                        >
                          <FileText size={12} />
                          <span>View Resume</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </a>
                        <a
                          href={resumeDownloadUrl!}
                          download={`${student.rollNumber}_Resume.pdf`}
                          className="text-[#64748B] hover:text-[#3B50DF] p-1 rounded hover:bg-[#EEF2FF] transition"
                          title="Download resume file"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8] italic">No resume uploaded</span>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/admin/students/${student._id}`)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#3B50DF] hover:bg-[#2E3FB8] text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      <span>View Total Profile</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: CGPA Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
          {/* Section Titles (~14–16px Semi-Bold) */}
          <h3 className="text-[15px] font-semibold text-[#1E1E1E] mb-0.5">CGPA Distribution (All Branches)</h3>
          {/* Subtext & Metadata (~10–11px Regular) */}
          <p className="text-[#6C757D] text-[11px] mb-6">Student academic standing distribution</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.cgpaDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="range" stroke="#6C757D" opacity={0.8} tick={{ fontSize: 11 }} />
                <YAxis stroke="#6C757D" opacity={0.8} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#1E1E1E', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                  itemStyle={{ color: '#1E1E1E' }}
                />
                <Bar dataKey="count" fill="#3B50DF" radius={[8, 8, 0, 0]}>
                  {(chartData?.cgpaDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={EDU_CHART_COLORS[index % EDU_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Branch Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
          <h3 className="text-[15px] font-semibold text-[#1E1E1E] mb-0.5">Student Enrollment by Branch</h3>
          <p className="text-[#6C757D] text-[11px] mb-6">Branch-wise candidate pool</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.branchDistribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#6C757D" opacity={0.8} tick={{ fontSize: 11 }} />
                <YAxis dataKey="branch" type="category" stroke="#6C757D" opacity={0.9} tick={{ fontSize: 9 }} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#1E1E1E', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                />
                <Bar dataKey="count" fill="#5B6EF5" radius={[0, 8, 8, 0]}>
                  {(chartData?.branchDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-branch-${index}`} fill={EDU_CHART_COLORS[index % EDU_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Coding Platforms */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
          <h3 className="text-[15px] font-semibold text-[#1E1E1E] mb-0.5">Competitive Coding Participation</h3>
          <p className="text-[#6C757D] text-[11px] mb-6">Profiles connected by platform</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.codingPlatforms || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="platform" stroke="#6C757D" opacity={0.8} tick={{ fontSize: 11 }} />
                <YAxis stroke="#6C757D" opacity={0.8} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#1E1E1E', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                />
                <Bar dataKey="count" fill="#3B50DF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Verification Status Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
          <h3 className="text-[15px] font-semibold text-[#1E1E1E] mb-0.5">Internship Verification Status</h3>
          <p className="text-[#6C757D] text-[11px] mb-6">Verification audit breakdown</p>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.internshipStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {(chartData?.internshipStatus || []).map((_: any, index: number) => (
                    <Cell key={`cell-pie-${index}`} fill={EDU_CHART_COLORS[index % EDU_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#1E1E1E', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
