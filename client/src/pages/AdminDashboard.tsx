import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  Hourglass, 
  Award, 
  Trophy, 
  Briefcase,
  FileCheck,
  FolderOpen
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

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

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
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading administration dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Institutional Dashboard</h1>
        <p className="text-slate-400 text-xs mt-1">Review student registry, verification pipelines, and analytical aggregates.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users size={20} />} 
          description="Enrolled in CSE batch"
        />
        <StatCard 
          title="Profiles Completed" 
          value={stats.completedProfiles} 
          icon={<FileCheck size={20} />} 
          description="Weighted completion >= 80%"
        />
        <StatCard 
          title="Awaiting Review" 
          value={stats.awaitingVerification} 
          icon={<Hourglass size={20} />} 
          description="Records in verification queue"
          trend={{ value: `${stats.awaitingVerification} records`, type: stats.awaitingVerification > 0 ? 'warning' : 'neutral' as any }}
        />
        <StatCard 
          title="Verified Records" 
          value={stats.verifiedRecords} 
          icon={<CheckSquare size={20} />} 
          description="Total approved achievements"
        />
      </div>

      {/* Grid of Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/20 border border-slate-900 rounded-xl p-4">
        <div className="text-center p-3 border-r border-slate-800/80">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Projects</p>
          <p className="text-xl font-bold text-white mt-1.5 flex items-center justify-center">
            <FolderOpen size={16} className="text-slate-500 mr-2" />
            {stats.totalProjects}
          </p>
        </div>
        <div className="text-center p-3 border-r border-slate-800/80">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Internships</p>
          <p className="text-xl font-bold text-white mt-1.5 flex items-center justify-center">
            <Briefcase size={16} className="text-slate-500 mr-2" />
            {stats.totalInternships}
          </p>
        </div>
        <div className="text-center p-3 border-r border-slate-800/80">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Certifications</p>
          <p className="text-xl font-bold text-white mt-1.5 flex items-center justify-center">
            <Award size={16} className="text-slate-500 mr-2" />
            {stats.totalCertifications}
          </p>
        </div>
        <div className="text-center p-3">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Hackathons Participated</p>
          <p className="text-xl font-bold text-white mt-1.5 flex items-center justify-center">
            <Trophy size={16} className="text-slate-500 mr-2" />
            {stats.totalHackathons}
          </p>
        </div>
      </div>

      {/* Recharts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CGPA Distribution */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
          <h3 className="text-sm font-bold text-white mb-4">CGPA Range Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.cgpaDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {chartData.cgpaDistribution.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coding platform participation */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
          <h3 className="text-sm font-bold text-white mb-4">Coding Platforms Participation</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-center">
            {chartData.codingPlatforms.length === 0 ? (
              <p className="text-xs text-slate-550">No coding handles added yet.</p>
            ) : (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.codingPlatforms}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="platform"
                      >
                        {chartData.codingPlatforms.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-2 mt-4 md:mt-0 px-4">
                  {chartData.codingPlatforms.map((entry: any, index: number) => (
                    <div key={entry.platform} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-350">{entry.platform}</span>
                      </div>
                      <span className="font-semibold text-white">{entry.count} students</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Certification Categories */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Certificate Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.certCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
