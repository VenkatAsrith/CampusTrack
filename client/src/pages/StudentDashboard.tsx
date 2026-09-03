import React, { useEffect, useState } from 'react';
import { 
  FolderGit2, 
  Briefcase, 
  Award, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Megaphone,
  Building2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import type { Announcement } from '../types';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, announceRes] = await Promise.all([
          api.get('/students/dashboard-summary'),
          api.get('/announcements'),
        ]);
        setData(dashRes.data.data);
        setAnnouncements(announceRes.data.data?.all || []);
      } catch (err) {
        console.error('Failed to load student dashboard data.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-[#3B50DF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#6C757D] text-sm font-semibold">Loading student dashboard...</p>
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white rounded-2xl border border-[#E5E9F2] shadow-sm">
        <AlertCircle size={40} className="text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-[#1E1E1E]">Unable to load student profile</h3>
        <p className="text-[#6C757D] text-sm mt-1 max-w-md">
          We could not fetch your dashboard data from the server. Please check your connection or refresh the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2.5 bg-[#3B50DF] hover:bg-[#2E3FB8] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#3B50DF]/20"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  const student = data.student;
  const metrics = data.metrics || { projects: 0, internships: 0, certifications: 0, hackathons: 0 };
  const completion = data.completion || { percentage: 0, missing: [] };
  const alerts = data.alerts || [];

  return (
    <div className="space-y-6 select-none">
      {/* Welcome Hero Widget */}
      <div className="relative bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="glow-orb top-0 right-0 w-72 h-72 bg-[#3B50DF]/5" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-xs font-bold text-[#3B50DF] mb-3">
              <span>Student Academic Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E1E] tracking-tight">
              Welcome back, {student.fullName ? student.fullName.split(' ')[0] : 'Student'} 👋
            </h1>
            <p className="text-[#6C757D] text-sm mt-1.5 font-normal">
              Academic credentials, verified portfolio achievements, and placement readiness.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-5 text-xs">
              <span className="bg-[#F4F6FA] border border-[#E5E9F2] px-2.5 py-1 rounded-lg text-[#6C757D]">
                Roll: <strong className="text-[#1E1E1E] font-bold">{student.rollNumber}</strong>
              </span>
              <span className="bg-[#F4F6FA] border border-[#E5E9F2] px-2.5 py-1 rounded-lg text-[#6C757D]">
                Branch: <strong className="text-[#1E1E1E] font-bold">{student.branch}</strong>
              </span>
              <span className="bg-[#F4F6FA] border border-[#E5E9F2] px-2.5 py-1 rounded-lg text-[#6C757D]">
                Year: <strong className="text-[#1E1E1E] font-bold">{student.year || 1}</strong>
              </span>
              <span className="bg-[#F4F6FA] border border-[#E5E9F2] px-2.5 py-1 rounded-lg text-[#6C757D]">
                Sem: <strong className="text-[#1E1E1E] font-bold">{student.semester}</strong>
              </span>
              <span className="bg-[#EEF2FF] border border-[#D9E1FC] px-2.5 py-1 rounded-lg text-[#3B50DF]">
                CGPA: <strong className="font-extrabold">{student.cgpa ? student.cgpa.toFixed(2) : '0.00'}</strong>
              </span>
              <span className="bg-[#F4F6FA] border border-[#E5E9F2] px-2.5 py-1 rounded-lg text-[#6C757D]">
                Backlogs: <strong className="text-[#1E1E1E] font-bold">{student.numberOfBacklogs ?? 0}</strong>
              </span>
            </div>
          </div>
          
          {/* Circular/Text Progress Bar */}
          <div className="flex items-center bg-[#EEF2FF]/60 border border-[#D9E1FC] rounded-2xl p-4 shrink-0 shadow-sm">
            <div className="relative flex items-center justify-center h-16 w-16 mr-4 bg-[#3B50DF] rounded-full shadow-md shadow-[#3B50DF]/30 text-white font-extrabold text-lg">
              {completion.percentage}%
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#3B50DF] uppercase tracking-widest">Profile Completion</p>
              <div className="w-40 bg-[#D9E1FC] h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#3B50DF] h-full rounded-full transition-all duration-500 shadow-sm" 
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6C757D] mt-1.5 font-medium">Weighted portfolio score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid count widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Projects" 
          value={metrics.projects} 
          icon={<FolderGit2 size={20} />} 
          description="Academic & personal projects"
        />
        <StatCard 
          title="Internships" 
          value={metrics.internships} 
          icon={<Briefcase size={20} />} 
          description="Corporate internships"
        />
        <StatCard 
          title="Certificates" 
          value={metrics.certifications} 
          icon={<Award size={20} />} 
          description="Technical certifications"
        />
        <StatCard 
          title="Hackathons" 
          value={metrics.hackathons} 
          icon={<Trophy size={20} />} 
          description="Hackathon & contest records"
        />
      </div>

      {/* Announcements & Upcoming Placement Drives */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC]">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E1E1E]">Active Announcements & Upcoming Placement Drives</h3>
              <p className="text-xs text-[#6C757D]">Recruitment schedules, registration links, and deadline notices.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/announcements')}
            className="flex items-center text-xs font-bold text-[#3B50DF] hover:text-[#2E3FB8] transition"
          >
            <span>View All Notices</span>
            <ChevronRight size={14} className="ml-1" />
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="p-8 text-center text-[#6C757D] text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            No active placement drives or announcements posted currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {announcements.slice(0, 3).map((item) => (
              <div
                key={item._id}
                onClick={() => navigate('/student/announcements')}
                className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#3B50DF] rounded-xl flex flex-col justify-between hover-lift cursor-pointer transition shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF]">
                      {item.type}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="text-sm font-bold text-[#1E1E1E] line-clamp-1">{item.title}</h4>
                  {item.companyName && (
                    <p className="text-xs text-[#6C757D] flex items-center font-semibold">
                      <Building2 size={12} className="mr-1 text-[#3B50DF]" />
                      {item.companyName}
                    </p>
                  )}
                  <p className="text-xs text-[#6C757D] line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#6C757D]">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1 text-[#3B50DF]" />
                    <span>{item.endDate ? `Ends ${new Date(item.endDate).toLocaleDateString()}` : 'No deadline'}</span>
                  </div>
                  <span className="font-bold text-[#3B50DF] flex items-center">
                    Apply <ExternalLink size={11} className="ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Verification Alerts / Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
            <h3 className="text-base font-extrabold text-[#1E1E1E] mb-4 flex items-center tracking-tight">
              <Clock size={16} className="text-[#3B50DF] mr-2" />
              Verification Queue Status
            </h3>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-[#1E1E1E]">All caught up!</p>
                <p className="text-xs text-[#6C757D] mt-1">No pending verification records or rejection reviews.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {alerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    className={`flex flex-col p-4 border rounded-xl transition-all duration-200 ${
                      alert.status === 'REJECTED' 
                        ? 'bg-rose-50/70 border-rose-200' 
                        : alert.status === 'VERIFIED'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-[10px] text-[#3B50DF] font-bold uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-0.5 rounded border border-[#D9E1FC]">
                          {alert.module}
                        </span>
                        <h4 className="text-sm font-bold text-[#1E1E1E] truncate max-w-xs">{alert.name}</h4>
                      </div>
                      <StatusBadge status={alert.status} />
                    </div>
                    
                    {alert.status === 'REJECTED' && (
                      <div className="mt-3 p-3 bg-white border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-900">TPO Feedback / Rejection Reason:</p>
                          <p className="mt-1 leading-relaxed text-rose-700">{alert.reason || 'No comments provided.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: Checklist and Next steps */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E9F2]">
            <h3 className="text-base font-extrabold text-[#1E1E1E] mb-4 flex items-center tracking-tight">
              <TrendingUp size={16} className="text-[#3B50DF] mr-2" />
              Profile Completeness Checklist
            </h3>

            {completion.missing.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                <p className="text-sm font-extrabold text-[#1E1E1E]">100% Completed! 🎉</p>
                <p className="text-xs text-[#6C757D] mt-1.5 leading-relaxed">
                  Your academic profile and verified portfolio achievements are completely up to date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#6C757D] leading-relaxed font-medium">
                  Complete these sections to boost your placement readiness score:
                </p>
                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1">
                  {completion.missing.map((item: string, index: number) => (
                    <div 
                      key={index}
                      className="flex items-start p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#1E1E1E] hover:border-[#D9E1FC] transition-all duration-200"
                    >
                      <div className="h-2 w-2 rounded-full bg-[#3B50DF] mt-1.5 mr-2.5 shrink-0" />
                      <span className="font-medium text-[#1E1E1E]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
