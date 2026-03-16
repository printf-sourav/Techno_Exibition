import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'retailer' | 'hospital' | 'ngo' | 'waste' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  verificationStatus: VerificationStatus;
  organizationName: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('medisync_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Mock login - in production this would call an API
    // Check if user exists in mock database
    const mockUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    const foundUser = mockUsers.find(
      (u: any) => u.email === email && u.password === password && u.role === role
    );

    if (foundUser) {
      // Admin role bypasses verification checks
      if (foundUser.role !== 'admin') {
        // Check verification status for non-admin users
        if (foundUser.verificationStatus === 'pending') {
          // Don't allow login if pending verification
          return false;
        }

        if (foundUser.verificationStatus === 'rejected') {
          // Don't allow login if rejected
          return false;
        }
      }

      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
        verificationStatus: foundUser.verificationStatus,
        organizationName: foundUser.organizationName,
      };
      setUser(userData);
      localStorage.setItem('medisync_user', JSON.stringify(userData));
      return true;
    }

    // Demo account for quick access
    if (email === 'demo@retailer.com' && password === 'demo' && role === 'retailer') {
      const demoUser: User = {
        id: 'demo-retailer',
        email: 'demo@retailer.com',
        role: 'retailer',
        name: 'Demo Retailer',
        verificationStatus: 'verified',
        organizationName: 'Demo Pharmacy',
      };
      setUser(demoUser);
      localStorage.setItem('medisync_user', JSON.stringify(demoUser));
      return true;
    }

    if (email === 'admin@medisync.com' && password === 'admin123' && role === 'admin') {
      const adminUser: User = {
        id: 'admin-1',
        email: 'admin@medisync.com',
        role: 'admin',
        name: 'Admin',
        verificationStatus: 'verified',
        organizationName: 'Medisync Platform',
      };
      setUser(adminUser);
      localStorage.setItem('medisync_user', JSON.stringify(adminUser));
      return true;
    }

    return false;
  };

  const signup = async (userData: any): Promise<boolean> => {
    // Mock signup - in production this would call an API
    const mockUsers = JSON.parse(localStorage.getItem('medisync_users') || '[]');
    
    // Check if email already exists
    if (mockUsers.find((u: any) => u.email === userData.email)) {
      return false;
    }

    // Admin role should not be created through signup - bypass this check
    // Set verification status based on role
    const verificationStatus: VerificationStatus = userData.role === 'admin' ? 'verified' : 'pending';

    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      verificationStatus,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    localStorage.setItem('medisync_users', JSON.stringify(mockUsers));

    // DO NOT auto-login after signup - user must wait for admin approval (except admin)
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medisync_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
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