import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthTokens } from '../types';
import { authService } from '../services/auth';
import { AuthContext, type AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore auth state from localStorage
    const storedTokens = localStorage.getItem('auth_tokens');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedTokens && storedUser) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);
        setTokens(parsedTokens);
        setUser(parsedUser);
        authService.setAuthTokens(parsedTokens);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setTokens(response.tokens);
    
    // Persist to localStorage
    localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    
    authService.setAuthTokens(response.tokens);
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('pending_path');
    authService.clearAuthTokens();
  };

  const value: AuthContextType = {
    user,
    tokens,
    login,
    logout,
    isAuthenticated: !!user && !!tokens,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};