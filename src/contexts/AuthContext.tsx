import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext} from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  
  return (
    
    <>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </>
  )
};