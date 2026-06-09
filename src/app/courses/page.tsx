'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CourseCard } from '@/components/CourseCard';
import { SkeletonCourseCard } from '@/components/SkeletonCourseCard';
import { getCourses } from '@/lib/api';
import { Course } from '@/types';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function CourseListing() {
  return (
    <Suspense fallback={<div>Loading courses...</div>}>
      <CourseListingInner />
    </Suspense>
  );
}

function CourseListingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedLevel, setSelectedLevel] = useState<string | null>(searchParams.get('level'));
  const [sortBy, setSortBy] = useState('popular');
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category'));
    setSelectedLevel(searchParams.get('level'));
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getCourses({
        q: searchParams.get('q') || undefined,
        category: searchParams.get('category') || undefined,
        level: searchParams.get('level') || undefined,
      }),
    ])
      .then(([nextCourses]) => {
        setCourses(nextCourses);
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  useEffect(() => {
    const slides = 3;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % slides);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set('q', searchQuery);
    else params.delete('q');
    if (selectedCategory) params.set('category', selectedCategory);
    else params.delete('category');
    if (selectedLevel) params.set('level', selectedLevel);
    else params.delete('level');
    router.replace(`?${params.toString()}`);
  };

  const sortedCourses = useMemo(() => {
    const nextCourses = [...courses];
    if (sortBy === 'highest_rated') {
      nextCourses.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      nextCourses.sort((a, b) => b.id.localeCompare(a.id));
    } else {
      nextCourses.sort((a, b) => b.students - a.students);
    }
    return nextCourses;
  }, [courses, sortBy]);

  const filteredCourses = useMemo(() => {
    let nextCourses = [...sortedCourses];

    if (selectedCategory) {
      nextCourses = nextCourses.filter((course) => course.categorySlug === selectedCategory);
    }

    if (selectedLevel) {
      nextCourses = nextCourses.filter((course) => course.level === selectedLevel);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextCourses = nextCourses.filter((course) =>
        [course.title, course.description, course.summary, course.category, course.level]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      );
    }

    return nextCourses;
  }, [searchQuery, selectedCategory, selectedLevel, sortedCourses]);

  const visibleCourses = useMemo(() => {
    return filteredCourses;
  }, [filteredCourses]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--color-text-main)] font-sans selection:bg-brand-500/30 selection:text-[var(--text-heading)] transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--surface-border)] bg-[var(--surface-card-soft)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="text-lg font-black tracking-tight text-[var(--text-heading)] md:text-xl flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]">CF</span>
              <span>CourseForge</span>
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="/courses" className="border-b-2 border-brand-500 py-4 text-sm font-bold text-brand-500">
                Catalog
              </Link>
              <Link href="/dashboard" className="py-4 text-sm font-medium text-[var(--color-text-main)]/70 hover:text-[var(--text-heading)] transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <form onSubmit={handleSearchSubmit} className="hidden w-[260px] items-center md:flex">
              <div className="flex w-full items-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)]/50 px-4 py-2 focus-within:border-brand-500/50 transition-all duration-300">
                <Search className="h-4 w-4 text-[var(--color-text-main)]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn?"
                  className="w-full bg-transparent pl-3 text-sm text-[var(--text-heading)] outline-none placeholder:text-[var(--color-text-main)]/45"
                />
              </div>
            </form>
            <button aria-label="notifications" className="hidden text-[var(--color-text-main)]/70 hover:text-[var(--text-heading)] transition-colors md:block">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <ThemeSwitcher />
            <div className="flex items-center gap-2 border-l border-[var(--surface-border)] pl-4">
              <img
                alt={user?.name || 'User'}
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'}
                className="h-8 w-8 rounded-full object-cover border border-[var(--surface-border)]"
              />
              <span className="hidden text-sm font-semibold text-[var(--text-heading)]/90 sm:block">{user?.name || 'John Doe'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1560px] px-4 pb-24 pt-8 md:px-6">
        {/* Featured Path Slideshow Banner */}
        <section className="mb-12">
          <div className="relative h-[420px] overflow-hidden rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-2xl">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${heroSlide * 100}%)` }}
            >
              {[
                {
                  image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                  title: 'Cloud Architecture',
                  text: 'Design deployment systems with clarity, resilience, and production-grade delivery patterns.',
                },
                {
                  image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                  title: 'AI Engineering',
                  text: 'Build practical AI workflows, LLM applications, and intelligent products that ship.',
                },
                {
                  image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1206&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                  title: 'Modern Product Teams',
                  text: 'Learn the systems, collaboration, and delivery cadence behind strong engineering organizations.',
                },
              ].map((slide) => (
                <div key={slide.title} className="relative h-full min-w-full overflow-hidden">
                  <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)]/90 via-[var(--bg-main)]/40 to-transparent" />
                  <div className="absolute inset-0 flex items-end p-8 md:p-12">
                    <div className="max-w-xl text-white">
                      <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.28em] text-brand-500">
                        Featured path
                      </div>
                      <h3 className="text-3xl font-extrabold tracking-tight md:text-5xl mb-4 text-[var(--text-heading)]">{slide.title}</h3>
                      <p className="max-w-lg text-sm leading-relaxed text-[var(--color-text-main)]/80 md:text-base">
                        {slide.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setHeroSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    heroSlide === index ? 'w-10 bg-brand-500' : 'bg-[var(--color-text-main)]/30 hover:bg-[var(--color-text-main)]/60 w-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Sort and Filter controls */}
        <div className="flex items-center justify-between border-y border-[var(--surface-border)] py-4 text-sm text-[var(--color-text-main)]/60 mb-8">
          <div className="text-sm font-medium text-[var(--color-text-main)]/60">
            Showing <span className="text-[var(--text-heading)] font-black">{visibleCourses.length}</span> course{visibleCourses.length !== 1 ? 's' : ''}
          </div>
          <label className="flex items-center gap-3">
            <span className="font-bold text-[var(--color-text-main)]/80">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-2 text-sm font-bold text-[var(--text-heading)] shadow-sm outline-none focus:border-brand-500 transition-colors"
            >
              <option value="popular">Most Popular</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {/* Grid Collections */}
        <div className="space-y-20 py-4">
          {isLoading ? (
            <div className="space-y-20">
              {[1, 2, 3].map((sectionIndex) => (
                <section key={sectionIndex} className="space-y-6">
                  <div>
                    <div className="h-8 w-44 rounded bg-[var(--surface-border)] animate-pulse" />
                    <div className="mt-2 h-4 w-60 rounded bg-[var(--surface-border)]/50 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonCourseCard key={`${sectionIndex}-${i}`} index={i} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : visibleCourses.length > 0 ? (
            <>
              {(() => {
                const trending = [...visibleCourses].sort((a, b) => b.students - a.students).slice(0, 4);
                const trendingIds = new Set(trending.map((course) => course.id));
                const curated = visibleCourses.filter((course) => !trendingIds.has(course.id)).slice(0, 4);
                const curatedIds = new Set([...trendingIds, ...curated.map((course) => course.id)]);
                const newReleases = [...visibleCourses].sort((a, b) => b.id.localeCompare(a.id)).filter((course) => !curatedIds.has(course.id)).slice(0, 4);

                const sections = [
                  {
                    title: 'Trending Now',
                    subtitle: 'Most active courses this week.',
                    courses: trending,
                  },
                  {
                    title: 'Curated Learning Paths',
                    subtitle: 'Sequenced collections to take you from zero to expert.',
                    courses: curated.length > 0 ? curated : visibleCourses.slice(0, 4),
                  },
                  {
                    title: 'New Releases',
                    subtitle: 'Freshly minted content from industry experts.',
                    courses: newReleases.length > 0 ? newReleases : [...visibleCourses].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4),
                  },
                ];

                return sections.map((section) => (
                  <section key={section.title} className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[var(--text-heading)]">{section.title}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-main)]/70">{section.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {section.courses.map((course, i) => (
                        <CourseCard key={course.id} course={course} index={i} />
                      ))}
                    </div>
                  </section>
                ));
              })()}
            </>
          ) : (
            <div className="py-24 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[18px] bg-[var(--surface-card-soft)] border border-[var(--surface-border)] shadow-inner">
                <Search className="h-10 w-10 text-[var(--color-text-main)]/50" />
              </div>
              <h3 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-heading)]">No courses found</h3>
              <p className="font-medium text-[var(--color-text-main)]/70">Try adjusting your search to find what you&apos;re looking for.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedLevel(null);
                  router.replace('/courses');
                }}
                className="mt-8 rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-soft)] px-8 py-3 font-bold text-[var(--text-heading)] shadow-sm transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 py-16">
        <div className="mx-auto grid max-w-[1560px] grid-cols-2 gap-8 px-4 md:grid-cols-4 md:px-6">
          <div className="col-span-2 space-y-6 md:col-span-1">
            <div className="text-xl font-black tracking-tight text-[var(--text-heading)] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]">CF</span>
              <span>CourseForge</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-main)]/70 font-medium">
              World-class learning for anyone, anywhere. Build your skills with live courses, structured projects, and certificates.
            </p>
            <div className="flex gap-3 text-[var(--color-text-main)]/55">
              <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-strong)] hover:text-[var(--text-heading)] transition-colors cursor-pointer p-2 flex items-center justify-center w-8 h-8">↗</span>
              <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-strong)] hover:text-[var(--text-heading)] transition-colors cursor-pointer p-2 flex items-center justify-center w-8 h-8">✉</span>
              <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-strong)] hover:text-[var(--text-heading)] transition-colors cursor-pointer p-2 flex items-center justify-center w-8 h-8">◎</span>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-brand-500">Platform</h4>
            <div className="space-y-3.5 text-sm text-[var(--color-text-main)]/70 font-semibold">
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Browse Catalog</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Dashboard</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Settings</div>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-brand-500">Roles</h4>
            <div className="space-y-3.5 text-sm text-[var(--color-text-main)]/70 font-semibold">
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Students</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Instructors</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Platform Admins</div>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-brand-500">Account</h4>
            <div className="space-y-3.5 text-sm text-[var(--color-text-main)]/70 font-semibold">
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Sign Out</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Help Center</div>
              <div className="hover:text-[var(--text-heading)] transition-colors cursor-pointer">Privacy Policy</div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[1560px] border-t border-[var(--surface-border)] px-4 pt-8 text-center text-sm text-[var(--color-text-main)]/45 md:px-6">
          © 2026 CourseForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
