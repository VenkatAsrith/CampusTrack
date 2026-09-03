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
  Megaphone,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const StudentSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('campustrack_student') || '{}');

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Profile', path: '/student/profile', icon: <UserCircle size={20} /> },
    { name: 'Announcements', path: '/student/announcements', icon: <Megaphone size={20} /> },
    { name: 'Coding Profiles', path: '/student/coding', icon: <Code2 size={20} /> },
    { name: 'Projects', path: '/student/projects', icon: <FolderGit2 size={20} /> },
    { name: 'Internships', path: '/student/internships', icon: <Briefcase size={20} /> },
    { name: 'Certifications', path: '/student/certifications', icon: <Award size={20} /> },
    { name: 'NPTEL Courses', path: '/student/nptel', icon: <BookOpen size={20} /> },
    { name: 'Hackathons', path: '/student/hackathons', icon: <Trophy size={20} /> },
    { name: 'Achievements', path: '/student/achievements', icon: <Sparkles size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
    localStorage.removeItem('campustrack_student');
    navigate('/signin');
    if (onClose) onClose();
  };

  return (
    <div className={`flex flex-col h-full bg-[#151B3B] border-r border-[#232D5C] text-[#E0E4FC] select-none transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className={`flex items-center border-b border-[#232D5C]/80 bg-[#161C3B] shrink-0 ${isCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'}`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
            <img 
              src="/jntulogo.png" 
              alt="JNTU" 
              className="h-full w-full object-contain" 
              onError={(e: any) => { e.currentTarget.style.display = 'none'; }} 
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <h1 className="font-extrabold text-white text-sm leading-tight tracking-tight truncate">CampusTrack</h1>
              <span className="text-[10px] text-[#A5B4FC] font-bold tracking-wider uppercase block truncate">
                JNTUH UCE
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5B4FC] hover:text-white hover:bg-[#1F2752] lg:hidden transition"
            title="Close Menu"
          >
            <X size={18} />
          </button>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-[#A5B4FC] hover:text-white hover:bg-[#1F2752] transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      {/* Student Profile Card */}
      <div className={`border-b border-[#232D5C]/60 bg-[#1F2752]/50 shrink-0 ${isCollapsed ? 'p-3 flex justify-center' : 'px-4 py-3 flex items-center space-x-3'}`}>
        <div 
          className="h-9 w-9 rounded-xl bg-[#3B50DF] border border-[#5B6EF5] flex items-center justify-center font-bold text-white text-xs shadow-sm shrink-0"
          title={`${student.fullName || 'Student'} (${student.rollNumber || 'STU001'})`}
        >
          {student.fullName ? student.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'S'}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate leading-tight">{student.fullName || 'Student'}</p>
            <span className="text-[10px] text-[#A5B4FC] font-mono mt-0.5 block truncate">{student.rollNumber || 'STU001'}</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-xs font-medium transition-all duration-200 group ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#3B50DF] text-white font-bold shadow-md shadow-[#3B50DF]/30'
                  : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
              }`
            }
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <span className="transition-transform group-hover:scale-110 shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </div>
            {!isCollapsed && (
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A5B4FC]" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className={`border-t border-[#232D5C]/60 bg-[#161C3B] shrink-0 ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white transition-all duration-200 group ${
            isCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2'
          }`}
        >
          <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;
