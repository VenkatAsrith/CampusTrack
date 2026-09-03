import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import SignIn from './pages/SignIn';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentAnnouncements from './pages/StudentAnnouncements';
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
import TpoAnnouncements from './pages/TpoAnnouncements';
import AuditLogs from './pages/AuditLogs';
import TpoSettings from './pages/TpoSettings';
import SemesterPromotion from './pages/SemesterPromotion';
import BatchManagement from './pages/BatchManagement';

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
          <Route path="/" element={<Navigate to="/signin" replace />} />
          
          {/* Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />

          {/* Student Portal Protected Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="announcements" element={<StudentAnnouncements />} />
            <Route path="coding" element={<CodingProfiles />} />
            <Route path="projects" element={<Projects />} />
            <Route path="internships" element={<Internships />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="nptel" element={<NPTELRecords />} />
            <Route path="hackathons" element={<Hackathons />} />
            <Route path="achievements" element={<Achievements />} />
          </Route>

          {/* TPO Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="directory" element={<AdminDirectory />} />
            <Route path="batches" element={<BatchManagement />} />
            <Route path="semester-promotion" element={<SemesterPromotion />} />
            <Route path="announcements" element={<TpoAnnouncements />} />
            <Route path="students/:id" element={<AdminStudentView />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<TpoSettings />} />
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
