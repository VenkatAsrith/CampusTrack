import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  Hourglass, 
  Award, 
  Briefcase, 
  Megaphone, 
  GraduationCap, 
  AlertTriangle 
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

// Modern Education palette colors for charts
const EDU_CHART_COLORS = [
  '#3B50DF', // Royal Blue
  '#5B6EF5', // Slate Indigo
  '#8194F8', // Soft Sky Blue
  '#38BDF8', // Cyan Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/dashboard-stats'),
          api.get('/admin/analytics')
        ]);
        setStats(statsRes.data.data);
        setChartData(analyticsRes.data.data);
      } catch (err) {
        console.error('Failed to load TPO stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 select-none">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading TPO analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Main Header (~28–32px Extra Bold) */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1E1E] tracking-tight leading-tight">
          Training & Placement Officer (TPO) Dashboard
        </h1>
        {/* Secondary / Description (~12–14px Muted Gray) */}
        <p className="text-[#6C757D] text-[13px] mt-1 font-normal">
          Monitor student academic benchmarks, backlogs, verification queues, and recruitment drive pipelines.
        </p>
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
