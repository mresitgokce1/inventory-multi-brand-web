// src/contexts/AuthContext.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './auth-context';
import { authService } from '../services/auth';

interface Props { children: ReactNode }

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    authService.setLogoutCallback(() => {
      setUser(null);
      localStorage.removeItem('authUser');
    });

    const boot = async () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        const storedAccess = localStorage.getItem('accessToken');

        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        }
        if (storedAccess) {
          authService.setAccessToken(storedAccess); // header + auto refresh
        }

        const refreshed = await authService.attemptSilentRefresh();
        if (refreshed?.access) authService.setAccessToken(refreshed.access);
      } finally {
        setHydrating(false);
      }
    };

    boot();
  }, []);

  const value = useMemo(() => ({ user, setUser, hydrating }), [user, hydrating]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
