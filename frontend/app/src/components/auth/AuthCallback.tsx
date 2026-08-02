import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function AuthCallback() {
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    // Supabase automatically picks up the session from the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        const email = session.user.email || '';
        if (!email.endsWith('@tcetmumbai.in')) {
          // Immediately reject and sign out
          supabase.auth.signOut().then(() => {
            alert('Only @tcetmumbai.in accounts are permitted to register.');
            navigate('/auth/login', { replace: true });
          });
          return;
        }
        // Session established & valid — redirect to home
        navigate('/', { replace: true });
      } else {
        // No session — redirect to login
        navigate('/auth/login', { replace: true });
      }
    });
  }, [navigate, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
