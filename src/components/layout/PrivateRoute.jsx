import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';

export default function PrivateRoute({ adminOnly = false }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
