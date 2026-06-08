'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  BarChart,
  BookOpen,
  Bot,
  ClipboardCheck,
  CreditCard,
  FileBadge,
  FolderTree,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  PieChart,
  Settings,
  Shield,
  Ticket,
  Users,
  Briefcase,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { StudentReferenceShell } from './StudentReferenceShell';
import { useAuth } from '@/contexts/AuthContext';
import { adminSectionGroups, getAdminSectionLandingHref } from '@/lib/admin';

type LinkItem = { name: string; href: string; icon: any };
type LinkGroup = { group: string; items: LinkItem[] };

export function DashboardLayout({ children, role }: { children: ReactNode; role: 'student' | 'instructor' | 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (role === 'admin') {
      setAdminMobileMenuOpen(false);
    }
  }, [pathname, role]);

  if (role === 'student') {
    return <StudentReferenceShell activeSidebar={getStudentSidebarKey(pathname)}>{children}</StudentReferenceShell>;
  }

  const groupedLinks: LinkGroup[] =
    role === 'student'
      ? [
          {
            group: 'Browse',
            items: [
              { name: 'Home', href: '/', icon: Home },
              { name: 'Catalog', href: '/courses', icon: BookOpen },
            ],
          },
          {
            group: 'Learning',
            items: [
              { name: 'Overview', href: '/dashboard/student', icon: LayoutDashboard },
              { name: 'Progress', href: '/dashboard/student/progress', icon: BarChart },
              { name: 'Certificates', href: '/dashboard/student/certificates', icon: Award },
              { name: 'Careers & Community', href: '/dashboard/student/careers', icon: Briefcase },
              { name: 'Payments', href: '/dashboard/student/payments', icon: CreditCard },
              { name: 'Support', href: '/dashboard/student/support', icon: Ticket },
              { name: 'Settings', href: '/settings', icon: Settings },
            ],
          },
        ]
      : role === 'instructor'
        ? [{ group: 'Teaching', items: [{ name: 'Overview', href: '/dashboard/instructor', icon: LayoutDashboard }, { name: 'Settings', href: '/settings', icon: Settings }] }]
        : [
            {
              group: 'Overview',
              items: [
                { name: 'Dashboard', href: '/dashboard/admin', icon: PieChart },
                {
                  name: 'AI Course Builder',
                  href: '/dashboard/admin/ai-course-builder',
                  icon: Bot,
                },
              ],
            },
            ...adminSectionGroups
              .filter((group) => group.group !== 'Overview')
              .map((group) => ({
                group: group.group,
                items: group.sections
                  .filter((section) => section.slug !== 'ai-course-builder')
                  .map((section) => ({
                    name: section.title,
                    href: getAdminSectionLandingHref(section.slug),
                    icon:
                      section.slug === 'users' ? Users :
                      section.slug === 'instructors' ? ClipboardCheck :
                      section.slug === 'courses' ? BookOpen :
                      section.slug === 'categories' ? FolderTree :
                      section.slug === 'enrollments' ? BarChart :
                      section.slug === 'payments' ? CreditCard :
                      section.slug === 'coupons' ? Ticket :
                      section.slug === 'reviews' ? MessageSquareWarning :
                      section.slug === 'certificates' ? FileBadge :
                      section.slug === 'moderation' ? Shield :
                      section.slug === 'analytics' ? LayoutDashboard :
                      section.slug === 'support' ? Ticket :
                      section.slug === 'notifications' ? Bell :
                      section.slug === 'settings' ? Settings :
                      section.slug === 'audit-logs' ? Shield :
                      LayoutDashboard,
                  })),
              })),
          ];

  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-heading)]">
        <div
          className={`fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-200 xl:hidden ${adminMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          aria-hidden={!adminMobileMenuOpen}
          onClick={() => setAdminMobileMenuOpen(false)}
        />

        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[308px] border-r border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[12px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:flex xl:flex-col">
          <div className="flex h-20 items-center justify-between border-b border-[var(--color-text-heading)]/5 px-7">
            <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--color-text-heading)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-500 text-white shadow-[0_10px_24px_rgba(var(--brand-500-rgb,59,130,246),0.26)]">
                C
              </div>
              CourseForge
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <div className="mb-6 rounded-[22px] border border-[var(--glass-border)] bg-white/70 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-main)]/45">Admin Panel</div>
              {user && (
                <>
                  <div className="mt-2 text-sm font-black text-[var(--color-text-heading)]">{user.name}</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)]/60">{user.email}</div>
                </>
              )}
            </div>

            <div className="space-y-6">
              {groupedLinks.map((group) => (
                <div key={group.group} className="space-y-2">
                  <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-text-main)]/40">{group.group}</h4>
                  <div className="space-y-1.5">
                    {group.items.map((link) => {
                      const isActive = link.href === '/dashboard/admin'
                        ? pathname === link.href
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                            isActive
                              ? 'bg-brand-500 text-white shadow-[0_14px_28px_rgba(var(--brand-500-rgb,59,130,246),0.28)]'
                              : 'text-[var(--color-text-main)]/70 hover:bg-white hover:text-[var(--color-text-heading)]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--color-text-main)]/50'}`} />
                          <span className="truncate">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-text-heading)]/5 p-4">
            <button
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-text-main)]/70 transition hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        <aside
          className={`fixed left-0 top-0 z-[60] h-dvh w-[300px] border-r border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[12px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-200 xl:hidden ${adminMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          aria-hidden={!adminMobileMenuOpen}
        >
          <div className="flex h-20 items-center justify-between border-b border-[var(--color-text-heading)]/5 px-7">
            <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--color-text-heading)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-500 text-white shadow-[0_10px_24px_rgba(var(--brand-500-rgb,59,130,246),0.26)]">
                C
              </div>
              CourseForge
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <div className="mb-6 rounded-[22px] border border-[var(--glass-border)] bg-white/70 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-text-main)]/45">Admin Panel</div>
              {user && (
                <>
                  <div className="mt-2 text-sm font-black text-[var(--color-text-heading)]">{user.name}</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)]/60">{user.email}</div>
                </>
              )}
            </div>

            <div className="space-y-6">
              {groupedLinks.map((group) => (
                <div key={group.group} className="space-y-2">
                  <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-text-main)]/40">{group.group}</h4>
                  <div className="space-y-1.5">
                    {group.items.map((link) => {
                      const isActive = link.href === '/dashboard/admin'
                        ? pathname === link.href
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setAdminMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                            isActive
                              ? 'bg-brand-500 text-white shadow-[0_14px_28px_rgba(var(--brand-500-rgb,59,130,246),0.28)]'
                              : 'text-[var(--color-text-main)]/70 hover:bg-white hover:text-[var(--color-text-heading)]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--color-text-main)]/50'}`} />
                          <span className="truncate">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-text-heading)]/5 p-4">
            <button
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-text-main)]/70 transition hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        <div className="min-h-screen xl:pl-[308px]">
          <header className="sticky top-0 z-30 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-5 xl:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdminMobileMenuOpen((current) => !current)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_10px_22px_rgba(var(--brand-500-rgb,59,130,246),0.26)] xl:hidden"
                  aria-label="Toggle admin navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_10px_22px_rgba(var(--brand-500-rgb,59,130,246),0.26)] xl:flex">
                  <Menu className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-600">Admin workspace</div>
                  <div className="hidden text-sm font-bold text-[var(--color-text-heading)] md:block">Monitor platform operations, approvals, analytics, and AI activity.</div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeSwitcher />
                {user && (
                  <div className="rounded-2xl bg-white/75 px-3 py-2 text-right shadow-sm sm:px-4">
                    <div className="text-sm font-black text-[var(--color-text-heading)]">{user.name}</div>
                    <div className="hidden text-xs font-bold text-[var(--color-text-main)]/60 sm:block">{user.email}</div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-main)] overflow-hidden p-4 md:p-6 gap-6 relative">
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none z-0" />

      <div className="w-72 clay flex flex-col z-10 !rounded-[2.5rem] overflow-hidden">
        <div className="h-24 flex items-center px-8 border-b border-[var(--color-text-heading)]/5 shrink-0 justify-between">
          <Link href="/" className="text-2xl font-display font-black text-[var(--color-text-heading)] flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-[14px] flex items-center justify-center text-white text-xl shadow-[4px_4px_10px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]">C</div>
            CourseForge
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 pb-12 custom-scrollbar">
          <div className="text-xs font-black text-[var(--color-text-main)]/50 uppercase tracking-widest mb-6 px-4 bg-[var(--glass-bg)] py-2 rounded-xl inline-block w-fit mx-2">{role} Panel</div>
          {user && (
            <div className="mx-2 mb-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4">
              <div className="text-sm font-black text-[var(--color-text-heading)]">{user.name}</div>
              <div className="text-xs font-bold text-[var(--color-text-main)]/60">{user.email}</div>
            </div>
          )}
          <div className="space-y-8">
            {groupedLinks.map((group) => (
              <div key={group.group} className="space-y-2">
                <h4 className="text-[10px] font-black text-[var(--color-text-main)]/40 uppercase tracking-widest px-4 mb-3">{group.group}</h4>
                {group.items.map((link) => {
                  const isActive = link.href === '/dashboard/admin'
                    ? pathname === link.href
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  const Icon = link.icon;
                  return (
                    <Link key={link.name} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-brand-500 text-white shadow-[0_4px_12px_rgba(var(--brand-500-rgb, 59, 130, 246),0.3)]' : 'text-[var(--color-text-main)]/70 hover:bg-[var(--glass-bg)] hover:text-[var(--color-text-heading)] hover:scale-[1.02]'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--color-text-main)]/50'}`} />
                      <span className="truncate">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[var(--color-text-heading)]/5 shrink-0 bg-[var(--glass-bg)] backdrop-blur-sm">
          <button onClick={() => signOut().then(() => router.push('/'))} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm text-[var(--color-text-main)]/70 hover:bg-red-500 hover:text-white hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] w-full group hover:scale-[1.02]">
            <LogOut className="w-4 h-4 shrink-0 text-[var(--color-text-main)]/50 group-hover:text-white" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10 glass !rounded-[2.5rem] relative custom-scrollbar">
        <div className="px-6 pt-6 md:px-8 md:pt-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_8px_20px_rgba(var(--brand-500-rgb,59,130,246),0.28)]">
                {role === 'student' ? <GraduationCap className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">{role} workspace</div>
                <div className="text-sm font-bold text-[var(--color-text-heading)]">
                  {role === 'student'
                    ? 'Keep learning.'
                    : role === 'instructor'
                      ? 'Create, refine, and review your teaching workflow.'
                      : 'Monitor platform operations, approvals, analytics, and AI activity.'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {role === 'student' && (
                  <>
                    <TopLink href="/" active={pathname === '/'} label="Home" />
                    <TopLink href="/courses" active={pathname === '/courses' || pathname.startsWith('/courses/')} label="Catalog" />
                    <TopLink href="/dashboard/student" active={pathname === '/dashboard/student'} label="Dashboard" />
                  <TopLink href="/dashboard/student/progress" active={pathname.startsWith('/dashboard/student/progress')} label="Progress" />
                </>
                )}
                <div className="ml-auto flex items-center gap-3 lg:ml-0">
                  <ThemeSwitcher />
                  {user && (
                    <div className="rounded-2xl bg-white/70 px-4 py-2 text-right shadow-inner">
                      <div className="text-sm font-black text-[var(--color-text-heading)]">{user.name}</div>
                      <div className="text-xs font-bold text-[var(--color-text-main)]/60">{user.email}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-8 md:p-8 md:pt-10 max-w-6xl mx-auto h-full">{children}</div>
      </div>
    </div>
  );
}

function getStudentSidebarKey(pathname: string) {
  if (pathname.startsWith('/dashboard/student/payments')) {
    return 'payments';
  }
  if (pathname.startsWith('/dashboard/student/certificates')) {
    return 'certificates';
  }
  if (pathname.startsWith('/dashboard/student/careers')) {
    return 'careers';
  }
  if (pathname.startsWith('/dashboard/student/support')) {
    return 'support';
  }
  if (pathname.startsWith('/dashboard/student/progress')) {
    return 'progress';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  return 'progress';
}

function TopLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
        active
          ? 'bg-brand-500 text-white shadow-[0_8px_16px_rgba(var(--brand-500-rgb,59,130,246),0.25)]'
          : 'bg-white/60 text-[var(--color-text-main)] hover:bg-white hover:text-[var(--color-text-heading)]'
      }`}
    >
      {label}
    </Link>
  );
}

function TopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${active ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-950'}`}
    >
      <span>{label}</span>
      <span className={`mt-1 block h-0.5 rounded-full transition ${active ? 'w-full bg-indigo-600' : 'w-0 bg-transparent group-hover:w-full'}`} />
    </Link>
  );
}
