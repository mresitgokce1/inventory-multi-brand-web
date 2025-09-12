import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/auth';
import { AuthContext, type AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore auth state from localStorage
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedAccessToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAccessToken(storedAccessToken);
        setUser(parsedUser);
        authService.setAccessToken(storedAccessToken);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setAccessToken(response.access);
    
    // Persist to localStorage
    localStorage.setItem('accessToken', response.access);
    localStorage.setItem('authUser', JSON.stringify(response.user));
    
    authService.setAccessToken(response.access);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('pending_path');
    authService.clearAccessToken();
  };

  const value: AuthContextType = {
    user,
    accessToken,
    login,
    logout,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};