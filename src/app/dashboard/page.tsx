'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardIndexRedirect() {
  const { user, loading, dashboardPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace(dashboardPath);
    } else {
      router.replace('/login');
    }
  }, [user, loading, dashboardPath, router]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
