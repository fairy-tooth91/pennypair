import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { supabase, fetchProfile, signIn, signUp, signOut } from '../services/supabase';
import i18n from '../i18n';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  async function loadProfile(userId: string) {
    const profile = await fetchProfile(userId);
    if (profile) {
      i18n.changeLanguage(profile.preferredLanguage);
    }
    setState(prev => ({ ...prev, profile }));
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null, loading: !!session?.user }));
      if (session?.user) {
        loadProfile(session.user.id).finally(() =>
          setState(prev => ({ ...prev, loading: false }))
        );
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, profile: null }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) throw error;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { error } = await signUp(email, password, displayName);
    if (error) throw error;
  };

  const logout = async () => {
    await signOut();
    setState({ user: null, profile: null, session: null, loading: false });
    i18n.changeLanguage('en');
  };

  const refreshProfile = async () => {
    if (state.user) await loadProfile(state.user.id);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
