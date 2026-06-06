import { User, UserRole } from '@/types';

const STORAGE_KEY = 'academy_session';
const ADMIN_OTP_KEY = 'academy_admin_otp';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user?: User | null;
}

export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: StoredSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function updateStoredUser(user: User | null) {
  const session = readSession();
  if (!session) {
    return;
  }

  writeSession({ ...session, user });
}

export function getDashboardPath(role?: UserRole) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'INSTRUCTOR':
      return '/dashboard/instructor';
    case 'STUDENT':
    default:
      return '/dashboard/student';
  }
}

export interface StoredAdminOtpChallenge {
  challengeId: string;
  email: string;
  expiresAt: string;
  debugOtp?: string;
}

export function readAdminOtpChallenge(): StoredAdminOtpChallenge | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(ADMIN_OTP_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAdminOtpChallenge;
  } catch {
    window.sessionStorage.removeItem(ADMIN_OTP_KEY);
    return null;
  }
}

export function writeAdminOtpChallenge(challenge: StoredAdminOtpChallenge) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ADMIN_OTP_KEY, JSON.stringify(challenge));
}

export function clearAdminOtpChallenge() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_OTP_KEY);
}
