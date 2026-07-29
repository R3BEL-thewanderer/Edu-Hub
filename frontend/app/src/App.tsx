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
import { AuthCallback } from '@/components/auth/AuthCallback';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { useAuthStore } from '@/store/authStore';

function App() {
  const { initialize } = useAuthStore();

  // Block screenshots & screen recording site-wide
  // useScreenProtection();

  // Initialize Supabase auth listener on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Profile Route */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Auth Routes */}
        <Route path="/auth/login" element={<AuthPage />} />
        <Route path="/auth/signup" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Chat Bot */}
        <Route path="/chat" element={<ChatBotPage />} />

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
