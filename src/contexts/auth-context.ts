import { createContext } from 'react';
import type { User } from '../types';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);