'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getDashboardPath, writeAdminOtpChallenge } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, loading } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(searchParams.get('redirect') || getDashboardPath(user.role));
    }
  }, [loading, router, searchParams, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await signIn(email, password);

      if (result.type === 'otp_required') {
        writeAdminOtpChallenge({
          challengeId: result.challengeId,
          email: result.email,
          expiresAt: result.expiresAt,
          debugOtp: result.debugOtp,
        });
        addToast(result.debugOtp ? 'Test OTP generated. The code is shown on the next page.' : 'Admin OTP sent. Enter the code to finish signing in.', 'info');
        const redirect = searchParams.get('redirect');
        router.push(`/login/admin-otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`);
        return;
      }

      addToast('Signed in successfully.', 'success');
      router.push(searchParams.get('redirect') || getDashboardPath(result.user.role));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to sign in', 'error');
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
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]/60 hover:text-brand-600 mb-10 transition-colors bg-[var(--glass-bg)] px-4 py-2 rounded-xl w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="text-2xl font-display font-black tracking-tight text-[var(--color-text-heading)] flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]">C</div>
            CourseForge
          </div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-3">Welcome back</h1>
          <p className="text-[var(--color-text-main)]/60 font-medium mb-10">Enter your details to access your account.</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">Email address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="john@example.com" className="w-full clay-input !py-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full clay-input !py-4 tracking-widest pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-[var(--color-text-main)]/50 hover:text-[var(--color-text-heading)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full clay-btn py-4 text-lg font-black mt-8 disabled:opacity-60">
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-xs text-[var(--color-text-main)]/70 bg-[var(--glass-bg)] p-4 rounded-2xl">
            Seeded accounts: `student@academy.test`, `instructor@academy.test`, `admin@academy.test`, `testing.ocena@gmail.com` with password `Password123!`. Admin login also requires OTP.
          </div>

          <div className="mt-10 text-center font-bold text-[var(--color-text-main)]/60 bg-[var(--glass-bg)] py-4 rounded-2xl">
            Don't have an account? <Link href="/register" className="text-brand-600 hover:text-brand-700 ml-1">Sign up</Link>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 hidden lg:block relative m-6 rounded-[3rem] overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[var(--color-text-heading)] z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-luminosity" />
        <div className="absolute inset-x-0 bottom-0 p-20 bg-gradient-to-t from-[var(--color-text-heading)] to-transparent">
          <div className="glass-dark p-8 rounded-[2rem] border border-[var(--glass-border)]">
            <h2 className="text-3xl font-display font-black text-white mb-6 leading-tight drop-shadow-md">
              Real LMS authentication, token-based sessions, and role-aware dashboards.
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
