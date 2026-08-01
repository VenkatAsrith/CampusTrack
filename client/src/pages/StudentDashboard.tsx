import React, { useEffect, useState } from 'react';
import { 
  FolderGit2, 
  Briefcase, 
  Award, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/students/dashboard-summary');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load student dashboard summary.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Loading student dashboard...</p>
      </div>
    );
  }

  const { student, metrics, completion, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Widget */}
      <div className="relative bg-gradient-to-r from-brand-900/60 to-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-48 w-48 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {student.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-350 text-sm mt-1">
              Here is an overview of your college career records and achievement verifications.
            </p>
            <div className="flex items-center space-x-4 mt-4 text-xs font-mono text-slate-450">
              <span>ROLL: <strong className="text-slate-300">{student.rollNumber}</strong></span>
              <span className="h-3 w-px bg-slate-800" />
              <span>CGPA: <strong className="text-slate-300">{student.cgpa.toFixed(2)}</strong></span>
              <span className="h-3 w-px bg-slate-800" />
              <span>SEM: <strong className="text-slate-300">{student.semester}</strong></span>
            </div>
          </div>
          
          {/* Circular/Text Progress Bar */}
          <div className="flex items-center bg-slate-950/40 border border-slate-800 rounded-2xl p-4 shrink-0">
            <div className="relative flex items-center justify-center h-16 w-16 mr-4 bg-slate-900 rounded-full border border-slate-700">
              <span className="text-lg font-black text-brand-400">{completion.percentage}%</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile Completion</p>
              <div className="w-40 bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Weighted completion progress</p>
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
          description="AWS, GCP, Coursera, etc."
        />
        <StatCard 
          title="Hackathons" 
          value={metrics.hackathons} 
          icon={<Trophy size={20} />} 
          description="SIH and college hackathons"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Verification Alerts / Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center">
              <Clock size={16} className="text-brand-400 mr-2" />
              Verification Queue Status
            </h3>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No pending verification records or rejection reviews.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {alerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    className={`flex flex-col p-4 border rounded-xl transition-colors ${
                      alert.status === 'REJECTED' 
                        ? 'bg-rose-955/10 border-rose-900/30' 
                        : alert.status === 'VERIFIED'
                        ? 'bg-emerald-955/10 border-emerald-900/30'
                        : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {alert.module}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate max-w-xs">{alert.name}</h4>
                      </div>
                      <StatusBadge status={alert.status} />
                    </div>
                    
                    {alert.status === 'REJECTED' && (
                      <div className="mt-3 p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg text-xs text-rose-350 flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">Rejection Comment:</p>
                          <p className="mt-1 leading-relaxed">{alert.reason || 'No comments provided.'}</p>
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
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center">
              <TrendingUp size={16} className="text-brand-400 mr-2" />
              Complete Your Profile
            </h3>

            {completion.missing.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-white">100% Completed! 🎉</p>
                <p className="text-xs text-slate-500 mt-1">Excellent! Your profile and achievements databases are fully seeded and placement-ready.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit these details to improve your profile completeness score and help placement cell evaluation:
                </p>
                <div className="space-y-2.5 mt-4 max-h-[300px] overflow-y-auto pr-1">
                  {completion.missing.map((item: string, index: number) => (
                    <div 
                      key={index}
                      className="flex items-start p-3 bg-slate-950/50 border border-slate-850 rounded-xl text-xs text-slate-350 group hover:border-slate-700 transition-colors"
                    >
                      <div className="h-2 w-2 rounded-full bg-brand-400 mt-1.5 mr-2.5 shrink-0" />
                      <span>{item}</span>
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
