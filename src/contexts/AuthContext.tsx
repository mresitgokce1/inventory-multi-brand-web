import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/auth';
import { AuthContext, type AuthContextType, type AuthStatus } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('hydrating');

  useEffect(() => {
    // Setup logout callback for auth service
    authService.setLogoutCallback(() => {
      setUser(null);
      setAccessToken(null);
      setStatus('unauthenticated');
    });

    // Attempt rehydration on mount
    rehydrateAuth();
  }, []);

  const rehydrateAuth = async () => {
    try {
      // Try to restore from localStorage first
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('authUser');

      if (!storedAccessToken || !storedUser) {
        setStatus('unauthenticated');
        return;
      }

      let parsedUser: User;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
        setStatus('unauthenticated');
        return;
      }

      // Attempt silent refresh to validate token and get a new one
      const refreshResult = await authService.attemptSilentRefresh();
      
      if (refreshResult) {
        // Successful refresh - user is authenticated
        setAccessToken(refreshResult.access);
        setUser(parsedUser);
        setStatus('authenticated');
        
        // Update stored token and set it in auth service
        localStorage.setItem('accessToken', refreshResult.access);
        authService.setAccessToken(refreshResult.access);
      } else {
        // Refresh failed - clear state and logout
        setUser(null);
        setAccessToken(null);
        setStatus('unauthenticated');
        authService.clearAccessToken();
      }
    } catch (error) {
      console.error('Auth rehydration failed:', error);
      setUser(null);
      setAccessToken(null);
      setStatus('unauthenticated');
      authService.clearAccessToken();
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setAccessToken(response.access);
    setStatus('authenticated');
    
    // Persist to localStorage
    localStorage.setItem('accessToken', response.access);
    localStorage.setItem('authUser', JSON.stringify(response.user));
    
    // Set token in auth service (this will also schedule refresh)
    authService.setAccessToken(response.access);
  };

  const logout = async () => {
    await authService.logout();
    // State will be cleared by the logout callback
  };

  const getAccessToken = () => {
    return accessToken;
  };

  const isAuthenticated = () => {
    return status === 'authenticated';
  };

  const isHydrating = () => {
    return status === 'hydrating';
  };

  const value: AuthContextType = {
    user,
    accessToken,
    status,
    login,
    logout,
    getAccessToken,
    isAuthenticated,
    isHydrating,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};