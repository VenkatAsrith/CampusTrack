import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import TopNavbar from '../components/TopNavbar';

const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('campustrack_admin_sidebar_collapsed') === 'true';
  });

  const token = localStorage.getItem('campustrack_token');
  const user = JSON.parse(localStorage.getItem('campustrack_user') || '{}');

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('campustrack_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Guard routing
  if (!token || user.role !== 'admin') {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="relative flex h-screen bg-[#F4F6FA] overflow-hidden text-[#1E1E1E] font-sans select-none">
      {/* Desktop Collapsible Sidebar (fixed) */}
      <div 
        className={`relative z-20 hidden lg:block h-full shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <AdminSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={handleToggleCollapse} 
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-[#151B3B]/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-72 max-w-[80vw] h-full bg-[#151B3B] border-r border-[#232D5C] shadow-2xl z-10 transition-transform">
            <AdminSidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <TopNavbar 
          title="CampusTrack Administration" 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F4F6FA] p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
