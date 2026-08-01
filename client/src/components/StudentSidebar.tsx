import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  Code2, 
  FolderGit2, 
  Briefcase, 
  Award, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const StudentSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('campustrack_student') || '{}');

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'My Profile', path: '/student/profile', icon: <UserCircle size={18} /> },
    { name: 'Coding Profiles', path: '/student/coding', icon: <Code2 size={18} /> },
    { name: 'Projects', path: '/student/projects', icon: <FolderGit2 size={18} /> },
    { name: 'Internships', path: '/student/internships', icon: <Briefcase size={18} /> },
    { name: 'Certifications', path: '/student/certifications', icon: <Award size={18} /> },
    { name: 'NPTEL Courses', path: '/student/nptel', icon: <BookOpen size={18} /> },
    { name: 'Hackathons', path: '/student/hackathons', icon: <Trophy size={18} /> },
    { name: 'Achievements', path: '/student/achievements', icon: <Sparkles size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
    localStorage.removeItem('campustrack_student');
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-350 select-none">
      {/* Brand header */}
      <div className="flex items-center px-6 py-5 border-b border-slate-800/80">
        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-slate-950">
          CT
        </div>
        <div className="ml-3">
          <h1 className="font-extrabold text-white text-base leading-none tracking-tight">CampusTrack</h1>
          <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase mt-1 block">STUDENT PORTAL</span>
        </div>
      </div>

      {/* Student Brief Profile */}
      <div className="px-5 py-4 border-b border-slate-800/50 flex items-center">
        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400">
          {student.fullName ? student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'S'}
        </div>
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-semibold text-white truncate leading-none">{student.fullName || 'Student'}</p>
          <span className="text-xs text-slate-500 font-mono mt-1 block">{student.rollNumber || 'CSE000'}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/10 font-semibold'
                  : 'hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <div className="flex items-center space-x-3">
              <span className="transition-transform group-hover:scale-105">{item.icon}</span>
              <span>{item.name}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-450 hover:bg-rose-955/20 hover:text-rose-400 transition-all group"
        >
          <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;
