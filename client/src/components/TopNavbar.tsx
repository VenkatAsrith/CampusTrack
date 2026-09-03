import React from 'react';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

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
    navigate('/signin');
  };

  return (
    <header className="bg-white border-b border-[#E5E9F2] px-6 py-4 flex items-center justify-between shadow-sm select-none z-10 transition-colors">
      <div className="flex items-center">
        {onMenuClick && (
          <button 
            type="button" 
            onClick={onMenuClick}
            className="p-2 -ml-2 mr-3 text-[#6C757D] hover:text-[#1E1E1E] rounded-lg lg:hidden hover:bg-[#F4F6FA] transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center space-x-2.5">
          <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1E1E] tracking-tight">{title}</h2>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#EEF2FF] text-[#3B50DF] border border-[#D9E1FC] tracking-wider uppercase">
            JNTUH University College of Engineering
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {user.role === 'admin' ? (
          <div className="hidden sm:flex items-center px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] text-xs font-bold tracking-wide shadow-sm">
            <ShieldCheck size={14} className="mr-1.5" />
            Training & Placement Officer (TPO)
          </div>
        ) : (
          <div className="hidden sm:flex items-center px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#D9E1FC] text-[#3B50DF] text-xs font-semibold">
            Student Portal
          </div>
        )}

        {/* Dark / Light Theme Toggle Button */}
        <ThemeToggle />
        
        <button
          onClick={handleLogout}
          className="text-[#6C757D] hover:text-[#1E1E1E] p-2 rounded-xl hover:bg-[#F4F6FA] transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
