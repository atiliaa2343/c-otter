import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminUser {
  id: string;
  username: string;
  email: string;
}

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Demo admin accounts - in production, this should be verified against a secure backend
const DEMO_ADMINS = [
  { id: '1', username: 'admin', password: 'admin123', email: 'admin@c-otter.edu' },
  { id: '2', username: 'superadmin', password: 'super123', email: 'superadmin@c-otter.edu' },
  { id: '3', username: 'content', password: 'content123', email: 'content@c-otter.edu' },
];

const ADMIN_STORAGE_KEY = '@c_otter_admin_auth';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setAdminUser(authData.user);
        setIsAdminAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Find matching admin (demo authentication)
      const admin = DEMO_ADMINS.find(
        (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
      );

      if (admin) {
        const user: AdminUser = {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        };
        
        await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({ user }));
        setAdminUser(user);
        setIsAdminAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      setAdminUser(null);
      setIsAdminAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminUser,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
