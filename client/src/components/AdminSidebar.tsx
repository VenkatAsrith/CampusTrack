import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Student Directory', path: '/admin/directory', icon: <Users size={18} /> },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: <History size={18} /> },
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
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
          CT
        </div>
        <div className="ml-3">
          <h1 className="font-extrabold text-white text-base leading-none tracking-tight">CampusTrack</h1>
          <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mt-1 block">ADMIN CENTER</span>
        </div>
      </div>

      {/* Admin Brief Profile */}
      <div className="px-5 py-4 border-b border-slate-800/50 flex items-center">
        <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-indigo-400">
          <ShieldCheck size={18} />
        </div>
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-semibold text-white truncate leading-none">College Admin</p>
          <span className="text-xs text-slate-500 mt-1 block">admin@college.edu</span>
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-semibold'
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

export default AdminSidebar;
