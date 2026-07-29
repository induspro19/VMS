import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppUser, UserRole } from './UserContext';

interface AuthSession {
  token: string;
  expiresAt: string;
  loginTime: string;
  rememberMe: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  login: (user: AppUser, rememberMe?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enterprise session: 30 days for "Remember Me", 12 hours for regular session
const REMEMBER_ME_DAYS = 30;
const DEFAULT_SESSION_HOURS = 12;
// Auto-logout after inactivity: 8 hours (full shift)
const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000;

const STORAGE_KEY_USER = 'vms_auth_user';
const STORAGE_KEY_SESSION = 'vms_auth_session';
const STORAGE_KEY_LAST_ACTIVITY = 'vms_last_activity';

function getStoredSession(): { user: AppUser; session: AuthSession } | null {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);

    if (!savedUser || !savedSession) return null;

    const session: AuthSession = JSON.parse(savedSession);
    const user: AppUser = JSON.parse(savedUser);

    // Check if session has expired
    if (new Date(session.expiresAt) <= new Date()) {
      console.log('[Auth] Session expired at', session.expiresAt);
      clearStorage();
      return null;
    }

    // Check inactivity (only for non-rememberMe or if activity tracking exists)
    const lastActivity = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (lastActivity && !session.rememberMe) {
      const inactiveDuration = Date.now() - parseInt(lastActivity, 10);
      if (inactiveDuration > INACTIVITY_TIMEOUT_MS) {
        console.log('[Auth] Auto-logout: inactive for', Math.round(inactiveDuration / 3600000), 'hours');
        clearStorage();
        return null;
      }
    }

    console.log('[Auth] Restored session for', user.name, '| Role:', user.role, '| Expires:', session.expiresAt);
    return { user, session };
  } catch {
    clearStorage();
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
  // Also clear legacy sessionStorage keys
  sessionStorage.removeItem('vms_auth_session');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = getStoredSession();
    return stored ? stored.user : null;
  });

  // Track user activity for inactivity-based auto-logout
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
    };

    // Update on meaningful interactions
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    updateActivity(); // Set initial activity timestamp

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [user]);

  const login = useCallback((authenticatedUser: AppUser, rememberMe: boolean = false) => {
    const token = btoa(`${authenticatedUser.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const expirationMs = rememberMe
      ? REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000
      : DEFAULT_SESSION_HOURS * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationMs).toISOString();
    const loginTime = new Date().toISOString();

    const session: AuthSession = { token, expiresAt, loginTime, rememberMe };

    // Always use localStorage for persistent sessions
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authenticatedUser));
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());

    console.log('[Auth] Login:', authenticatedUser.name, '| Remember:', rememberMe, '| Expires:', expiresAt);
    setUser(authenticatedUser);

    // Register push subscription for employees
    if (authenticatedUser.role === 'EMPLOYEE' || authenticatedUser.role === 'ADMIN') {
      import('../lib/pushNotifications').then(({ registerPushSubscription }) => {
        registerPushSubscription(authenticatedUser.id);
      }).catch(err => console.error('Failed to load push module', err));
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logout:', user?.name);
    clearStorage();
    setUser(null);
  }, [user]);

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
