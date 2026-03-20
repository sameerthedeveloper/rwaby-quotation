import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';

export default function PublicRoute() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
