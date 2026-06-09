'use client';

import { useEffect, useMemo, useState } from 'react';
import { Compass, ExternalLink, Globe, Search, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyEnrollments } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Enrollment } from '@/types';
import { buildCareerTracks, type CareerTrack } from '@/lib/career-paths';

type CommunityCard = CareerTrack['communities'][number];

const FALLBACK_COMMUNITIES: CommunityCard[] = [
  {
    name: 'Reactiflux Discord',
    platform: 'Discord',
    description: 'A large community for React, React Native, Redux, and web development discussions.',
    url: 'https://www.reactiflux.com/',
    memberCount: '200k+ members',
  },
  {
    name: 'r/learnprogramming',
    platform: 'Reddit',
    description: 'A general-purpose Reddit community for learners sharing resources, advice, and progress.',
    url: 'https://www.reddit.com/r/learnprogramming/',
    memberCount: '3.5M+ members',
  },
  {
    name: 'Stack Overflow',
    platform: 'Forum',
    description: 'Q&A forum for solving technical problems and reviewing implementation approaches.',
    url: 'https://stackoverflow.com/',
    memberCount: '10M+ members',
  },
  {
    name: 'Kubernetes Slack Workspace',
    platform: 'Slack',
    description: 'Official Slack community for Kubernetes developers and operators worldwide.',
    url: 'https://slack.k8s.io/',
    memberCount: '150k+ members',
  },
];

export default function CommunityLinksPage() {
  const { user } = useProtectedPage();
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
      .then((data) => setEnrollments(data || []))
      .finally(() => setLoading(false));
  }, []);

  const careerTracks = useMemo<CareerTrack[]>(() => buildCareerTracks(enrollments), [enrollments]);

  const selectedTrack = useMemo(() => {
    if (selectedCourseId === 'all') {
      const communities = careerTracks
        .flatMap((track) => track.communities)
        .filter((community, index, all) => all.findIndex((candidate) => candidate.name === community.name) === index);

      return {
        courseTitle: 'All Enrolled Paths',
        communities,
      };
    }

    return careerTracks.find((track) => track.courseId === selectedCourseId) ?? null;
  }, [careerTracks, selectedCourseId]);

  const communityCards = useMemo(() => {
    const baseCards = selectedTrack?.communities?.length ? selectedTrack.communities : FALLBACK_COMMUNITIES;
    if (!searchTerm.trim()) {
      return baseCards;
    }

    const term = searchTerm.toLowerCase();
    return baseCards.filter(
      (community) =>
        community.name.toLowerCase().includes(term) ||
        community.description.toLowerCase().includes(term) ||
        community.platform.toLowerCase().includes(term),
    );
  }, [searchTerm, selectedTrack]);

  if (loading) {
    return (
      <DashboardLayout role={user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 font-medium text-[var(--color-text-main)]/60">Loading communities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'}>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                <Users className="h-3.5 w-3.5" /> Community
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-heading)] md:text-[2.6rem]">
                Community
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-main)]/80">
                Slack, Reddit, Discord, and forum spaces for your current learning path.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-3 text-sm font-bold text-[var(--text-heading)]">
              <Globe className="h-4 w-4 text-brand-500" />
              {selectedTrack?.courseTitle ?? 'General communities'}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-heading)]">
            <Compass className="h-4 w-4 text-brand-500" />
            Filter by course focus
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourseId('all')}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                selectedCourseId === 'all'
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--color-text-main)]/80'
              }`}
            >
              All Paths ({enrollments.length})
            </button>
            {enrollments.map((enrollment) => (
              <button
                key={enrollment.course.id}
                onClick={() => setSelectedCourseId(enrollment.course.id)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                  selectedCourseId === enrollment.course.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--color-text-main)]/80'
                }`}
              >
                {enrollment.course.title}
              </button>
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="absolute left-0 top-0 -ml-8 -mt-8 h-24 w-24 rounded-full bg-brand-500/5 blur-2xl pointer-events-none" />
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Communities</h2>
              <p className="text-xs text-[var(--color-text-main)]/50">Slack, Reddit, Discord, and forum groups matched to your track.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search communities..."
                className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] py-2 pl-9 pr-4 text-xs font-medium text-[var(--text-heading)] outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {communityCards.map((community) => (
              <article
                key={community.name}
                className="rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-5 shadow-sm transition hover:border-brand-500/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">
                    {community.platform}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--color-text-main)]/50">
                    {community.memberCount}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-heading)]">{community.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-main)]/75">{community.description}</p>
                <a
                  href={community.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-600"
                >
                  Open community
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
