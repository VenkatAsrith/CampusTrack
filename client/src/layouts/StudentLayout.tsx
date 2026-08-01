import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import TopNavbar from '../components/TopNavbar';

const StudentLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('campustrack_token');
  const user = JSON.parse(localStorage.getItem('campustrack_user') || '{}');

  // Route guarding
  if (!token || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Desktop Sidebar (fixed) */}
      <div className="hidden lg:block w-64 h-full shrink-0">
        <StudentSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-64 max-w-xs h-full bg-slate-900 border-r border-slate-800 transition-transform">
            <StudentSidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopNavbar 
          title="CampusTrack Workspace" 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-950/60 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
