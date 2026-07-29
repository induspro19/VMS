import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'ADMIN' | 'SECURITY' | 'EMPLOYEE' | 'RECEPTION' | 'FLEET_MANAGER' | 'HR';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string; // Base64 encoded or plain text
  role: UserRole;
  employeeId?: string;
  department?: string;
  designation?: string;
  mobile?: string;
  email?: string;
  isActive: boolean;
  isLocked: boolean;
  lastLogin?: string;
  createdAt: string;
}

export const decodePassword = (hash?: string): string => {
  if (!hash) return '';
  try {
    return atob(hash);
  } catch {
    return hash;
  }
};

export const encodePassword = (plain?: string): string => {
  if (!plain) return '';
  return btoa(plain);
};

const DEFAULT_INITIAL_USERS: AppUser[] = [
  {
    id: 'u-1000',
    name: 'System Administrator',
    username: 'admin',
    passwordHash: btoa('admin123'),
    role: 'ADMIN',
    department: 'IT',
    designation: 'Admin',
    mobile: '9999999999',
    email: 'admin@enterprise.com',
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-1001',
    name: 'Rahul Patel',
    username: 'rahul.patel',
    passwordHash: btoa('rahul123'),
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Software Engineer',
    mobile: '9876543210',
    email: 'rahul@enterprise.com',
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-1002',
    name: 'Front Desk',
    username: 'reception',
    passwordHash: btoa('reception123'),
    role: 'RECEPTION',
    department: 'Front Office',
    designation: 'Receptionist',
    mobile: '9123456789',
    email: 'reception@enterprise.com',
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-1003',
    name: 'Main Gate',
    username: 'security',
    passwordHash: btoa('security123'),
    role: 'SECURITY',
    department: 'Security',
    designation: 'Guard',
    mobile: '9000000000',
    email: 'security@enterprise.com',
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'vms_app_users';

interface UserContextType {
  users: AppUser[];
  createUser: (user: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin'>) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string, newPasswordHash: string) => void;
  lockUser: (id: string, locked: boolean) => void;
  getUserByUsername: (username: string) => AppUser | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize users from LocalStorage synchronously so data is immediately available
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
    return DEFAULT_INITIAL_USERS;
  });

  const saveToLocal = (newUsers: AppUser[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUsers));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  };

  const mapAppUserToDb = (u: Partial<AppUser>) => {
    const db: any = {};
    if (u.id !== undefined) db.id = u.id;
    if (u.name !== undefined) db.name = u.name;
    if (u.username !== undefined) db.username = u.username;
    if (u.passwordHash !== undefined) db.password_hash = u.passwordHash;
    if (u.role !== undefined) db.role = u.role;
    if (u.department !== undefined) db.department = u.department;
    if (u.designation !== undefined) db.designation = u.designation;
    if (u.mobile !== undefined) db.mobile = u.mobile;
    if (u.email !== undefined) db.email = u.email;
    if (u.isActive !== undefined) db.is_active = u.isActive;
    if (u.isLocked !== undefined) db.is_locked = u.isLocked;
    if (u.lastLogin !== undefined) db.last_login = u.lastLogin;
    if (u.createdAt !== undefined) db.created_at = u.createdAt;
    return db;
  };

  const mapDbToAppUser = (dbUser: any): AppUser => ({
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    passwordHash: dbUser.password_hash || '',
    role: dbUser.role as UserRole,
    employeeId: dbUser.employee_id || '',
    department: dbUser.department || '',
    designation: dbUser.designation || '',
    mobile: dbUser.mobile || '',
    email: dbUser.email || '',
    isActive: dbUser.is_active !== false,
    isLocked: dbUser.is_locked === true,
    lastLogin: dbUser.last_login,
    createdAt: dbUser.created_at || new Date().toISOString()
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('app_users').select('*');
      if (error) {
        console.warn('Supabase fetchUsers fallback to LocalStorage:', error.message);
      } else if (data && isMounted && data.length > 0) {
        const remoteUsers = data.map(mapDbToAppUser);
        
        // Merge remote users with local storage users (local takes precedence for recent edits)
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localUsers: AppUser[] = local ? JSON.parse(local) : [];
        
        const mergedMap = new Map<string, AppUser>();
        remoteUsers.forEach(u => mergedMap.set(u.id, u));
        localUsers.forEach(u => mergedMap.set(u.id, u)); // Local overrides if edited locally
        
        const mergedList = Array.from(mergedMap.values());
        setUsers(mergedList);
        saveToLocal(mergedList);

        // Sync local users to Supabase if any exist locally that aren't in Supabase
        for (const lu of localUsers) {
          const inRemote = remoteUsers.some(ru => ru.id === lu.id);
          if (!inRemote) {
            await supabase.from('app_users').upsert(mapAppUserToDb(lu));
          }
        }
      }
    };
    
    void fetchUsers();
    
    // Subscribe to realtime changes
    const channel = supabase.channel('public:app_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, (payload) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newUser = mapDbToAppUser(payload.new);
          setUsers(prev => {
            const next = [...prev.filter(u => u.id !== newUser.id), newUser];
            saveToLocal(next);
            return next;
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedUser = mapDbToAppUser(payload.new);
          setUsers(prev => {
            const next = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
            saveToLocal(next);
            return next;
          });
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => {
            const next = prev.filter(u => u.id !== payload.old.id);
            saveToLocal(next);
            return next;
          });
        }
      })
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const createUser = async (user: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin'>) => {
    const newUser: AppUser = {
      ...user,
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    // Save to local state and LocalStorage immediately
    setUsers(prev => {
      const updated = [...prev, newUser];
      saveToLocal(updated);
      return updated;
    });

    // Dual-write to Supabase
    try {
      const { error } = await supabase.from('app_users').insert([mapAppUserToDb(newUser)]);
      if (error) console.error('Supabase createUser error:', error);
    } catch (err) {
      console.error('Supabase createUser exception:', err);
    }
  };

  const updateUser = async (id: string, updates: Partial<AppUser>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      saveToLocal(updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('app_users').update(mapAppUserToDb(updates)).eq('id', id);
      if (error) console.error('Supabase updateUser error:', error);
    } catch (err) {
      console.error('Supabase updateUser exception:', err);
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      saveToLocal(updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) console.error('Supabase deleteUser error:', error);
    } catch (err) {
      console.error('Supabase deleteUser exception:', err);
    }
  };

  const resetPassword = async (id: string, newPasswordHash: string) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, passwordHash: newPasswordHash } : u);
      saveToLocal(updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('app_users').update({ password_hash: newPasswordHash }).eq('id', id);
      if (error) console.error('Supabase resetPassword error:', error);
    } catch (err) {
      console.error('Supabase resetPassword exception:', err);
    }
  };

  const lockUser = async (id: string, locked: boolean) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, isLocked: locked, isActive: !locked } : u);
      saveToLocal(updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('app_users').update({ is_locked: locked, is_active: !locked }).eq('id', id);
      if (error) console.error('Supabase lockUser error:', error);
    } catch (err) {
      console.error('Supabase lockUser exception:', err);
    }
  };

  const getUserByUsername = (username: string): AppUser | undefined => {
    if (!username) return undefined;
    const cleanUsername = username.trim().toLowerCase();
    
    // Check current state
    const found = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (found) return found;

    // Check LocalStorage directly if state is still initializing
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed: AppUser[] = JSON.parse(local);
        return parsed.find(u => u.username.toLowerCase() === cleanUsername);
      }
    } catch (e) {
      console.error('getUserByUsername localStorage error:', e);
    }

    return undefined;
  };

  return (
    <UserContext.Provider value={{ users, createUser, updateUser, deleteUser, resetPassword, lockUser, getUserByUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAppUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAppUsers must be used within a UserProvider');
  }
  return context;
};
