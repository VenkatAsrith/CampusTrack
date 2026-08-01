import React from 'react';
import { Menu, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopNavbarProps {
  title: string;
  onMenuClick?: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campustrack_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
    localStorage.removeItem('campustrack_student');
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md select-none">
      <div className="flex items-center">
        {onMenuClick && (
          <button 
            type="button" 
            onClick={onMenuClick}
            className="p-2 -ml-2 mr-3 text-slate-400 hover:text-white rounded-lg lg:hidden hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        {user.role === 'admin' && (
          <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-900/60 text-indigo-400 text-xs font-semibold">
            <ShieldAlert size={14} className="mr-1.5" />
            Institutional Admin
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="text-slate-450 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
