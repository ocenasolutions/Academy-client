'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyCertificates, getMyEnrollments } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Certificate, Enrollment } from '@/types';

type ProgressFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export default function StudentProgress() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { loading: authLoading } = useProtectedPage(['STUDENT']);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filter, setFilter] = useState<ProgressFilter>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    // PERF: start the student data fetch immediately instead of waiting for auth state to settle.
    Promise.all([getMyEnrollments(), getMyCertificates()])
      .then(([nextEnrollments, nextCertificates]) => {
        setEnrollments(nextEnrollments);
        setCertificates(nextCertificates);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      addToast('Checkout completed and your course is now in progress.', 'success');
    }
  }, [addToast, searchParams]);

  const activeCourses = enrollments.filter((enrollment) => enrollment.status === 'ACTIVE');
  const completedCourses = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
  const averageProgress = useMemo(() => {
    if (!enrollments.length) return null;
    return Math.round(enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercent, 0) / enrollments.length);
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    if (filter === 'ACTIVE') return activeCourses;
    if (filter === 'COMPLETED') return completedCourses;
    return enrollments;
  }, [activeCourses, completedCourses, enrollments, filter]);

  const certificatePreview = certificates.slice(0, 6);

  return (
    <DashboardLayout role="student">
      <div className="space-y-10">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-500">
              Progress center
            </div>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-[var(--text-heading)] md:text-[3.8rem]">Track every course</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-text-main)]/80">
              See the full list of enrollments, progress levels, and certificates in one place. This page is the detailed view for longer learning journeys.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-[var(--surface-card-soft)] px-5 py-3 text-sm font-bold text-[var(--text-heading)] shadow-sm border border-[var(--surface-border)]">
            <Trophy className="h-4 w-4 text-brand-500" />
            <span>{completedCourses.length} completed course{completedCourses.length === 1 ? '' : 's'}</span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-4">
          <MetricCard label="Active Enrollments" value={loading || authLoading ? '...' : String(activeCourses.length)} accent="text-brand-500" />
          <MetricCard label="Completed" value={loading || authLoading ? '...' : String(completedCourses.length)} accent="text-emerald-600 dark:text-emerald-400" />
          <MetricCard label="Certificates" value={loading || authLoading ? '...' : String(certificates.length)} accent="text-brand-500" />
          <MetricCard label="Average Progress" value={loading || authLoading || averageProgress === null ? '...' : `${averageProgress}%`} accent="text-amber-600 dark:text-amber-400" />
        </section>

        <section className="rounded-[30px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-[var(--text-heading)]">
                <BookOpen className="h-6 w-6 text-brand-500" />
                Course progress
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-main)]/70">
                Use filters to jump between active courses and completed learning paths.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as ProgressFilter[]).map((item) => {
                const active = filter === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      active
                        ? 'bg-brand-500 text-white shadow-[0_12px_28px_rgba(var(--brand-500-rgb,59,130,246),0.22)]'
                        : 'border border-[var(--surface-border)] bg-[var(--surface-card-soft)] text-[var(--color-text-main)]/80 hover:border-brand-500/50 hover:text-brand-500'
                    }`}
                  >
                    {item === 'ALL' ? 'All' : item === 'ACTIVE' ? 'Active' : 'Completed'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filteredEnrollments.length === 0 && !loading ? (
              <div className="rounded-[24px] border border-dashed border-[var(--surface-border)] px-6 py-10 text-sm text-[var(--color-text-main)]/60">
                No courses match this filter.
              </div>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course.id}`}
                  className="flex flex-col gap-4 rounded-[24px] border border-[var(--surface-border)] px-4 py-4 transition hover:border-brand-500/50 hover:bg-[var(--surface-card-soft)] md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-4">
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="h-20 w-28 rounded-[18px] object-cover shadow-sm border border-[var(--surface-border)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-bold tracking-tight text-[var(--text-heading)]">{enrollment.course.title}</h3>
                        <span className="rounded-full bg-[var(--surface-card-soft)] border border-[var(--surface-border)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-main)]/60">
                          {enrollment.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-main)]/70">
                        {enrollment.course.summary || enrollment.course.description || 'Continue with the next lesson and complete the course path.'}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-main)]/50">
                        <span>{enrollment.course.instructor.name}</span>
                        <span>{enrollment.course.duration || 'Self-paced'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[240px] md:text-right">
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-500 md:justify-end">
                      <Clock3 className="h-4 w-4" />
                      {Math.round(enrollment.progressPercent)}% complete
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[var(--surface-card-soft)] border border-[var(--surface-border)] md:w-60">
                      <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600" style={{ width: `${enrollment.progressPercent}%` }} />
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]/80 hover:text-brand-500">
                      View course
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-[var(--text-heading)]">
                <CheckCircle2 className="h-6 w-6 text-brand-500" />
                Certificates
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-main)]/70">Completed courses and the proof you can share or download.</p>
            </div>
            <Link href="/dashboard/student/certificates" className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-2 text-sm font-bold text-[var(--color-text-main)]/80 shadow-sm transition hover:border-brand-500/50 hover:bg-[var(--surface-card)]">
              Open certificates
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certificatePreview.length === 0 && !loading ? (
              <div className="rounded-[24px] border border-dashed border-[var(--surface-border)] px-6 py-10 text-sm text-[var(--color-text-main)]/60 md:col-span-2 xl:col-span-3">
                No certificates yet. Finish a course to unlock this section.
              </div>
            ) : (
              certificatePreview.map((certificate) => (
                <Link
                  key={certificate.id}
                  href={`/certificate/${certificate.id}`}
                  className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-5 transition hover:border-brand-500/50 hover:bg-[var(--surface-card)]"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-main)]/50">Certificate</div>
                  <div className="mt-2 text-base font-bold text-[var(--text-heading)]">{certificate.courseTitle}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-main)]/65">{certificate.certificateNo}</div>
                  <div className="mt-4 text-sm font-bold text-brand-500">View certificate</div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, accent = 'text-brand-500' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.03)]">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-main)]/50">{label}</div>
      <div className={`mt-6 text-4xl font-extrabold tracking-tight ${accent}`}>{value}</div>
    </div>
  );
}
