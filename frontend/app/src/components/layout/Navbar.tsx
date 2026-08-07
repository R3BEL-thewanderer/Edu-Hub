import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  Lock,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { sem1Subjects, sem2Subjects } from '@/data/mockData';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const subjectsDropdown = [
  {
    label: 'Semester 1 — 2025-26',
    items: sem1Subjects.filter(s => !s.isLocked).map(s => ({
      name: s.name,
      icon: s.icon,
      href: `/2025-26/sem1/${s.id}`,
    })),
  },
  {
    label: 'Semester 2 — 2025-26',
    items: sem2Subjects.filter(s => !s.isLocked).map(s => ({
      name: s.name,
      icon: s.icon,
      href: `/2025-26/sem2/${s.id}`,
    })),
  },
];

const yearDropdown = [
  { label: '2025–26', href: '/2025-26', active: true },
  { label: '2026–27 (Under Dev)', href: '/2026-27', active: false, locked: false },
  { label: '2027–28', href: '#', active: false, locked: true },
];

export function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    setUserMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white border-b-4 border-black transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 border-2 border-black rounded flex items-center justify-center bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-all">
                <GraduationCap className="w-6 h-6 text-black group-hover:animate-bounce" />
              </div>
              <span className="font-black font-display text-2xl tracking-tight text-black uppercase">EduHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
              >
                Home
              </Link>

              <Link
                to="/tutor"
                className={`text-sm font-medium transition-colors ${isActive('/tutor') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
              >
                Tutor
              </Link>

              {/* Subjects Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSubjectsOpen(true)}
                onMouseLeave={() => setSubjectsOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Subjects
                  <ChevronDown className={`w-4 h-4 transition-transform ${subjectsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {subjectsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border-2 border-black shadow-neo overflow-hidden"
                    >
                      {subjectsDropdown.map((group, idx) => (
                        <div key={idx}>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {group.label}
                          </div>
                          {group.items.map((subject) => (
                            <Link
                              key={subject.name}
                              to={subject.href}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary transition-colors group"
                              onClick={() => setSubjectsOpen(false)}
                            >
                              <span className="text-lg flex items-center">{typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-4 h-4 ml-1 mr-1 text-black group-hover:animate-bounce transition-transform" />}</span>
                              {subject.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Year Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setYearOpen(true)}
                onMouseLeave={() => setYearOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Academic Year
                  <ChevronDown className={`w-4 h-4 transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {yearOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border-2 border-black shadow-neo overflow-hidden"
                    >
                      {yearDropdown.map((year) => (
                        <Link
                          key={year.label}
                          to={year.href}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${year.locked
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'text-secondary-foreground hover:bg-secondary'
                            }`}
                          onClick={(e: React.MouseEvent) => year.locked && e.preventDefault()}
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {year.label}
                          </span>
                          {year.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Dynamic Admin/Manager Tab */}
              {isAuthenticated && (
                (() => {
                  const hasSuperAdmin = user?.roles?.includes('super_admin');
                  const hasAdmin = user?.roles?.includes('admin');
                  const hasContentManager = user?.roles?.includes('content_manager');
                  
                  if (!hasSuperAdmin && !hasAdmin && !hasContentManager) return null;

                  const displayText = hasSuperAdmin ? 'Super Admin' : hasAdmin ? 'Admin' : 'Content Manager';
                  let linkPath = '/admin';
                  if (hasContentManager && !hasAdmin && !hasSuperAdmin) linkPath = '/admin/content-manager';

                  return (
                    <Link
                      to={linkPath}
                      className={`text-sm font-black uppercase tracking-wider transition-colors px-3 py-1.5 border-4 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                        isActive('/admin') || isActive('/admin/content-manager')
                          ? 'bg-black text-white'
                          : 'bg-[#a3e635] text-black hover:bg-[#84cc16]'
                      }`}
                    >
                      {displayText}
                    </Link>
                  );
                })()
              )}
            </div>

            {/* Right Side - Auth */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-none border-4 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-8 h-8 border-2 border-black bg-orange-300 flex items-center justify-center text-black text-md font-black uppercase">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5">
                      <span className="text-sm font-black text-black uppercase tracking-widest">{user.displayName}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {user?.roles?.includes('super_admin') ? 'Super Admin' : user?.roles?.includes('admin') ? 'Admin' : user?.roles?.includes('content_manager') ? 'Content Mgr' : 'Student'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-black transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl border-2 border-black shadow-neo overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary hover:text-destructive transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
              ) : (
                <Link to="/auth/login">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-6">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile Menu - Right Side Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-[90]"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 h-full w-[75vw] max-w-[320px] bg-white z-[100] shadow-2xl overflow-y-auto"
            >
              <div className="px-5 py-4 space-y-5">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <img src="/logo.png" alt="EduHub Logo" className="h-10 w-auto" />
                  </Link>
                  <button
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <Link
                  to="/"
                  className="block font-medium text-secondary-foreground hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>

                <Link
                  to="/tutor"
                  className="block font-medium text-secondary-foreground hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tutor
                </Link>

                {/* Semester 1 */}
                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Semester 1
                  </div>
                  {sem1Subjects.filter(s => !s.isLocked).map((subject) => (
                    <Link
                      key={subject.id}
                      to={`/2025-26/sem1/${subject.id}`}
                      className="flex items-center gap-3 py-2.5 text-secondary-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg flex items-center">{typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-4 h-4 ml-1 mr-1 text-black" />}</span>
                      {subject.name}
                    </Link>
                  ))}
                </div>

                {/* Semester 2 */}
                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Semester 2
                  </div>
                  {sem2Subjects.filter(s => !s.isLocked).map((subject) => (
                    <Link
                      key={subject.id}
                      to={`/2025-26/sem2/${subject.id}`}
                      className="flex items-center gap-3 py-2.5 text-secondary-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-lg flex items-center">{typeof subject.icon === 'string' ? subject.icon : <subject.icon className="w-4 h-4 ml-1 mr-1 text-black" />}</span>
                      {subject.name}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  {isAuthenticated ? (
                    <>
                      {/* Dynamic Mobile Admin/Manager Tab */}
                      {(() => {
                        const hasSuperAdmin = user?.roles?.includes('super_admin');
                        const hasAdmin = user?.roles?.includes('admin');
                        const hasContentManager = user?.roles?.includes('content_manager');
                        
                        if (!hasSuperAdmin && !hasAdmin && !hasContentManager) return null;

                        const displayText = hasSuperAdmin ? 'Super Admin Hub' : hasAdmin ? 'Admin Dashboard' : 'Manager Dashboard';
                        let linkPath = '/admin';
                        if (hasContentManager && !hasAdmin && !hasSuperAdmin) linkPath = '/admin/content-manager';

                        return (
                          <Link
                            to={linkPath}
                            className="block font-black text-black bg-orange-300 border-2 border-black rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase tracking-wider px-3 py-2 mb-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {displayText}
                          </Link>
                        );
                      })()}
                      
                      <Link
                        to="/profile"
                        className="block font-medium text-secondary-foreground hover:text-primary py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left font-medium text-destructive py-2"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-primary text-white font-medium mt-2">
                        Login
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
