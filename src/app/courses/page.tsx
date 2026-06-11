'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CourseCard } from '@/components/CourseCard';
import { SkeletonCourseCard } from '@/components/SkeletonCourseCard';
import { getCourses, getCategories } from '@/lib/api';
import { Course, Category } from '@/types';
import { Bell, Search, Compass, Flame, BookOpen, Layers, Code, TrendingUp, Globe, Atom } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const TOP_LEVEL_CATEGORIES = [
  { id: 'tech', name: 'Tech', icon: Code },
  { id: 'business', name: 'Business', icon: TrendingUp },
  { id: 'languages', name: 'Languages', icon: Globe },
  { id: 'science-math', name: 'Science & Math', icon: Atom },
];

const CATEGORY_TO_TOP_LEVEL_MAP: Record<string, string> = {
  // Tech
  'software-development': 'tech',
  'cloud-engineering': 'tech',
  'devops-cicd': 'tech',
  'cybersecurity': 'tech',
  'data-science': 'tech',
  'ai-and-ml': 'tech',
  'llm-engineering': 'tech',
  'machine-learning': 'tech',
  'cloud-architecture': 'tech',
  'computer-science': 'tech',
  'software-engineering': 'tech',
  'backend-development': 'tech',
  'frontend-development': 'tech',
  'full-stack-development': 'tech',
  'mobile-development': 'tech',
  'devops': 'tech',
  'system-design': 'tech',
  'algorithms-data-structures': 'tech',
  'computer-networks': 'tech',
  'databases': 'tech',
  'operating-systems': 'tech',
  'site-reliability-engineering': 'tech',
  'testing-quality-assurance': 'tech',

  // Business
  'business-entrepreneurship': 'business',
  'digital-marketing': 'business',
  'business-communication': 'business',
  'ui-ux-design': 'business',
  'product-analytics': 'business',
  'product-strategy': 'business',
  'business': 'business',
  'entrepreneurship': 'business',
  'product-management': 'business',
  'business-analysis': 'business',

  // Languages
  'language-learning': 'languages',

  // Science & Math
  'science-mathematics': 'science-math',
};

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTopLevel, setSelectedTopLevel] = useState<string | null>(searchParams.get('subject'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedLevel, setSelectedLevel] = useState<string | null>(searchParams.get('level'));
  const [sortBy, setSortBy] = useState('popular');
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category'));
    setSelectedLevel(searchParams.get('level'));
    setSelectedTopLevel(searchParams.get('subject'));
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getCourses({
        q: searchParams.get('q') || undefined,
        level: searchParams.get('level') || undefined,
      }),
      getCategories(),
    ])
      .then(([nextCourses, nextCategories]) => {
        setCourses(nextCourses);
        setCategories(nextCategories);
      })
      .finally(() => setIsLoading(false));
  }, [searchParams.get('q'), searchParams.get('level')]);

  useEffect(() => {
    const slides = 3;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % slides);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const handleCategoryClick = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory === categorySlug) {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
      const topLevel = CATEGORY_TO_TOP_LEVEL_MAP[categorySlug];
      if (topLevel) params.set('subject', topLevel);
    }
    router.replace(`?${params.toString()}`);
  };

  const handleLevelClick = (levelValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (levelValue === null) {
      params.delete('level');
    } else {
      params.set('level', levelValue);
    }
    router.replace(`?${params.toString()}`);
  };

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('level');
    params.delete('q');
    params.delete('subject');
    setSearchQuery('');
    router.replace(`?${params.toString()}`);
  };

  const handleShowCourses = (subjectId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('subject', subjectId);
    router.replace(`?${params.toString()}`);
  };

  const handleBackToSubjects = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('subject');
    params.delete('category');
    router.replace(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set('q', searchQuery);
    else params.delete('q');
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
    } else if (selectedTopLevel) {
      nextCourses = nextCourses.filter((course) => {
        const topLevel = CATEGORY_TO_TOP_LEVEL_MAP[course.categorySlug || ''] || 'tech';
        return topLevel === selectedTopLevel;
      });
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
  }, [searchQuery, selectedCategory, selectedTopLevel, selectedLevel, sortedCourses]);

  const visibleCourses = useMemo(() => {
    return filteredCourses;
  }, [filteredCourses]);

  const coursesByTopLevel = useMemo(() => {
    const groups: Record<string, Course[]> = {
      tech: [],
      business: [],
      languages: [],
      'science-math': [],
    };

    sortedCourses.forEach((course) => {
      const topLevel = CATEGORY_TO_TOP_LEVEL_MAP[course.categorySlug || ''] || 'tech';
      if (groups[topLevel]) {
        groups[topLevel].push(course);
      } else {
        groups.tech.push(course);
      }
    });

    return groups;
  }, [sortedCourses]);

  const isFiltered = !!(selectedTopLevel || selectedCategory || selectedLevel || searchQuery.trim());

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
        {/* If filtered, we don't show the big slideshow banner */}
        {!isFiltered && (
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
                    {/* Fixed dark slate gradient overlay to ensure readability in all themes */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
                    <div className="absolute inset-0 flex items-end p-8 md:p-12">
                      <div className="max-w-xl text-white">
                        <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.28em] text-brand-400">
                          Featured path
                        </div>
                        <h3 className="text-3xl font-extrabold tracking-tight md:text-5xl mb-4 text-white">{slide.title}</h3>
                        <p className="max-w-lg text-sm leading-relaxed text-slate-200/90 md:text-base">
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
        )}

        {isFiltered ? (
          /* 2-Column Layout for Search / Subject / Filter Mode */
          <div>
            {(selectedTopLevel || selectedCategory) && (
              <button
                type="button"
                onClick={handleBackToSubjects}
                className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-500 hover:text-brand-600 transition-colors"
              >
                ← Back to all subjects
              </button>
            )}

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-2">
              {/* Left Column: Sidebar Filters */}
              <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-6 md:sticky md:top-24 h-fit">
                {/* Category / Subject Filter */}
                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-heading)] mb-4 pb-2 border-b border-[var(--surface-border)]">
                    Subject
                  </h3>
                  <div className="space-y-5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                    {/* Tech group */}
                    <div>
                      <h4 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-2">Tech</h4>
                      <div className="space-y-1.5 pl-1.5">
                        {categories
                          .filter(cat => cat.coursesCount > 0 && CATEGORY_TO_TOP_LEVEL_MAP[cat.slug] === 'tech')
                          .map(cat => {
                            const isActive = selectedCategory === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`flex w-full items-center justify-between py-1 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'text-brand-500 font-extrabold'
                                    : 'text-[var(--color-text-main)]/80 hover:text-[var(--text-heading)]'
                                }`}
                              >
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-[var(--surface-card-soft)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] font-medium text-[var(--color-text-main)]/50">
                                  {cat.coursesCount}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Business group */}
                    <div>
                      <h4 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-2">Business</h4>
                      <div className="space-y-1.5 pl-1.5">
                        {categories
                          .filter(cat => cat.coursesCount > 0 && CATEGORY_TO_TOP_LEVEL_MAP[cat.slug] === 'business')
                          .map(cat => {
                            const isActive = selectedCategory === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`flex w-full items-center justify-between py-1 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'text-brand-500 font-extrabold'
                                    : 'text-[var(--color-text-main)]/80 hover:text-[var(--text-heading)]'
                                }`}
                              >
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-[var(--surface-card-soft)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] font-medium text-[var(--color-text-main)]/50">
                                  {cat.coursesCount}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Science & Math group */}
                    <div>
                      <h4 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-2">Science & Math</h4>
                      <div className="space-y-1.5 pl-1.5">
                        {categories
                          .filter(cat => cat.coursesCount > 0 && CATEGORY_TO_TOP_LEVEL_MAP[cat.slug] === 'science-math')
                          .map(cat => {
                            const isActive = selectedCategory === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`flex w-full items-center justify-between py-1 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'text-brand-500 font-extrabold'
                                    : 'text-[var(--color-text-main)]/80 hover:text-[var(--text-heading)]'
                                }`}
                              >
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-[var(--surface-card-soft)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] font-medium text-[var(--color-text-main)]/50">
                                  {cat.coursesCount}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Languages group */}
                    <div>
                      <h4 className="text-xs font-black text-brand-500 uppercase tracking-widest mb-2">Languages</h4>
                      <div className="space-y-1.5 pl-1.5">
                        {categories
                          .filter(cat => cat.coursesCount > 0 && CATEGORY_TO_TOP_LEVEL_MAP[cat.slug] === 'languages')
                          .map(cat => {
                            const isActive = selectedCategory === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`flex w-full items-center justify-between py-1 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'text-brand-500 font-extrabold'
                                    : 'text-[var(--color-text-main)]/80 hover:text-[var(--text-heading)]'
                                }`}
                              >
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-[var(--surface-card-soft)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] font-medium text-[var(--color-text-main)]/50">
                                  {cat.coursesCount}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Level Filter */}
                <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-heading)] mb-4 pb-2 border-b border-[var(--surface-border)]">
                    Difficulty Level
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'All Levels', value: null },
                      { label: 'Beginner', value: 'beginner' },
                      { label: 'Intermediate', value: 'intermediate' },
                      { label: 'Advanced', value: 'advanced' },
                    ].map((lvl) => {
                      const isActive = selectedLevel === lvl.value;
                      return (
                        <button
                          key={lvl.label}
                          type="button"
                          onClick={() => handleLevelClick(lvl.value)}
                          className={`flex w-full items-center gap-2.5 py-1 text-left text-xs transition-colors ${
                            isActive
                              ? 'text-brand-500 font-extrabold'
                              : 'text-[var(--color-text-main)]/85 hover:text-[var(--text-heading)]'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                            isActive
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-[var(--surface-border)] bg-[var(--surface-card-soft)]'
                          }`}>
                            {isActive && (
                              <svg className="h-2.5 w-2.5 stroke-[3.5] stroke-current fill-none" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span>{lvl.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Right Column: Catalog List */}
              <div className="flex-1 space-y-6">
                {/* Search, Sort and Filter controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-border)] pb-4 text-sm text-[var(--color-text-main)]/60 gap-4">
                  <div className="text-sm font-medium text-[var(--color-text-main)]/60">
                    Showing <span className="text-[var(--text-heading)] font-black">{visibleCourses.length}</span> course{visibleCourses.length !== 1 ? 's' : ''}
                    {selectedCategory ? (
                      <>
                        {' '}
                        in <span className="text-brand-500 font-extrabold">{categories.find(c => c.slug === selectedCategory)?.name}</span>
                      </>
                    ) : selectedTopLevel ? (
                      <>
                        {' '}
                        in <span className="text-brand-500 font-extrabold">{TOP_LEVEL_CATEGORIES.find(t => t.id === selectedTopLevel)?.name}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    {(selectedCategory || selectedLevel || searchQuery || selectedTopLevel) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-wider"
                      >
                        Clear Filters
                      </button>
                    )}
                    <label className="flex items-center gap-3">
                      <span className="font-bold text-[var(--color-text-main)]/80">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-2 text-sm font-bold text-[var(--text-heading)] shadow-sm outline-none focus:border-brand-500 transition-colors cursor-pointer"
                      >
                        <option value="popular">Most Popular</option>
                        <option value="highest_rated">Highest Rated</option>
                        <option value="newest">Newest</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Grid Collections */}
                <div className="py-2">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCourseCard key={i} index={i} />
                      ))}
                    </div>
                  ) : visibleCourses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 animate-fadeIn">
                      {visibleCourses.map((course, i) => (
                        <CourseCard key={course.id} course={course} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[18px] bg-[var(--surface-card-soft)] border border-[var(--surface-border)] shadow-inner">
                        <BookOpen className="h-10 w-10 text-[var(--color-text-main)]/35" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight text-[var(--text-heading)]">No courses found</h3>
                      <p className="mt-2 text-sm text-[var(--color-text-main)]/65 max-w-sm mx-auto">
                        Try adjusting your search query, difficulty filters, or clear active category selections.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Landing Page Mode: Stacks of Sections (Tech, Business, Science & Math, Languages) */
          <div className="space-y-16">
            {TOP_LEVEL_CATEGORIES.map((subject) => {
              const subjectCourses = coursesByTopLevel[subject.id] || [];
              if (subjectCourses.length === 0) return null;

              // Show only the first 4 courses in the landing page section
              const featuredCourses = subjectCourses.slice(0, 4);

              return (
                <section key={subject.id} className="space-y-6">
                  {/* Section Title */}
                  <div className="border-b border-[var(--surface-border)] pb-4 flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight text-[var(--text-heading)]">
                        {subject.name} Courses
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-text-main)]/60 font-medium">
                        Explore our world-class courses in {subject.name}.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-main)]/50 bg-[var(--surface-card-soft)] px-2.5 py-1 rounded border border-[var(--surface-border)]">
                      {subjectCourses.length} {subjectCourses.length === 1 ? 'course' : 'courses'}
                    </span>
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {featuredCourses.map((course, i) => (
                      <CourseCard key={course.id} course={course} index={i} />
                    ))}
                  </div>

                  {/* Show Classes / Show Courses Link */}
                  {subjectCourses.length > 4 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowCourses(subject.id)}
                        className="text-xs font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 transition-colors inline-flex items-center gap-1 hover:underline text-left"
                      >
                        Show all {subject.name} courses →
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
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
