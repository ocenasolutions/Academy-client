'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/lib/auth';
import { UserRole } from '@/types';

export function useProtectedPage(allowedRoles?: UserRole[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) {
      return;
    }

    if (!auth.user) {
      const redirect = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/';
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
      router.replace(getDashboardPath(auth.user.role));
    }
  }, [allowedRoles, auth.loading, auth.user, router]);

  return auth;
}
