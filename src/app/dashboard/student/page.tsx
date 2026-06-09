'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProtectedPage } from '@/lib/use-protected-page';

export default function StudentDashboardRedirect() {
  const { loading } = useProtectedPage(['STUDENT']);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    const query = searchParams.toString();
    router.replace(query ? `/dashboard/student/progress?${query}` : '/dashboard/student/progress');
  }, [loading, router, searchParams]);

  return <div className="min-h-screen bg-[var(--bg-main)]" aria-hidden="true" />;
}
