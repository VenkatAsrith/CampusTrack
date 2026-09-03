import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle2, 
  Megaphone, 
  Briefcase, 
  FileSpreadsheet, 
  History, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import api from '../services/api';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const BRANCHES = [
  'CSE',
  'CSE SF',
  'CSC',
  'CSM',
  'ECE',
  'ME',
  'EEE',
  'Civil'
];

const YEARS = [
  { year: 1, label: '1st Year' },
  { year: 2, label: '2nd Year' },
  { year: 3, label: '3rd Year' },
  { year: 4, label: '4th Year' },
];

const AdminSidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [studentsOpen, setStudentsOpen] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(() => {
    const params = new URLSearchParams(location.search);
    const y = params.get('year');
    return y ? parseInt(y, 10) : null;
  });

  const [hierarchyCounts, setHierarchyCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get('/admin/hierarchy')
      .then((res) => {
        if (res.data?.data) {
          const map: Record<string, number> = {};
          res.data.data.forEach((yItem: any) => {
            yItem.branches?.forEach((bItem: any) => {
              map[`${yItem.year}_${bItem.branch}`] = bItem.count;
            });
          });
          setHierarchyCounts(map);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('campustrack_token');
    localStorage.removeItem('campustrack_user');
    localStorage.removeItem('campustrack_student');
    navigate('/signin');
    if (onClose) onClose();
  };

  const isCurrentPath = (path: string) => {
    return location.pathname + location.search === path;
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
                JNTUH UCE SULTANPUR
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

      {/* TPO Profile Card */}
      <div className={`border-b border-[#232D5C]/60 bg-[#1F2752]/50 shrink-0 ${isCollapsed ? 'p-3 flex justify-center' : 'px-4 py-3 flex items-center space-x-3'}`}>
        <div 
          className="p-2 rounded-xl bg-[#3B50DF] text-white shrink-0 shadow-sm shadow-[#3B50DF]/30"
          title="Training & Placement Officer (admin@college.edu)"
        >
          <ShieldCheck size={18} />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate leading-tight">Training & Placement Officer</p>
            <span className="text-[10px] text-[#E0E4FC]/80 block font-mono truncate mt-0.5">admin@college.edu</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {/* TPO Dashboard */}
        <NavLink
          to="/admin/dashboard"
          onClick={onClose}
          title={isCollapsed ? 'TPO Dashboard' : undefined}
          className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
          } ${
            location.pathname === '/admin/dashboard'
              ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
              : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <LayoutDashboard size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">TPO Dashboard</span>}
          </div>
        </NavLink>

        {/* Collapsed view for Student Directory */}
        {isCollapsed ? (
          <NavLink
            to="/admin/directory"
            onClick={onClose}
            title="Student Directory & Years"
            className={`flex items-center justify-center p-2.5 rounded-xl text-[13px] font-medium transition-all ${
              location.pathname.startsWith('/admin/directory')
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <Users size={18} className="shrink-0" />
          </NavLink>
        ) : (
          /* Expanded Section: Academic Hierarchy (1st to 4th Year) */
          <div className="pt-2">
            <div 
              onClick={() => setStudentsOpen(!studentsOpen)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold text-[#E0E4FC] hover:bg-[#1F2752] cursor-pointer transition"
            >
              <div className="flex items-center space-x-3">
                <Users size={18} className="text-[#3B50DF]" />
                <span>Students</span>
              </div>
              {studentsOpen ? <ChevronDown size={14} className="text-[#E0E4FC]/60" /> : <ChevronRight size={14} className="text-[#E0E4FC]/60" />}
            </div>

            {studentsOpen && (
              <div className="pl-3 pr-1 py-1 space-y-1">
                <NavLink
                  to="/admin/directory"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrentPath('/admin/directory')
                      ? 'bg-[#3B50DF] text-white font-semibold shadow-sm'
                      : 'text-[#E0E4FC]/80 hover:bg-[#1F2752] hover:text-white'
                  }`}
                >
                  <span>All Students</span>
                </NavLink>

                {YEARS.map(({ year, label }) => {
                  const isExpanded = expandedYear === year;
                  const isYearActive = location.pathname === '/admin/directory' && location.search.includes(`year=${year}`);

                  return (
                    <div key={year} className="space-y-0.5">
                      <div
                        onClick={() => setExpandedYear(isExpanded ? null : year)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          isYearActive
                            ? 'bg-[#1F2752] text-white font-semibold'
                            : 'text-[#E0E4FC]/90 hover:bg-[#1F2752]/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isYearActive ? 'bg-[#3B50DF]' : 'bg-[#E0E4FC]/40'}`} />
                          <span>{label}</span>
                        </div>
                        {isExpanded ? <ChevronDown size={12} className="text-[#E0E4FC]/50" /> : <ChevronRight size={12} className="text-[#E0E4FC]/50" />}
                      </div>

                      {isExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#232D5C]/60 ml-3">
                          <NavLink
                            to={`/admin/directory?year=${year}`}
                            onClick={onClose}
                            className={`flex items-center justify-between px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                              isCurrentPath(`/admin/directory?year=${year}`)
                                ? 'bg-[#3B50DF] text-white font-bold'
                                : 'text-[#E0E4FC]/70 hover:bg-[#1F2752] hover:text-white'
                            }`}
                          >
                            <span>All {label}</span>
                          </NavLink>

                          {BRANCHES.map((b) => {
                            const count = hierarchyCounts[`${year}_${b}`] || 0;
                            const path = `/admin/directory?year=${year}&branch=${encodeURIComponent(b)}`;
                            const active = isCurrentPath(path);

                            return (
                              <NavLink
                                key={b}
                                to={path}
                                onClick={onClose}
                                className={`flex items-center justify-between px-2.5 py-1 rounded text-[11px] transition-all ${
                                  active
                                    ? 'bg-[#3B50DF] text-white font-bold'
                                    : 'text-[#E0E4FC]/70 hover:bg-[#1F2752] hover:text-white'
                                }`}
                              >
                                <span className="truncate">{b}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  active ? 'bg-white/20 text-white' : 'bg-[#1F2752] text-[#E0E4FC]/60'
                                }`}>
                                  {count}
                                </span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Academic Management -> Batches & Semester Promotion */}
        <div className="pt-2">
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold text-[#E0E4FC]/40 px-3 tracking-wider">
              Academic Management
            </span>
          )}
          <NavLink
            to="/admin/batches"
            onClick={onClose}
            title={isCollapsed ? 'Batch Management' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all mt-1 ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              location.pathname === '/admin/batches'
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Layers size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Batch Management</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/semester-promotion"
            onClick={onClose}
            title={isCollapsed ? 'Semester Promotion' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all mt-0.5 ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              location.pathname === '/admin/semester-promotion'
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <GraduationCap size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Semester Promotion</span>}
            </div>
          </NavLink>
        </div>

        {/* Placement & Audit */}
        <div className="pt-2">
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold text-[#E0E4FC]/40 px-3 tracking-wider">
              Placement & Audit
            </span>
          )}
          <NavLink
            to="/admin/directory?tab=pending"
            onClick={onClose}
            title={isCollapsed ? 'Verification Queue' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all mt-1 ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              isCurrentPath('/admin/directory?tab=pending')
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <CheckCircle2 size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Verification Queue</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/announcements?type=Placement"
            onClick={onClose}
            title={isCollapsed ? 'Placement Drives' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              isCurrentPath('/admin/announcements?type=Placement')
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Briefcase size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Placement Drives</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/announcements"
            onClick={onClose}
            title={isCollapsed ? 'Announcements Feed' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              location.pathname === '/admin/announcements' && !location.search
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Megaphone size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Announcements Feed</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/directory?tab=export"
            onClick={onClose}
            title={isCollapsed ? 'Excel & Sheets Sync' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              isCurrentPath('/admin/directory?tab=export')
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <FileSpreadsheet size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Excel & Sheets Sync</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/audit-logs"
            onClick={onClose}
            title={isCollapsed ? 'Audit Logs' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              location.pathname === '/admin/audit-logs'
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <History size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Audit Logs</span>}
            </div>
          </NavLink>

          <NavLink
            to="/admin/settings"
            onClick={onClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              location.pathname === '/admin/settings'
                ? 'bg-[#3B50DF] text-white font-semibold shadow-md shadow-[#3B50DF]/30'
                : 'text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Settings size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Settings</span>}
            </div>
          </NavLink>
        </div>
      </nav>

      {/* Logout Footer */}
      <div className={`border-t border-[#232D5C]/80 bg-[#161C3B] shrink-0 ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={`w-full flex items-center rounded-xl text-[13px] font-medium text-[#E0E4FC] hover:bg-[#1F2752] hover:text-white transition-all duration-200 group ${
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

export default AdminSidebar;
