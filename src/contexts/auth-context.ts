import { createContext } from 'react';
import type { User } from '../types';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  isAuthenticated: () => boolean;
  isHydrating: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);