'use client';

import { ReactNode, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Search } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useRouter();
  const { user, signOut, dashboardPath } = useAuth();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col relative">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none z-0" />

      <header className="glass sticky top-4 mx-4 md:mx-8 z-50 rounded-3xl mt-4 mb-4 shadow-lg isolate">
        <div className="px-6 min-h-20 py-4 flex items-center justify-between gap-8 flex-wrap">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-display font-bold tracking-tight text-[var(--color-text-heading)] flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-[14px] flex items-center justify-center text-white text-xl shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)] border border-brand-400">C</div>
              CourseForge
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/courses" className="text-sm font-semibold text-[var(--color-text-main)] hover:text-brand-600 transition-colors">Catalog</Link>
              {user && (
                <Link href={dashboardPath} className="text-sm font-semibold text-[var(--color-text-main)] hover:text-brand-600 transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center relative">
            <Search className="w-5 h-5 text-[var(--color-text-main)]/50 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you want to learn?"
              className="w-full clay-input !py-3 !pl-12 !pr-6 text-sm"
            />
          </form>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeSwitcher />
            {user ? (
              <>
                <Link href={dashboardPath} className="hidden sm:block text-sm font-bold text-[var(--color-text-main)] hover:text-brand-600 transition-colors">
                  {user.name}
                </Link>
                <button
                  onClick={() => signOut().then(() => navigate.push('/'))}
                  className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-3 clay font-bold text-[var(--color-text-heading)]"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-bold text-[var(--color-text-main)] hover:text-brand-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="hidden sm:inline-flex items-center justify-center px-6 py-3 clay-btn font-bold">
                  Get Started
                </Link>
              </>
            )}
            <button className="md:hidden text-[var(--color-text-main)] p-2 clay rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 w-full">{children}</main>

      <footer className="glass border-t border-[var(--glass-border)] pt-16 pb-8 mt-auto relative z-10 mx-4 md:mx-8 mb-4 rounded-[2rem]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-display font-bold tracking-tight text-[var(--color-text-heading)] flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-500 rounded-[14px] flex items-center justify-center text-white text-xl shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]">C</div>
              CourseForge
            </Link>
            <p className="text-sm text-[var(--color-text-main)]/80 leading-relaxed max-w-xs font-medium">
              World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-text-heading)] mb-6 text-base">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="/courses" className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">Browse Catalog</Link></li>
              <li><Link href={dashboardPath} className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">Dashboard</Link></li>
              <li><Link href="/settings" className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-text-heading)] mb-6 text-base">Roles</h4>
            <ul className="space-y-4">
              <li className="text-sm font-medium text-[var(--color-text-main)]/70">Students</li>
              <li className="text-sm font-medium text-[var(--color-text-main)]/70">Instructors</li>
              <li className="text-sm font-medium text-[var(--color-text-main)]/70">Platform Admins</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-text-heading)] mb-6 text-base">Account</h4>
            <ul className="space-y-4">
              {user ? (
                <li>
                  <button onClick={() => signOut().then(() => navigate.push('/'))} className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">
                    Sign Out
                  </button>
                </li>
              ) : (
                <>
                  <li><Link href="/login" className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">Sign In</Link></li>
                  <li><Link href="/register" className="text-sm font-medium text-[var(--color-text-main)]/70 hover:text-brand-600 transition-colors">Create Account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-[var(--glass-border)] pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-text-main)]/60">© 2026 CourseForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
