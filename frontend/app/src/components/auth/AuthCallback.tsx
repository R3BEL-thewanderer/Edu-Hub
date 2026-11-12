import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

function readAuthError(): string | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const desc =
    query.get('error_description') ||
    hash.get('error_description') ||
    query.get('error') ||
    hash.get('error');
  if (!desc) return null;
  try {
    return decodeURIComponent(desc.replace(/\+/g, ' '));
  } catch {
    return desc;
  }
}

export function AuthCallback() {
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlError = readAuthError();
    if (urlError) {
      setLoading(false);
      setError(urlError);
      return;
    }

    setLoading(true);

    const finish = async () => {
      try {
        // PKCE flow: exchange ?code= for a session if present
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const email = session.user.email || '';
          if (!email.endsWith('@tcetmumbai.in')) {
            await supabase.auth.signOut();
            setError('Only @tcetmumbai.in accounts are permitted to register.');
            return;
          }
          navigate('/', { replace: true });
        } else {
          navigate('/auth/login', { replace: true });
        }
      } catch (e: any) {
        setError(e?.message || 'Sign in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    finish();
  }, [navigate, setLoading]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-border p-8">
          <h1 className="text-xl font-semibold text-primary mb-3">Sign in failed</h1>
          <p className="text-muted-foreground text-sm mb-6 break-words">{error}</p>
          <Link
            to="/auth/login"
            replace
            className="inline-block px-5 py-2 rounded-lg bg-sage text-white hover:opacity-90"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
