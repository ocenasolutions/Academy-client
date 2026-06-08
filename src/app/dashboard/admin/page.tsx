'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BookOpen, Bot, DollarSign, ShieldAlert, TrendingUp, UserCheck, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatINRFromPaise } from '@/lib/currency';
import { getPlatformAnalytics } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { PlatformAnalytics } from '@/types';

export default function AdminDashboard() {
  const { user } = useProtectedPage(['ADMIN']);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

  useEffect(() => {
    if (!user) return;
    getPlatformAnalytics().then(setAnalytics);
  }, [user]);

  const roleChart = analytics ? [
    { name: 'Students', value: analytics.usersByRole.students },
    { name: 'Instructors', value: analytics.usersByRole.instructors },
    { name: 'Admins', value: analytics.usersByRole.admins },
  ] : [];

  return (
    <DashboardLayout role="admin">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">Admin Overview</h1>
          <p className="mt-2 text-[var(--color-text-main)]/70 font-medium">Operational visibility for users, instructors, approvals, revenue, enrollments, and AI activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-600 shadow-inner w-fit">
            <ShieldAlert className="w-4 h-4" />
            <span>{analytics ? analytics.pendingInstructorApprovals + analytics.pendingCourseApprovals : '...'} approvals waiting</span>
          </div>
          <Link
            href="/dashboard/admin/ai-course-builder"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-black text-white shadow-[0_14px_24px_rgba(var(--brand-500-rgb,59,130,246),0.22)] transition hover:translate-y-[-1px]"
          >
            <Bot className="h-4 w-4" />
            Open AI Builder
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-10">
        <MetricCard icon={Users} label="Total Students" value={analytics?.totalStudents} tone="brand" />
        <MetricCard icon={UserCheck} label="Total Instructors" value={analytics?.totalInstructors} tone="indigo" />
        <MetricCard icon={BookOpen} label="Total Courses" value={analytics?.totalCourses} tone="purple" />
        <MetricCard icon={DollarSign} label="Total Revenue" value={analytics ? formatINRFromPaise(analytics.totalRevenueCents) : '...'} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-10">
        <StatPanel title="Pending Instructor Approvals" value={analytics?.pendingInstructorApprovals} helper="Approval queue for instructor access" />
        <StatPanel title="Pending Course Approvals" value={analytics?.pendingCourseApprovals} helper="Courses waiting for review or publishing" />
        <StatPanel title="Recent Enrollments" value={analytics?.recentEnrollments.length} helper="Latest student course joins" />
        <StatPanel title="AI Generations Today" value={analytics?.aiCourseGenerationsToday} helper="Instructor AI course builder activity" icon={<Bot className="w-4 h-4 text-brand-500" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        <div className="xl:col-span-2 clay p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] flex items-center gap-2"><TrendingUp className="w-6 h-6 text-brand-500" /> Platform Growth</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.growthSeries ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-main)', opacity: 0.7 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-main)', opacity: 0.7 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} itemStyle={{ color: 'var(--color-text-heading)', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="users" name="Users" stroke="var(--brand-500, #3b82f6)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clay p-8 flex flex-col">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-brand-500" /> Users by Role</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-main)', opacity: 0.7 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-main)', opacity: 0.7 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }} itemStyle={{ color: 'var(--color-text-heading)', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="var(--brand-500, #3b82f6)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="clay p-8 flex flex-col">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-orange-500" /> Recent Registrations</h2>
          <div className="flex-1 space-y-4">
            {(analytics?.recentUsers ?? []).slice(0, 5).map((nextUser) => (
              <div key={nextUser.id} className="p-4 bg-[var(--glass-bg)] rounded-2xl shadow-inner border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <div className="font-black text-[var(--color-text-heading)] text-sm mb-1">{nextUser.firstName} {nextUser.lastName}</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)]/60">{nextUser.role} • {nextUser.email}</div>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${nextUser.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-orange-500/20 text-orange-700'}`}>
                  {nextUser.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="clay p-8">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Recent Enrollments</h2>
          <div className="space-y-4">
            {(analytics?.recentEnrollments ?? []).map((enrollment) => (
              <div key={enrollment.id} className="p-4 bg-[var(--glass-bg)] rounded-2xl border border-[var(--glass-border)]">
                <div className="font-black text-[var(--color-text-heading)] mb-1">{enrollment.user.firstName} {enrollment.user.lastName}</div>
                <div className="text-xs font-bold text-[var(--color-text-main)]/60">{enrollment.course.title} • {Math.round(enrollment.progressPercent)}% progress</div>
              </div>
            ))}
          </div>
        </div>

        <div className="clay p-8">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Recent Payments</h2>
          <div className="space-y-4">
            {(analytics?.recentPayments ?? []).map((payment) => (
              <div key={payment.id} className="p-4 bg-[var(--glass-bg)] rounded-2xl border border-[var(--glass-border)]">
                <div className="font-black text-[var(--color-text-heading)] mb-1">{formatINRFromPaise(payment.amountCents)} • {payment.provider}</div>
                <div className="text-xs font-bold text-[var(--color-text-main)]/60">
                  {payment.order?.items[0]?.course.title ?? 'Course'} • {payment.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value?: number | string;
  tone: 'brand' | 'indigo' | 'purple' | 'emerald';
}) {
  const tones = {
    brand: 'bg-brand-500/20 text-brand-600',
    indigo: 'bg-indigo-500/20 text-indigo-600',
    purple: 'bg-purple-500/20 text-purple-600',
    emerald: 'bg-emerald-500/20 text-emerald-600',
  };

  return (
    <div className="clay p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-2xl p-3 shadow-inner ${tones[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm font-bold text-[var(--color-text-main)]/60">{label}</p>
        <h3 className="text-3xl font-black text-[var(--color-text-heading)]">{value ?? '...'}</h3>
      </div>
    </div>
  );
}

function StatPanel({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value?: number | string;
  helper: string;
  icon?: ReactNode;
}) {
  return (
    <div className="clay p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-[var(--color-text-main)]/60">{title}</div>
        {icon ?? null}
      </div>
      <div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{value ?? '...'}</div>
      <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]/60">{helper}</div>
    </div>
  );
}
