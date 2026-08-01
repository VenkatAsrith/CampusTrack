import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import CodingProfiles from './pages/CodingProfiles';
import Projects from './pages/Projects';
import Internships from './pages/Internships';
import Certifications from './pages/Certifications';
import NPTELRecords from './pages/NPTELRecords';
import Hackathons from './pages/Hackathons';
import Achievements from './pages/Achievements';

import AdminDashboard from './pages/AdminDashboard';
import AdminDirectory from './pages/AdminDirectory';
import AdminStudentView from './pages/AdminStudentView';
import AuditLogs from './pages/AuditLogs';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Student Portal Protected Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="coding" element={<CodingProfiles />} />
            <Route path="projects" element={<Projects />} />
            <Route path="internships" element={<Internships />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="nptel" element={<NPTELRecords />} />
            <Route path="hackathons" element={<Hackathons />} />
            <Route path="achievements" element={<Achievements />} />
          </Route>

          {/* Admin Coordinator Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="directory" element={<AdminDirectory />} />
            <Route path="students/:id" element={<AdminStudentView />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
