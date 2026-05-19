import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';

// ── Auth pages (small, needed immediately — kept eager) ──────────────────────
import LoginPage           from './pages/auth/LoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from './pages/auth/ResetPasswordPage';
import ChangePasswordPage  from './pages/auth/ChangePasswordPage';

// ── Lazy-loaded pages (split into separate JS chunks by Vite) ─────────────────
const JobListingsPage   = lazy(() => import('./pages/jobs/JobListingsPage'));
const StudentDashboard  = lazy(() => import('./pages/student/StudentDashboard'));
const MyApplicationsPage= lazy(() => import('./pages/student/MyApplicationsPage'));
const ResumeUploadPage  = lazy(() => import('./pages/student/ResumeUploadPage'));
const CompanyDashboard  = lazy(() => import('./pages/company/CompanyDashboard'));
const ApplicantsPage    = lazy(() => import('./pages/company/ApplicantsPage'));
const AnalyticsPage     = lazy(() => import('./pages/company/AnalyticsPage'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const ProfilePage       = lazy(() => import('./pages/profile/ProfilePage'));

// ── Page loading spinner ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      {user && <Chatbot userRole={user.role} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', fontSize: '14px' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />
          <Route path="/"                 element={<Navigate to="/login" replace />} />

          <Route path="/jobs" element={
            <PrivateRoute><Layout><JobListingsPage /></Layout></PrivateRoute>
          } />

          <Route path="/student/dashboard" element={
            <PrivateRoute role="STUDENT"><Layout><StudentDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/student/applications" element={
            <PrivateRoute role="STUDENT"><Layout><MyApplicationsPage /></Layout></PrivateRoute>
          } />
          <Route path="/student/resume" element={
            <PrivateRoute role="STUDENT"><Layout><ResumeUploadPage /></Layout></PrivateRoute>
          } />

          <Route path="/company/dashboard" element={
            <PrivateRoute role="COMPANY"><Layout><CompanyDashboard /></Layout></PrivateRoute>
          } />
          <Route path="/company/applicants/:jobId" element={
            <PrivateRoute role="COMPANY"><Layout><ApplicantsPage /></Layout></PrivateRoute>
          } />
          <Route path="/company/analytics" element={
            <PrivateRoute role="COMPANY"><Layout><AnalyticsPage /></Layout></PrivateRoute>
          } />

          <Route path="/admin/dashboard" element={
            <PrivateRoute role="ADMIN"><Layout><AdminDashboard /></Layout></PrivateRoute>
          } />

          <Route path="/change-password" element={
            <PrivateRoute><Layout><ChangePasswordPage /></Layout></PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>
          } />

          <Route path="*" element={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-600">404</p>
                <p className="text-slate-500 mt-2 text-sm">Page not found</p>
                <a href="/login" className="text-blue-600 mt-4 inline-block text-sm hover:underline">Go to Login</a>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
