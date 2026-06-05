'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getDashboardPath } from '@/lib/auth';

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const nextUser = await signUp(form);
      addToast('Account created successfully.', 'success');
      router.push(searchParams.get('redirect') || getDashboardPath(nextUser.role));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-main)] overflow-hidden relative">
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/30 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/30 blur-[120px] pointer-events-none z-0" />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="clay p-8 sm:p-12 w-full max-w-md !rounded-[3rem]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]/60 hover:text-brand-600 mb-10 transition-colors bg-[var(--glass-bg)] px-4 py-2 rounded-xl w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="text-2xl font-display font-black tracking-tight text-[var(--color-text-heading)] flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]">C</div>
            CourseForge
          </div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-3">Create an account</h1>
          <p className="text-[var(--color-text-main)]/60 font-medium mb-10">Start your learning journey today.</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">First name</label>
                <input value={form.firstName} onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))} type="text" placeholder="John" className="w-full clay-input !py-4" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">Last name</label>
                <input value={form.lastName} onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))} type="text" placeholder="Doe" className="w-full clay-input !py-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">Email address</label>
              <input value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} type="email" placeholder="john@example.com" className="w-full clay-input !py-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">I am joining as</label>
              <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as 'STUDENT' | 'INSTRUCTOR' }))} className="w-full clay-input !py-4">
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-heading)] mb-2 pl-2">Password</label>
              <input value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} type="password" placeholder="••••••••" className="w-full clay-input !py-4 tracking-widest" />
            </div>
            <button type="submit" disabled={submitting} className="w-full clay-btn py-4 text-lg font-black mt-8 disabled:opacity-60">
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 text-center font-bold text-[var(--color-text-main)]/60 bg-[var(--glass-bg)] py-4 rounded-2xl">
            Already have an account? <Link href="/login" className="text-brand-600 hover:text-brand-700 ml-1">Sign in</Link>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 hidden lg:block relative m-6 rounded-[3rem] overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/60 to-transparent mix-blend-multiply"></div>
      </div>
    </div>
  );
}
