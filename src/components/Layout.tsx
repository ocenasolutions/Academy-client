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
    <div className="theme-shell min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300">
      <div className="fixed -top-24 left-[-8rem] h-80 w-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="fixed top-40 right-[-8rem] h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <header className="theme-surface sticky top-0 z-50 border-b border-[var(--surface-border)] shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-10">
          <Link href="/" className="flex items-center gap-3 text-[1.2rem] font-extrabold tracking-tight text-[var(--text-heading)] md:text-[1.4rem]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white shadow-sm">C</div>
            CourseForge
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/courses" className="border-b-2 border-brand-500 py-1 text-sm font-bold text-[var(--text-heading)]">
              Catalog
            </Link>
            {user ? (
              <Link href={dashboardPath} className="py-1 text-sm font-medium text-[var(--color-text-main)]/70 transition-colors hover:text-brand-500">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="py-1 text-sm font-medium text-[var(--color-text-main)]/70 transition-colors hover:text-brand-500">
                Dashboard
              </Link>
            )}
          </nav>

          <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-[380px] lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you want to learn?"
              className="h-10 w-full rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)]/80 pl-10 pr-4 text-sm text-[var(--text-heading)] outline-none transition focus:border-brand-500/50"
            />
          </form>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <ThemeSwitcher />
            {user ? (
              <>
                <Link href={dashboardPath} className="hidden items-center gap-2 border-l border-[var(--surface-border)] pl-4 text-right sm:flex">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-heading)]">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-main)]/60">{user.email}</p>
                  </div>
                  <img
                    alt={user.name}
                    src={user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'}
                    className="h-10 w-10 rounded-full border border-[var(--surface-border)] object-cover"
                  />
                </Link>
                <button
                  onClick={() => signOut().then(() => navigate.push('/'))}
                  className="hidden items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-[var(--text-heading)] transition hover:bg-[var(--surface-card-soft)] sm:inline-flex"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm font-semibold text-[var(--color-text-main)]/70 transition hover:text-brand-500 sm:block">
                  Sign In
                </Link>
                <Link href="/register" className="hidden rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 sm:inline-flex">
                  Get Started
                </Link>
              </>
            )}
            <button className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] p-2 text-[var(--color-text-main)] shadow-sm md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="theme-surface mx-4 mb-4 mt-16 rounded-[2rem] px-4 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.05)] md:mx-8 md:px-10 border border-[var(--surface-border)]">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="mb-5 flex items-center gap-3 text-xl font-extrabold tracking-tight text-[var(--text-heading)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">C</div>
              CourseForge
            </Link>
            <p className="max-w-xs text-sm leading-6 text-[var(--color-text-main)]/70">
              World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.
            </p>
          </div>
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[var(--text-heading)]">Platform</h4>
            <ul className="space-y-4 text-sm text-[var(--color-text-main)]/70">
              <li><Link href="/courses" className="hover:text-brand-500">Browse Catalog</Link></li>
              <li><Link href={dashboardPath} className="hover:text-brand-500">Dashboard</Link></li>
              <li><Link href="/settings" className="hover:text-brand-500">Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[var(--text-heading)]">Roles</h4>
            <ul className="space-y-4 text-sm text-[var(--color-text-main)]/70">
              <li>Students</li>
              <li>Instructors</li>
              <li>Platform Admins</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[var(--text-heading)]">Account</h4>
            <ul className="space-y-4 text-sm text-[var(--color-text-main)]/70">
              {user ? (
                <li>
                  <button onClick={() => signOut().then(() => navigate.push('/'))} className="hover:text-brand-500">
                    Sign Out
                  </button>
                </li>
              ) : (
                <>
                  <li><Link href="/login" className="hover:text-brand-500">Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-brand-500">Create Account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1440px] border-t border-[var(--surface-border)] pt-6 text-sm text-[var(--color-text-main)]/50">
          © 2026 CourseForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
