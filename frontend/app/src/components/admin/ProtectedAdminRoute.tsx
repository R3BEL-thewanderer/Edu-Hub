import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export function ProtectedAdminRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex bg-slate-950 items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Ensure they are logged in and have the admin role (super_admins also have this)
  const isAdmin = user?.roles?.includes('admin');

  if (!user || !isAdmin) {
    // If not matching, bounce them Home
    return <Navigate to="/" replace />;
  }

  // If match, render the child Admin routes
  return <Outlet />;
}
