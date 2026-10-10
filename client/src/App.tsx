import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Resilience & Error Components
import ErrorBoundary from './components/ErrorBoundary';
import OfflineState from './components/OfflineState';
import LatencyIndicator from './components/LatencyIndicator';
import TimeoutState from './components/TimeoutState';
import ServerError from './components/ServerError';
import ServiceUnavailable from './components/ServiceUnavailable';
import RateLimitState from './components/RateLimitState';
import UnauthorizedState from './components/UnauthorizedState';
import ForbiddenState from './components/ForbiddenState';

// Layouts (keep statically imported for fast frame rendering)
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Lazy Loaded Pages for Code Splitting & Performance (Section 26 & 27)
const SignIn = lazy(() => import('./pages/SignIn'));
const TpoSignIn = lazy(() => import('./pages/TpoSignIn'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentAnnouncements = lazy(() => import('./pages/StudentAnnouncements'));
const CodingProfiles = lazy(() => import('./pages/CodingProfiles'));
const Projects = lazy(() => import('./pages/Projects'));
const Internships = lazy(() => import('./pages/Internships'));
const Certifications = lazy(() => import('./pages/Certifications'));
const NPTELRecords = lazy(() => import('./pages/NPTELRecords'));
const Hackathons = lazy(() => import('./pages/Hackathons'));
const Achievements = lazy(() => import('./pages/Achievements'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDirectory = lazy(() => import('./pages/AdminDirectory'));
const AdminStudentView = lazy(() => import('./pages/AdminStudentView'));
const TpoAnnouncements = lazy(() => import('./pages/TpoAnnouncements'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const TpoSettings = lazy(() => import('./pages/TpoSettings'));
const SemesterPromotion = lazy(() => import('./pages/SemesterPromotion'));
const BatchManagement = lazy(() => import('./pages/BatchManagement'));
const ConnectionLostPage = lazy(() => import('./pages/ConnectionLostPage'));
const HighTrafficPage = lazy(() => import('./pages/HighTrafficPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Create React Query client with conservative retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Institutional Suspense Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
    <div className="h-9 w-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading module...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OfflineState />
          <LatencyIndicator />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/signin" replace />} />

              {/* Auth Routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/tpo" element={<TpoSignIn />} />
              <Route path="/admin/login" element={<TpoSignIn />} />

              {/* Dedicated Error States Preview & Deep Links */}
              <Route path="/error/timeout" element={<TimeoutState isFullPage />} />
              <Route path="/error/500" element={<ServerError isFullPage />} />
              <Route path="/error/503" element={<ServiceUnavailable isFullPage />} />
              <Route path="/error/429" element={<RateLimitState isFullPage />} />
              <Route path="/error/401" element={<UnauthorizedState isFullPage />} />
              <Route path="/error/403" element={<ForbiddenState isFullPage />} />
              <Route path="/offline" element={<ConnectionLostPage />} />
              <Route path="/connection-lost" element={<ConnectionLostPage />} />
              <Route path="/error/offline" element={<ConnectionLostPage />} />
              <Route path="/overload" element={<HighTrafficPage />} />
              <Route path="/high-traffic" element={<HighTrafficPage />} />
              <Route path="/404" element={<NotFound />} />

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

              {/* Catch All 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
