'use client';

import { ReactNode } from 'react';
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
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { adminSectionGroups } from '@/lib/admin';

type LinkItem = { name: string; href: string; icon: any };
type LinkGroup = { group: string; items: LinkItem[] };

export function DashboardLayout({ children, role }: { children: ReactNode; role: 'student' | 'instructor' | 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

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
              items: [{ name: 'Dashboard', href: '/dashboard/admin', icon: PieChart }],
            },
            ...adminSectionGroups
              .filter((group) => group.group !== 'Overview')
              .map((group) => ({
                group: group.group,
                items: group.sections.map((section) => ({
                  name: section.title,
                  href: `/dashboard/admin/${section.slug}`,
                  icon:
                    section.slug === 'users' ? Users :
                    section.slug === 'instructors' ? ClipboardCheck :
                    section.slug === 'courses' ? BookOpen :
                    section.slug === 'ai-course-builder' ? Bot :
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
