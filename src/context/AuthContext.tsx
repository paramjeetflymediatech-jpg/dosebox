'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Pharmacist' | 'Customer';
  rewardPoints?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  googleLogin: (googleId: string, email: string, name: string, avatar: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isPharmacist: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read session on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.clear();
        }
      }
      setLoading(false);

      // Listen to token refresh expiry logout event
      const handleLogoutEvent = () => {
        setUser(null);
      };
      window.addEventListener('auth_logout', handleLogoutEvent);
      return () => window.removeEventListener('auth_logout', handleLogoutEvent);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const googleLogin = async (googleId: string, email: string, name: string, avatar: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/google', { googleId, email, name, avatar });
      if (res.data?.success) {
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google login error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isPharmacist = user?.role === 'Pharmacist';
  const isCustomer = user?.role === 'Customer';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      googleLogin,
      logout,
      isAdmin,
      isPharmacist,
      isCustomer
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
