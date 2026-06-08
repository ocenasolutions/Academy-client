'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  UserCircle2,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, type ReactNode } from 'react';

type SidebarKey = 'progress' | 'settings' | 'payments' | 'certificates' | 'support' | 'careers';

const SIDEBAR_ITEMS: Array<{
  key: SidebarKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'progress', label: 'Progress', href: '/dashboard/student/progress', icon: UserCircle2 },
  { key: 'payments', label: 'Payments & Billing', href: '/dashboard/student/payments', icon: CreditCard },
  { key: 'certificates', label: 'Certificates', href: '/dashboard/student/certificates', icon: Shield },
  { key: 'careers', label: 'Careers & Community', href: '/dashboard/student/careers', icon: Briefcase },
  { key: 'support', label: 'Support', href: '/dashboard/student/support', icon: LifeBuoy },
  { key: 'settings', label: 'Account Settings', href: '/settings', icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentReferenceShell({
  activeSidebar,
  children,
  className = '',
}: {
  activeSidebar: SidebarKey;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-5 xl:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle student navigation"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="text-[1.7rem] font-extrabold tracking-tight text-indigo-600">
              CourseForge
            </Link>
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 lg:block">
              Student workspace
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm lg:flex">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search lessons..."
                className="w-40 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-3 pl-4">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium text-slate-950">{user?.name ?? 'John Doe'}</div>
                <div className="text-xs text-slate-500">{user?.email ?? 'student@academy.test'}</div>
              </div>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'}
                alt={user?.name || 'Student'}
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 transition-opacity duration-200 lg:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <aside className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[300px] border-r border-slate-200 bg-white/95 shadow-[12px_0_40px_rgba(15,23,42,0.04)] transition-transform duration-200 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-5 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Student Panel</div>
            <div className="mt-2 text-sm font-semibold text-slate-950">{user?.name ?? 'John Doe'}</div>
            <div className="text-xs text-slate-500">{user?.email ?? 'student@academy.test'}</div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeSidebar || isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)]'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {active ? <ChevronRight className="h-4 w-4" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-[300px] border-r border-slate-200 bg-white/95 shadow-[12px_0_40px_rgba(15,23,42,0.04)] lg:block">
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-5 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Student Panel</div>
            <div className="mt-2 text-sm font-semibold text-slate-950">{user?.name ?? 'John Doe'}</div>
            <div className="text-xs text-slate-500">{user?.email ?? 'student@academy.test'}</div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeSidebar || isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)]'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {active ? <ChevronRight className="h-4 w-4" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <div className="mt-4 rounded-[24px] bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <LifeBuoy className="h-4 w-4" />
                Need help?
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Talk to our learning experts if you need help with billing, progress, or certificates.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
                Open support
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="w-full px-3 py-6 sm:px-4 lg:pl-[324px] lg:pr-6 xl:py-6">
        <div className={`min-w-0 ${className}`}>{children}</div>
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white/75 lg:pl-[324px]">
        <div className="w-full px-4 py-12 sm:px-5 xl:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-1">
              <div className="text-2xl font-semibold tracking-tight text-slate-950">CourseForge</div>
              <p className="max-w-sm text-sm leading-7 text-slate-600">
                World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.
              </p>
            </div>
            <FooterGroup title="Platform" items={['Browse Catalog', 'Dashboard', 'Settings', 'Blog']} />
            <FooterGroup title="Roles" items={['Students', 'Instructors', 'Platform Admins', 'Help Center']} />
            <FooterGroup title="Account" items={['Profile', 'Billing', 'Terms of Service', 'Sign Out']} accentLast />
          </div>
          <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
            © 2026 CourseForge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterGroup({ title, items, accentLast = false }: { title: string; items: string[]; accentLast?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{title}</div>
      <ul className="space-y-3 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={item} className={accentLast && index === items.length - 1 ? 'font-semibold text-indigo-600' : ''}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
