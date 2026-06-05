'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { CourseCard } from '@/components/CourseCard';
import { SkeletonCourseCard } from '@/components/SkeletonCourseCard';
import { getCategories, getCourses } from '@/lib/api';
import { Category, Course } from '@/types';
import { ChevronDown, Filter, Search, Sparkles, SlidersHorizontal } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedLevel, setSelectedLevel] = useState<string | null>(searchParams.get('level'));
  const [sortBy, setSortBy] = useState('popular');

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
      getCategories(),
    ])
      .then(([nextCourses, nextCategories]) => {
        setCourses(nextCourses);
        setCategories(nextCategories);
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

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

  return (
    <Layout>
      <div className="mx-4 md:mx-8 mb-4">
        <div className="glass-dark bg-brand-950/80 p-16 md:p-24 text-white text-center rounded-[3rem] mt-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 drop-shadow-md text-white">Browse Our Catalog</h1>
            <p className="text-brand-100/80 max-w-2xl mx-auto font-medium text-lg">Explore live courses, structured modules, and real enrollment-ready checkout flows.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 px-4 py-8 md:px-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="w-full shrink-0 xl:w-[300px]">
          <div className="sticky top-32 overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.94)_100%)] p-6 pb-8 shadow-[0_18px_45px_rgba(84,107,153,0.14)]">
            <div className="absolute right-[-40px] top-[-30px] h-28 w-28 rounded-full bg-brand-500/10 blur-2xl" />
            <div className="relative mb-6 border-b border-[var(--color-text-heading)]/8 pb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
                <Sparkles className="h-3.5 w-3.5" /> Refine Results
              </div>
              <div className="mt-4 flex items-center gap-2 text-xl font-black text-[var(--color-text-heading)]">
                <Filter className="h-5 w-5" /> Premium Filters
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-text-main)]/65">
                Narrow the catalog to the right difficulty, topic, and learning pace.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 flex items-center justify-between text-base font-black text-[var(--color-text-heading)]">
                Category <ChevronDown className="w-4 h-4 text-[var(--color-text-main)]/50" />
              </h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label key={category.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition-all ${
                    selectedCategory === category.slug
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-[var(--glass-border)] bg-white/55 hover:bg-white'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedCategory === category.slug}
                      onChange={() => setSelectedCategory((current) => (current === category.slug ? null : category.slug))}
                      className="w-5 h-5 rounded-lg border-2 border-[var(--color-text-main)]/20 text-brand-500 focus:ring-brand-500/30 transition-all cursor-pointer"
                    />
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[var(--color-text-main)]/78">{category.name}</span>
                      <span className="rounded-full bg-[var(--glass-bg)] px-2.5 py-1 text-[11px] font-black text-[var(--color-text-main)]/55">
                        {category.coursesCount}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-4 flex items-center justify-between text-base font-black text-[var(--color-text-heading)]">
                Level <ChevronDown className="w-4 h-4 text-[var(--color-text-main)]/50" />
              </h3>
              <div className="space-y-3">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <label key={level} className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition-all ${
                    selectedLevel === level
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-[var(--glass-border)] bg-white/55 hover:bg-white'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedLevel === level}
                      onChange={() => setSelectedLevel((current) => (current === level ? null : level))}
                      className="w-5 h-5 rounded-lg border-2 border-[var(--color-text-main)]/20 text-brand-500 focus:ring-brand-500/30 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[var(--color-text-main)]/78">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleSearchSubmit} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 font-black text-white shadow-[0_14px_30px_rgba(var(--brand-500-rgb,59,130,246),0.22)]">
              <SlidersHorizontal className="h-4 w-4" /> Apply Filters
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.94)_100%)] p-5 shadow-[0_18px_45px_rgba(84,107,153,0.14)] sm:flex-row sm:items-center sm:justify-between">
            <div className="px-2">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-600">Curated Catalog</div>
              <h2 className="mt-2 text-3xl font-display font-black text-[var(--color-text-heading)]">{isLoading ? '...' : sortedCourses.length} Courses</h2>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                <Search className="w-5 h-5 text-[var(--color-text-main)]/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="clay-input !w-full !pl-11 !pr-4 !py-3"
                />
              </form>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--color-text-main)]/60 hidden md:block">Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="clay-input !py-3 font-bold !px-4 cursor-pointer bg-white/75">
                  <option value="popular">Most Popular</option>
                  <option value="highest_rated">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCourseCard key={i} index={i} />)}
            </div>
          ) : sortedCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedCourses.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-24 clay flex flex-col items-center">
              <div className="w-20 h-20 bg-white shadow-inner rounded-[18px] flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-brand-300" />
              </div>
              <h3 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-3">No courses found</h3>
              <p className="text-[var(--color-text-main)]/60 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedLevel(null);
                  router.replace('/courses');
                }}
                className="mt-8 clay-btn px-8 py-3 font-bold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
