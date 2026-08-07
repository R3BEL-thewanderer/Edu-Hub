import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { SemesterPage } from '@/pages/SemesterPage';
import { SubjectPage } from '@/pages/SubjectPage';
import { YearPage } from '@/pages/YearPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AuthPage } from '@/pages/AuthPage';
import { ChatBotPage } from '@/pages/ChatBotPage';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsPage } from '@/pages/TermsPage';
import { RefundPolicy } from '@/pages/RefundPolicy';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { TutorPage } from '@/pages/TutorPage';
import { MockTestsPage } from '@/pages/MockTestsPage';
import { ActivityFeedPage } from '@/pages/ActivityFeedPage';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { useAuthStore } from '@/store/authStore';
import { GoogleAdsenseProvider } from '@/components/seo/GoogleAdsenseProvider';

// === ADMIN PANEL ===
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { ProtectedSuperAdminRoute } from '@/components/admin/ProtectedSuperAdminRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';
import { AdminHealthPage } from '@/pages/admin/AdminHealthPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

// newly created ones
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage';
import { AdminAdminsPage } from '@/pages/admin/AdminAdminsPage';
import { AdminContentManagersPage } from '@/pages/admin/AdminContentManagersPage';
import { AdminMaterialsPage } from '@/pages/admin/AdminMaterialsPage';
import { AdminMockTestsPage } from '@/pages/admin/AdminMockTestsPage';
import { AdminAIAccessPage } from '@/pages/admin/AdminAIAccessPage';
import { AdminRolesPage } from '@/pages/admin/AdminRolesPage';

function App() {
  const { initialize } = useAuthStore();

  // Initialize Supabase auth listener on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <GoogleAdsenseProvider />
      <ScrollToTop />
      <Routes>
        {/* === ADMIN PANEL (ADMIN & SUPER_ADMIN) === */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="content-manager" element={<AdminContentManagersPage />} />
            <Route path="materials" element={<AdminMaterialsPage />} />
            <Route path="tests" element={<AdminMockTestsPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="health" element={<AdminHealthPage />} />

            {/* SUPER ADMIN RESTRICTED */}
            <Route element={<ProtectedSuperAdminRoute />}>
              <Route path="admins" element={<AdminAdminsPage />} />
              <Route path="ai-access" element={<AdminAIAccessPage />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Profile Route */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Auth Routes */}
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/signup" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Chat Bot */}
        <Route path="/chat" element={<ChatBotPage />} />

        {/* Mock Tests Engine */}
        <Route path="/tests" element={<MockTestsPage />} />

        {/* Activity Feed */}
        <Route path="/activity" element={<ActivityFeedPage />} />

        {/* ChatGPT Style Tutor Page */}
        <Route path="/tutor" element={<TutorPage />} />

        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* Info Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Year Routes */}
        <Route path="/:year" element={<YearPage />} />

        {/* Semester Routes */}
        <Route path="/:year/:semester" element={<SemesterPage />} />

        {/* Subject Routes */}
        <Route path="/:year/:semester/:subject" element={<SubjectPage />} />

        {/* 404 - Redirect to Home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
