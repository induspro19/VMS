import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'ADMIN' | 'SECURITY' | 'EMPLOYEE' | 'RECEPTION' | null;

interface User {
  id: string;
  name: string;
  role: Role;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vms_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('vms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vms_user');
    }
  }, [user]);

  const login = (role: Role) => {
    // Mock user data based on role
    const mockUsers: Record<NonNullable<Role>, User> = {
      ADMIN: { id: 'a1', name: 'System Admin', role: 'ADMIN' },
      SECURITY: { id: 's1', name: 'Gate 1 Security', role: 'SECURITY' },
      EMPLOYEE: { id: 'e1', name: 'John Doe', role: 'EMPLOYEE', department: 'Engineering' },
      RECEPTION: { id: 'r1', name: 'Front Desk', role: 'RECEPTION' }
    };
    if (role) {
      setUser(mockUsers[role]);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
