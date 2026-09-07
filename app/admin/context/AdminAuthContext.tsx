import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  token: string;
}

interface AdminAuthContextProps {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextProps | undefined>(undefined);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Loads the signed-in person's profile and returns it only if they're an
// admin — this is what actually keeps non-admins out of the dashboard,
// since it's backed by the same role check as the database's own RLS rules.
async function loadAdminProfile(userId: string, accessToken: string): Promise<AdminUser | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, username, role')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username || profile.email,
    token: accessToken,
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(await loadAdminProfile(session.user.id, session.access_token));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        return;
      }
      setUser(await loadAdminProfile(session.user.id, session.access_token));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('Login failed');

      const adminUser = await loadAdminProfile(data.session.user.id, data.session.access_token);
      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error("This account doesn't have admin access.");
      }
      setUser(adminUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      // Every new account starts as a regular user (see the
      // handle_new_user trigger in db/schema_accounts.sql). There's no
      // self-serve way to become an admin — an existing admin has to
      // promote the account by hand before it can log in here.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// Export empty component to satisfy expo-router requirement for default export
export default () => null;
