import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui/Spinner';

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // redirect to appropriate dashboard
    const dashboards = { STUDENT: '/student/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }
  return children;
}
