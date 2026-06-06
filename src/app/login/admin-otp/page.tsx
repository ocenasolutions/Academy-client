'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  clearAdminOtpChallenge,
  getDashboardPath,
  readAdminOtpChallenge,
} from '@/lib/auth';

export default function AdminOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, completeAdminSignIn, loading } = useAuth();
  const { addToast } = useToast();
  const challenge = useMemo(() => readAdminOtpChallenge(), []);
  const [otp, setOtp] = useState(challenge?.debugOtp ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (challenge?.debugOtp) {
      setOtp(challenge.debugOtp);
    }
  }, [challenge]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(searchParams.get('redirect') || getDashboardPath(user.role));
      return;
    }

    if (!challenge) {
      addToast('Admin OTP session not found. Please sign in again.', 'info');
      router.replace('/login');
    }
  }, [addToast, challenge, loading, router, searchParams, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!challenge) {
      return;
    }

    setSubmitting(true);
    try {
      const nextUser = await completeAdminSignIn(challenge.challengeId, otp);
      clearAdminOtpChallenge();
      addToast('Admin sign in completed.', 'success');
      router.push(searchParams.get('redirect') || getDashboardPath(nextUser.role));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to verify OTP', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-main)] overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/30 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/30 blur-[120px] pointer-events-none z-0" />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="clay p-8 sm:p-12 w-full max-w-md !rounded-[3rem]">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]/60 hover:text-brand-600 mb-10 transition-colors bg-[var(--glass-bg)] px-4 py-2 rounded-xl w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
          <div className="text-2xl font-display font-black tracking-tight text-[var(--color-text-heading)] flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            Admin OTP
          </div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-3">Verify your sign in</h1>
          <p className="text-[var(--color-text-main)]/60 font-medium mb-8">
            Enter the one-time password sent for admin access.
          </p>

          {challenge && (
            <div className="rounded-2xl bg-[var(--glass-bg)] p-4 text-sm font-medium text-[var(--color-text-main)]/70 mb-6">
              OTP verification is required for <span className="font-black text-[var(--color-text-heading)]">{challenge.email}</span>.
              {challenge.debugOtp && (
                <div className="mt-3 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-600 mb-1">Test OTP</div>
                  <div className="text-lg font-black tracking-[0.35em] text-[var(--color-text-heading)]">{challenge.debugOtp}</div>
                </div>
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">One-Time Password</label>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" inputMode="numeric" maxLength={6} placeholder="123456" className="w-full clay-input !py-4 tracking-[0.4em]" />
            </div>
            <button type="submit" disabled={submitting || !challenge} className="w-full clay-btn py-4 text-lg font-black mt-8 disabled:opacity-60">
              {submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearAdminOtpChallenge();
                router.push('/login');
              }}
              className="w-full py-3 text-sm font-bold text-[var(--color-text-main)]/70"
            >
              Use another account
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
