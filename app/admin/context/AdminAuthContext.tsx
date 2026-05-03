import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/constants/BackendConfig';

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

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on startup
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('admin_token');
        if (token) {
          // In a real app, you would validate the token with the backend
          // For now, we'll just set a mock user
          setUser({
            id: '1',
            email: 'admin@example.com',
            username: 'admin',
            token: token,
          });
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Call backend login API
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Store token
      await AsyncStorage.setItem('admin_token', data.token);

      // Set user
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        token: data.token,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      setIsLoading(true);
      // Call backend register API
      const response = await fetch(`${BACKEND_URL}/api/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();

      // Store token
      await AsyncStorage.setItem('admin_token', data.token);

      // Set user
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        token: data.token,
      });

      // Navigate to dashboard
      router.replace('/admin/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}