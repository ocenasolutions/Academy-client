'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Search, ArrowUpRight, Compass, ExternalLink, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyEnrollments } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Enrollment } from '@/types';
import { buildCareerTracks, type CareerTrack } from '@/lib/career-paths';

export default function StudentCareers() {
  const { addToast } = useToast();
  const { loading: authLoading } = useProtectedPage(['STUDENT']);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    getMyEnrollments()
      .then((nextEnrollments) => {
        setEnrollments(nextEnrollments);
        if (nextEnrollments.length > 0) {
          // Default to the first course or 'all'
          setSelectedCourseId('all');
        }
      })
      .catch((err) => {
        addToast(err instanceof Error ? err.message : 'Failed to fetch enrollments', 'error');
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  const careerTracks = useMemo<CareerTrack[]>(() => buildCareerTracks(enrollments), [enrollments]);

  // Compile all recommended jobs based on the selected course filter
  const activeTrack = useMemo(() => {
    if (selectedCourseId === 'all') {
      return {
        courseTitle: 'All Enrolled Paths',
        keywords: careerTracks.map(t => t.keywords).join(' OR '),
        jobs: careerTracks.flatMap(t => t.jobs).filter((v, i, a) => a.findIndex(t2 => t2.id === v.id) === i)
      };
    }
    return careerTracks.find(t => t.courseId === selectedCourseId) || null;
  }, [careerTracks, selectedCourseId]);

  // Further filter job listings based on text search
  const filteredJobs = useMemo(() => {
    if (!activeTrack) return [];
    if (!searchTerm.trim()) return activeTrack.jobs;
    const term = searchTerm.toLowerCase();
    return activeTrack.jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.skills.some((s) => s.toLowerCase().includes(term))
    );
  }, [activeTrack, searchTerm]);
  if (loading || authLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-[var(--color-text-main)]/60 font-medium">Analyzing career paths and job postings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If student is not enrolled in any courses
  if (enrollments.length === 0) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-10">
          <section className="text-center py-16 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[32px] px-6 shadow-sm">
            <div className="w-16 h-16 bg-brand-500/15 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">Placements & Job Portals</h1>
            <p className="mt-3 text-[var(--color-text-main)]/80 max-w-lg mx-auto leading-relaxed">
              Unlock direct career opportunities and LinkedIn job postings. Complete or start a course to get customized recommendations!
            </p>
            <div className="mt-8">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(var(--brand-500-rgb,59,130,246),0.2)] hover:bg-brand-600 transition"
              >
                Explore Course Catalog
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-8 text-center">
            <p className="text-sm font-medium text-[var(--color-text-main)]/70">
              Career recommendations will appear here after you enroll in a course.
            </p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        {/* Page Header */}
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500 border border-brand-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Placement Integration Hub
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-heading)] md:text-[2.6rem]">
                Placements
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-main)]/80">
                Use your CourseForge skillsets to directly look up jobs on LinkedIn, get job recommendations, and review salary trends in your target field.
              </p>
            </div>

            {/* LinkedIn Redirect Button */}
            {activeTrack && (
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(activeTrack.keywords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(var(--brand-500-rgb,59,130,246),0.25)] hover:bg-brand-600 transition-all hover:scale-[1.02] shrink-0"
              >
                <Briefcase className="w-4 h-4" />
                Find All LinkedIn Jobs
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* Filter Course Selector */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--surface-card-soft)] p-4 rounded-2xl border border-[var(--surface-border)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-heading)]">
            <Compass className="w-4 h-4 text-brand-500" />
            Filter by Course Focus:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourseId('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                selectedCourseId === 'all'
                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                  : 'bg-[var(--surface-card)] border-[var(--surface-border)] text-[var(--color-text-main)]/80 hover:border-brand-500/50'
              }`}
            >
              All Paths ({enrollments.length})
            </button>
            {enrollments.map((enr) => (
              <button
                key={enr.course.id}
                onClick={() => setSelectedCourseId(enr.course.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all border flex items-center gap-2 ${
                  selectedCourseId === enr.course.id
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'bg-[var(--surface-card)] border-[var(--surface-border)] text-[var(--color-text-main)]/80 hover:border-brand-500/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${enr.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {enr.course.title}
              </button>
            ))}
          </div>
        </section>

        {/* Main Content Layout */}
        {activeTrack && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-heading)] flex items-center gap-2.5">
                  <Briefcase className="w-5 h-5 text-brand-500" />
                  Recommended Job Openings
                </h2>
                <p className="text-xs text-[var(--color-text-main)]/50 mt-1">Simulated openings tailored to your active courses. Click to search on LinkedIn.</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-main)]/40" />
                <input
                  type="text"
                  placeholder="Search company or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] text-xs text-[var(--text-heading)] outline-none focus:border-brand-500 placeholder:text-[var(--color-text-main)]/40"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-8 text-center text-[var(--color-text-main)]/50 text-sm">
                  No matching jobs found in this track. Try filtering by another course.
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-5 hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[var(--text-heading)] group-hover:text-brand-500 transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 uppercase">
                          {job.type}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--color-text-main)]/70 flex items-center gap-2.5 flex-wrap">
                        <span>{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="text-emerald-500">{job.salary}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-semibold bg-[var(--surface-card-soft)] text-[var(--color-text-main)]/80 border border-[var(--surface-border)] px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-brand-500/20 bg-brand-500/10 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all shrink-0"
                    >
                      Apply on LinkedIn
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
