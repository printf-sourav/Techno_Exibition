import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  loginApi,
  registerApi,
  saveAuthSession,
  clearAuthSession,
  getStoredToken,
  type BackendUser,
} from '../lib/api';

export type UserRole = 'retailer' | 'hospital' | 'ngo' | 'waste' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  verificationStatus: VerificationStatus;
  organizationName: string;
  address?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const toUser = (backendUser: BackendUser): User => ({
    id: backendUser._id || backendUser.id || '',
    email: backendUser.email,
    role: backendUser.role,
    name: backendUser.name || backendUser.organizationName || 'User',
    verificationStatus: (backendUser.verificationStatus || 'pending') as VerificationStatus,
    organizationName: backendUser.organizationName || backendUser.name || '',
    address: backendUser.address,
    phone: backendUser.phone,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('medisync_user');
    const savedToken = getStoredToken();

    if (savedUser) {
      setUser(toUser(JSON.parse(savedUser)));
    }

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await loginApi({ email, password });
      const mappedUser = toUser(response.user);

      if (mappedUser.role !== role) {
        return false;
      }

      if (mappedUser.role !== 'admin' && mappedUser.verificationStatus !== 'verified') {
        return false;
      }

      setUser(mappedUser);
      setToken(response.token);
      saveAuthSession(response.token, response.user);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (userData: any): Promise<boolean> => {
    try {
      await registerApi(userData);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}