import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  updateSubscription: (subscription: User['subscription']) => void;
  // Real Supabase auth methods
  signUp: (email: string, password: string, name: string, studentId?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => void;
  updateProfile: (data: Record<string, any>) => Promise<{ error: string | null }>;
}

function mapSupabaseUser(supaUser: any): User {
  const email = supaUser.email || '';
  const isAdminOrSpecial = email === '1032250973@tcetmumbai.in';

  return {
    id: supaUser.id,
    email: email,
    displayName:
      supaUser.user_metadata?.custom_display_name ||
      supaUser.user_metadata?.full_name ||
      supaUser.user_metadata?.name ||
      email?.split('@')[0] || '',
    photoURL: supaUser.user_metadata?.avatar_url || null,
    college: supaUser.user_metadata?.college || 'TCET',
    branch: supaUser.user_metadata?.branch || '',
    division: supaUser.user_metadata?.division || '',
    rollNumber: supaUser.user_metadata?.rollNumber || '',
    studentId: supaUser.user_metadata?.studentId || '',
    admissionBatch: supaUser.user_metadata?.admissionBatch || undefined,
    departmentCode: supaUser.user_metadata?.departmentCode || '',
    phone: supaUser.user_metadata?.phone || '',
    bio: supaUser.user_metadata?.bio || '',
    studyAnalytics: supaUser.user_metadata?.studyAnalytics || {},
    subscription: {
      isPaid: isAdminOrSpecial, // Force paid access for special email
      plan: isAdminOrSpecial ? 'semester' : null,
      expiresAt: null,
    },
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  setSession: (session) => set({ session }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearUser: () => set({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  updateSubscription: (subscription) => set((state) => ({
    user: state.user ? { ...state.user, subscription } : null,
  })),

  // ──────────────────────────────────────
  // REAL SUPABASE AUTH
  // ──────────────────────────────────────

  signUp: async (email, password, name, studentId) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, studentId: studentId || '' },
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      set({
        user: mapSupabaseUser(data.user),
        session: data.session,
        isAuthenticated: !!data.session,
        isLoading: false,
      });
    }

    return { error: null };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    if (data.user) {
      set({
        user: mapSupabaseUser(data.user),
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });
    }

    return { error: null };
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateProfile: async (data: Record<string, any>) => {
    const { data: { user }, error } = await supabase.auth.updateUser({ data });
    if (!error && user) {
      set({ user: mapSupabaseUser(user) });
    }
    return { error: error?.message || null };
  },

  // Listen for auth state changes (called once on app load)
  initialize: () => {
    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = session.user.email || '';
          if (!email.endsWith('@tcetmumbai.in')) {
            supabase.auth.signOut();
            set({ isLoading: false });
            return;
          }
          set({
            user: mapSupabaseUser(session.user),
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      }).catch(() => {
        set({ isLoading: false });
      });

      // Listen for changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          if (!email.endsWith('@tcetmumbai.in')) {
            supabase.auth.signOut().then(() => {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            });
            return;
          }
          set({
            user: mapSupabaseUser(session.user),
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });
    } catch (e) {
      console.error('Auth initialization error:', e);
      set({ isLoading: false });
    }
  },
}));
