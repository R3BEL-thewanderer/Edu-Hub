import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, ShieldAlert, BookOpen, FileText, Sparkles, Bell, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/layout/Navbar';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { name: 'Students', href: '/admin/students', icon: Users, roles: ['admin', 'super_admin'] },
  { name: 'Content Managers', href: '/admin/content-manager', icon: UserCog, roles: ['admin', 'super_admin'] },
  { name: 'System Admins', href: '/admin/admins', icon: ShieldAlert, roles: ['super_admin'] },
  { name: 'Study Materials', href: '/admin/materials', icon: BookOpen, roles: ['admin', 'super_admin'] },
  { name: 'Mock Tests', href: '/admin/tests', icon: FileText, roles: ['admin', 'super_admin'] },
  { name: 'AI Tutor Access', href: '/admin/ai-access', icon: Sparkles, roles: ['super_admin'] },
  { name: 'Announcements', href: '/admin/announcements', icon: Bell, roles: ['admin', 'super_admin'] },
  { name: 'System Health', href: '/admin/health', icon: ShieldAlert, roles: ['admin', 'super_admin'] },
  { name: 'Roles & Permissions', href: '/admin/roles', icon: Shield, roles: ['super_admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
];

export function AdminLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];

  // Filter links based on if the user has ANY of the required roles
  const availableLinks = sidebarLinks.filter(item => 
    item.roles.some(requiredRole => userRoles.includes(requiredRole))
  );

  return (
    <div className="h-screen overflow-hidden text-black font-sans flex flex-col text-base selection:bg-primary selection:text-white bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r-4 border-black hidden lg:flex flex-col z-0">
          <div className="p-6 border-b-4 border-black bg-white">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 border-2 border-black rounded flex items-center justify-center bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-transform">
                <ShieldAlert className="w-5 h-5 text-black group-hover:animate-bounce" />
              </div>
              <span className="text-2xl font-black uppercase tracking-tight">
                Admin Hub
              </span>
            </Link>
          </div>
          <div className="flex-1 py-6 px-4 space-y-3 overflow-y-auto custom-scrollbar shadow-[4px_0_0_0_rgba(0,0,0,1)]">
            {availableLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-none border-2 transition-all duration-200 font-bold",
                    isActive 
                      ? "bg-primary text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" 
                      : "bg-white text-black border-transparent hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-black")} strokeWidth={isActive ? 3 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t-4 border-black bg-primary">
            <div className="text-xs font-black uppercase text-white tracking-widest text-center">
              {userRoles.includes('super_admin') ? 'Super Admin Access Enforced' : 'Admin Operations Center'}
            </div>
          </div>
        </nav>

        {/* Main Content Pane */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Header (Admin Section Specific) */}
          <header className="lg:hidden flex items-center h-16 shrink-0 px-4 border-b-4 border-black bg-white">
            <ShieldAlert className="w-6 h-6 text-black mr-3" strokeWidth={2.5} />
            <span className="font-black text-lg uppercase tracking-tight">Admin Hub</span>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="max-w-6xl mx-auto pb-10">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
