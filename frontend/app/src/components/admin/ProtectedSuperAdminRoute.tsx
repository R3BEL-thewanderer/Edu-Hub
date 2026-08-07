import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export function ProtectedSuperAdminRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex bg-slate-950 items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Ensure they are logged in and have the super_admin role specifically
  const isSuperAdmin = user?.roles?.includes('super_admin');

  if (!user || !isSuperAdmin) {
    // If not matching, bounce them to the regular Admin Dashboard
    return <Navigate to="/admin" replace />;
  }

  // If match, render the child Super Admin routes
  return <Outlet />;
}
