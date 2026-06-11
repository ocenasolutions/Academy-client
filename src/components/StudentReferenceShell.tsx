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
  Users,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, type ReactNode } from 'react';
import { getMyNotifications } from '@/lib/api';
import { ThemeSwitcher } from './ThemeSwitcher';

type SidebarKey = 'progress' | 'settings' | 'payments' | 'certificates' | 'support' | 'careers' | 'community' | 'community-links' | 'courses';

const SIDEBAR_ITEMS: Array<{
  key: SidebarKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'progress', label: 'Progress', href: '/dashboard/student/progress', icon: UserCircle2 },
  { key: 'courses', label: 'Explore Courses', href: '/dashboard/student/courses', icon: BookOpen },
  { key: 'payments', label: 'Payments & Billing', href: '/dashboard/student/payments', icon: CreditCard },
  { key: 'certificates', label: 'Certificates', href: '/dashboard/student/certificates', icon: Shield },
  { key: 'careers', label: 'Placements', href: '/dashboard/student/careers', icon: Briefcase },
  { key: 'community', label: 'CourseForge Community', href: '/dashboard/student/community', icon: Users },
  { key: 'community-links', label: 'Community', href: '/dashboard/student/community-links', icon: Users },
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    getMyNotifications()
      .then((data) => {
        if (data && data.notifications) {
          setNotifications(data.notifications);
          if (data.notifications.length > 0) {
            setHasUnread(true);
          }
        }
      })
      .catch((err) => console.error('Failed to load notifications', err));
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-[var(--surface-border)] bg-[var(--surface-card)]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-5 xl:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] text-[var(--color-text-main)] shadow-sm transition hover:bg-[var(--surface-card)] lg:hidden"
              aria-label="Toggle student navigation"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="text-[1.7rem] font-extrabold tracking-tight text-brand-500">
              CourseForge
            </Link>
            <div className="hidden rounded-full border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-main)]/70 lg:block">
              Student workspace
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 rounded-full border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-2.5 text-sm text-[var(--color-text-main)]/70 shadow-sm lg:flex">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search lessons..."
                className="w-40 bg-transparent outline-none placeholder:text-[var(--color-text-main)]/40 text-[var(--text-heading)]"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                className="relative rounded-full p-2 text-[var(--color-text-main)]/70 transition hover:bg-[var(--surface-card-soft)] hover:text-[var(--text-heading)]"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setHasUnread(false);
                }}
              >
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-main)] animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-card-strong)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] z-50 transition-all">
                    <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-3 mb-3">
                      <h3 className="font-bold text-[var(--text-heading)] text-sm">Notifications</h3>
                      <button 
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs text-[var(--color-text-main)]/60 hover:text-[var(--text-heading)] font-semibold"
                      >
                        Close
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                          <Bell className="h-8 w-8 mb-2 opacity-40" />
                          <p className="text-xs font-semibold">All caught up!</p>
                          <p className="text-[10px]">No notifications at the moment.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const titleLower = notif.title.toLowerCase();
                          const isOffer = titleLower.includes('offer') || titleLower.includes('discount') || titleLower.includes('coupon');
                          const isWarning = titleLower.includes('alert') || titleLower.includes('warning') || titleLower.includes('limit');
                          const isEnroll = titleLower.includes('enrolled') || titleLower.includes('enrollment') || titleLower.includes('successful');
                          
                          return (
                            <div 
                              key={notif.id} 
                              className={`p-3 rounded-2xl border transition text-left ${
                                isOffer ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                                isWarning ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                                isEnroll ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                'bg-[var(--surface-card-soft)] border-[var(--surface-border)] text-[var(--text-main)]'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-base shrink-0">
                                  {isOffer ? '🎁' : isWarning ? '⚠️' : isEnroll ? '🎓' : '📢'}
                                </span>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <h4 className="font-bold text-xs truncate">{notif.title}</h4>
                                  <p className="text-[11px] leading-relaxed opacity-90 break-words">{notif.message}</p>
                                  <p className="text-[9px] opacity-50 mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ThemeSwitcher />
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--surface-border)]">
              <div className="text-right leading-tight">
                <div className="text-sm font-bold text-[var(--text-heading)]">{user?.name ?? 'John Doe'}</div>
                <div className="text-xs text-[var(--color-text-main)]/60">{user?.email ?? 'student@academy.test'}</div>
              </div>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'}
                alt={user?.name || 'Student'}
                className="h-10 w-10 rounded-full border-2 border-[var(--surface-border)] object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <aside className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[300px] border-r border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[12px_0_40px_rgba(0,0,0,0.06)] backdrop-blur-md transition-transform duration-200 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-5 rounded-[22px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-main)]/45">Student Panel</div>
            <div className="mt-2 text-sm font-black text-[var(--text-heading)]">{user?.name ?? 'John Doe'}</div>
            <div className="text-xs text-[var(--color-text-main)]/60">{user?.email ?? 'student@academy.test'}</div>
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
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                      active
                        ? 'bg-brand-500 text-white shadow-[0_10px_20px_rgba(var(--brand-500-rgb,59,130,246),0.25)]'
                        : 'text-[var(--color-text-main)]/75 hover:bg-[var(--surface-card-soft)] hover:text-[var(--text-heading)] hover:scale-[1.02]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    {active ? <ChevronRight className="h-4 w-4" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--surface-border)] pt-4">
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-rose-500 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-[300px] border-r border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[12px_0_40px_rgba(0,0,0,0.02)] backdrop-blur-md lg:block">
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-5 rounded-[22px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-main)]/45">Student Panel</div>
            <div className="mt-2 text-sm font-black text-[var(--text-heading)]">{user?.name ?? 'John Doe'}</div>
            <div className="text-xs text-[var(--color-text-main)]/60">{user?.email ?? 'student@academy.test'}</div>
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
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                      active
                        ? 'bg-brand-500 text-white shadow-[0_10px_20px_rgba(var(--brand-500-rgb,59,130,246),0.25)]'
                        : 'text-[var(--color-text-main)]/75 hover:bg-[var(--surface-card-soft)] hover:text-[var(--text-heading)] hover:scale-[1.02]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    {active ? <ChevronRight className="h-4 w-4" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--surface-border)] pt-4">
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-rose-500 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            {/* <div className="mt-4 rounded-[24px] bg-[var(--surface-card-strong)] border border-[var(--surface-border)] p-5 text-[var(--text-main)] shadow-[0_18px_40px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-heading)]">
                <LifeBuoy className="h-4 w-4" />
                Need help?
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-main)]/80">
                Talk to our learning experts if you need help with billing, progress, or certificates.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:scale-105 active:scale-95">
                Open support
                <ChevronRight className="h-4 w-4" />
              </button>
            </div> */}
          </div>
        </div>
      </aside>

      <main className="w-full px-3 py-6 sm:px-4 lg:pl-[324px] lg:pr-6 xl:py-6">
        <div className={`min-w-0 ${className}`}>{children}</div>
      </main>

      <footer className="mt-10 border-t border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 lg:pl-[324px]">
        <div className="w-full px-4 py-12 sm:px-5 xl:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-1">
              <div className="text-2xl font-black tracking-tight text-[var(--text-heading)]">CourseForge</div>
              <p className="max-w-sm text-sm leading-7 text-[var(--color-text-main)]/75">
                World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.
              </p>
            </div>
            <FooterGroup title="Platform" items={['Browse Catalog', 'Dashboard', 'Settings', 'Blog']} />
            <FooterGroup title="Roles" items={['Students', 'Instructors', 'Platform Admins', 'Help Center']} />
            <FooterGroup title="Account" items={['Profile', 'Billing', 'Terms of Service', 'Sign Out']} accentLast />
          </div>
          <div className="mt-10 border-t border-[var(--surface-border)] pt-6 text-center text-sm text-[var(--color-text-main)]/50">
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
      <div className="text-sm font-black uppercase tracking-[0.18em] text-brand-500">{title}</div>
      <ul className="space-y-3 text-sm text-[var(--color-text-main)]/70">
        {items.map((item, index) => (
          <li key={item} className={accentLast && index === items.length - 1 ? 'font-bold text-brand-500' : ''}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
