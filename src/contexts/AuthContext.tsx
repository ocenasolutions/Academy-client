'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login, logout, register, verifyAdminOtp } from '@/lib/api';
import { clearSession, getDashboardPath, readSession, writeSession } from '@/lib/auth';
import { User, UserRole } from '@/types';

function getTokenExpiryMs(token: string) {
  try {
    const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedPayload));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpiringSoon(token: string, bufferMs = 60_000) {
  const expiresAt = getTokenExpiryMs(token);
  return !expiresAt || expiresAt - Date.now() <= bufferMs;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
    signIn: (email: string, password: string) => Promise<
      | { type: 'authenticated'; user: User }
      | { type: 'otp_required'; challengeId: string; expiresAt: string; email: string; debugOtp?: string }
    >;
  completeAdminSignIn: (challengeId: string, otp: string) => Promise<User>;
  signUp: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: Extract<UserRole, 'STUDENT' | 'INSTRUCTOR'>;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  dashboardPath: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    if (session.user && !isExpiringSoon(session.accessToken)) {
      // PERF: reuse the cached session user when the JWT is still healthy.
      setUser(session.user);
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((nextUser) => {
        const nextSession = readSession();
        if (nextSession) {
          writeSession({ ...nextSession, user: nextUser });
        }
        setUser(nextUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    dashboardPath: getDashboardPath(user?.role),
    async signIn(email: string, password: string) {
      const tokens = await login(email, password);
      if ('requiresOtp' in tokens) {
        return {
          type: 'otp_required' as const,
          challengeId: tokens.challengeId,
          expiresAt: tokens.expiresAt,
          email: tokens.email,
          debugOtp: tokens.debugOtp,
        };
      }

      writeSession({ ...tokens, user: null });
      const nextUser = await getCurrentUser();
      writeSession({ ...tokens, user: nextUser });
      setUser(nextUser);
      return { type: 'authenticated' as const, user: nextUser };
    },
    async completeAdminSignIn(challengeId: string, otp: string) {
      const tokens = await verifyAdminOtp(challengeId, otp);
      writeSession({ ...tokens, user: null });
      const nextUser = await getCurrentUser();
      writeSession({ ...tokens, user: nextUser });
      setUser(nextUser);
      return nextUser;
    },
    async signUp(input) {
      const tokens = await register(input);
      writeSession({ ...tokens, user: null });
      const nextUser = await getCurrentUser();
      writeSession({ ...tokens, user: nextUser });
      setUser(nextUser);
      return nextUser;
    },
    async signOut() {
      try {
        await logout();
      } catch {
        // Ignore remote logout errors and clear local session anyway.
      }
      clearSession();
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('theme');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
    },
    async refreshProfile() {
      try {
        const nextUser = await getCurrentUser();
        const session = readSession();
        if (session) {
          writeSession({ ...session, user: nextUser });
        }
        setUser(nextUser);
        return nextUser;
      } catch {
        clearSession();
        setUser(null);
        return null;
      }
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
