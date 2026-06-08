'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe,
  Lock,
  Megaphone,
  PlayCircle,
  Search,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createCourseReview, getCourse, getCourseAnnouncements, getEnrollmentByCourse } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { formatINRFromRupees } from '@/lib/currency';
import { Course } from '@/types';
import type { LucideIcon } from 'lucide-react';

type ReviewForm = {
  rating: number;
  comment: string;
};

type LearnBlock = {
  title: string;
  body: string;
  icon: LucideIcon;
};

function formatPrice(price: number) {
  if (price === 0) return 'Free';
  return formatINRFromRupees(price);
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, signOut, dashboardPath } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCourse(id)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));

    getCourseAnnouncements(id).then(setAnnouncements).catch(() => setAnnouncements([]));
  }, [id]);

  useEffect(() => {
    if (!id) {
      setEnrollment(null);
      return;
    }

    const session = readSession();
    if (!session?.accessToken) {
      setEnrollment(null);
      return;
    }

    // PERF: fetch enrollment state as soon as a token is available, without waiting for auth state.
    getEnrollmentByCourse(id)
      .then(setEnrollment)
      .catch(() => setEnrollment(null));
  }, [id]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleEnroll = () => {
    if (!course) return;
    if (!user) {
      addToast('Please sign in to continue to checkout.', 'info');
      router.push(`/login?redirect=/checkout/${course.id}`);
      return;
    }
    if (user.role === 'STUDENT' && enrollment) {
      const firstLessonId = enrollment.course.modules[0]?.lessons[0]?.id;
      if (firstLessonId) {
        router.push(`/course/${course.id}/lesson/${firstLessonId}`);
        return;
      }
      router.push('/dashboard/student');
      return;
    }
    router.push(`/checkout/${course.id}`);
  };

  const learnBlocks = useMemo<LearnBlock[]>(() => {
    if (!course) return [];
    const outcomes = course.outcomes.length > 0 ? course.outcomes : [course.summary ?? course.description];
    return [
      { title: 'Delivery Mindset', body: outcomes[0] ?? outcomes[0 % outcomes.length], icon: Sparkles },
      { title: 'Environment Promotion Models', body: outcomes[1] ?? outcomes[1 % outcomes.length], icon: CheckCircle2 },
      { title: 'Release Automation', body: outcomes[2] ?? outcomes[2 % outcomes.length], icon: BookOpen },
      { title: 'Rollback Planning', body: outcomes[3] ?? outcomes[3 % outcomes.length], icon: Award },
    ];
  }, [course]);

  const totalLessons = course?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0;

  return (
      <div className="min-h-screen bg-[#f6fafe] text-slate-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-12">
              <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-indigo-700 md:text-2xl">
                CourseForge
              </Link>

              <div className="hidden gap-8 md:flex">
                <Link href="/courses" className="border-b-2 border-indigo-600 py-2 font-semibold text-indigo-700 transition">
                  Courses
                </Link>
                {user ? (
                  <Link href={dashboardPath} className="py-2 text-slate-500 transition hover:text-indigo-700">
                    My Learning
                  </Link>
                ) : (
                  <span className="py-2 text-slate-500">My Learning</span>
                )}
                <span className="py-2 text-slate-500">Resources</span>
                <span className="py-2 text-slate-500">Community</span>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <form onSubmit={handleSearch} className="hidden items-center gap-2 rounded-full bg-[#f0f4f8] px-4 py-2 shadow-inner lg:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search courses..."
                  className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </form>

              <button className="text-slate-500 transition hover:text-indigo-700" aria-label="notifications">
                <Megaphone className="h-5 w-5" />
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      alt={user.name}
                      src={user.avatar}
                      className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-sm font-semibold text-white shadow-sm">
                      {user.initials}
                    </div>
                  )}
                  <button
                    onClick={() => signOut().then(() => router.push('/'))}
                    className="hidden font-semibold text-slate-700 transition hover:text-indigo-700 sm:block"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="font-semibold text-slate-700 transition hover:text-indigo-700">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main>
          {loading ? (
            <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
              <div className="h-[560px] rounded-[28px] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.06)]" />
            </div>
          ) : course ? (
            <>
              {/* Hero Section */}
              <header className="mx-auto max-w-7xl overflow-hidden px-4 pb-24 pt-12 md:px-6 lg:px-8">
                <div className="relative flex flex-col items-center gap-12 overflow-hidden rounded-[24px] bg-white p-6 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)] md:p-8 lg:flex-row lg:items-center lg:gap-12 lg:p-12">
                  <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />

                  <div className="z-10 flex-1 space-y-8">
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full bg-[#e1e0ff] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#07006c]">
                        {course.category}
                      </span>
                      <span className="rounded-full bg-[#7cf8dd] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#007261]">
                        {course.level}
                      </span>
                    </div>

                    <div className="max-w-2xl space-y-5">
                      <h1 className="font-headline text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
                        {course.title}
                      </h1>
                      <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                        {course.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 rounded-xl bg-[#f0f4f8] px-4 py-2 shadow-inner">
                        <Star className="h-4 w-4 text-indigo-600" />
                        <span className="font-bold text-slate-900">{course.reviews} reviews</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-[#f0f4f8] px-4 py-2 shadow-inner">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold uppercase text-slate-900">{course.language?.toUpperCase() ?? 'EN'}</span>
                      </div>
                    </div>

                    <div className="flex w-fit items-center gap-4 rounded-2xl border border-white/40 bg-white/50 p-3 shadow-sm backdrop-blur-sm">
                      <img
                        alt={course.instructor.name}
                        src={course.instructor.avatar}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{course.instructor.name}</p>
                        <p className="text-sm text-slate-500">{course.instructor.headline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="z-10 w-full md:w-1/3">
                    <div className="rounded-[24px] bg-white p-8 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                      <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-inner">
                        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/20">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md">
                            <PlayCircle className="h-8 w-8 fill-current" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleEnroll}
                        className="mb-4 w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white transition hover:bg-indigo-700 active:scale-[0.96]"
                      >
                        {enrollment ? 'Resume Learning' : 'Get Started'}
                      </button>

                      <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        30-day money back guarantee
                      </p>

                      <div className="mt-6 rounded-2xl bg-[#f6fafe] p-4">
                        <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Price</div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">
                          {enrollment ? 'Enrolled' : formatPrice(course.price)}
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                            {course.modules.length} modules • {totalLessons} lessons
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-indigo-600" />
                            Certificate of completion
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-indigo-600" />
                            Full lifetime access
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Mid Banner */}
<section className="relative z-10 w-full pb-24 -mt-12">
    <div className="relative h-[420px] w-[80%] mx-auto overflow-hidden rounded-[40px] border border-white/20 shadow-2xl">
                  <img
                    alt={`${course.title} banner`}
                    src={course.thumbnail}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-sm" />
                  <div className="absolute inset-0 flex items-center justify-center px-4">
                    <div className="max-w-xl rounded-[24px] bg-white/80 px-8 py-6 text-center shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)] backdrop-blur-md">
                      <h3 className="mb-3 text-lg font-semibold text-indigo-600">Learn from the Best</h3>
                      <p className="text-base leading-7 text-slate-600">
                        Our curriculum is built by industry veterans who have scaled systems for millions of users.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mx-auto max-w-7xl space-y-24 px-4 pb-32 md:px-6 lg:px-8">
                {/* What You'll Learn */}
                <section>
                  <h2 className="mb-8 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <span className="h-8 w-2 rounded-full bg-indigo-600" />
                    What you&apos;ll learn
                  </h2>

                  <div className="relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)] md:p-10">
                    <div className="absolute right-[-5%] bottom-[-10%] opacity-5">
                      <CheckCircle2 className="h-[240px] w-[240px]" />
                    </div>
                    <div className="grid gap-8 md:grid-cols-2">
                      {learnBlocks.map((block) => {
                        const Icon = block.icon;
                        return (
                          <div key={block.title} className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e1e0ff]">
                              <Icon className="h-5 w-5 text-indigo-700" />
                            </div>
                            <div>
                              <h3 className="mb-1 text-base font-bold text-slate-900">{block.title}</h3>
                              <p className="text-sm leading-6 text-slate-500">{block.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Technical Depth */}
                <section className="grid items-center gap-12 md:grid-cols-2">
                  <div className="space-y-6">
                    <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                      <span className="h-8 w-2 rounded-full bg-indigo-400" />
                      Technical Depth
                    </h2>
                    <p className="text-base leading-7 text-slate-600">
                      {course.description} Our curriculum is designed to mirror the actual environments used by top-tier engineering teams.
                    </p>
                    <ul className="space-y-4">
                      {(course.outcomes.length > 0 ? course.outcomes.slice(0, 2) : [course.description]).map((outcome) => (
                        <li key={outcome} className="flex items-center gap-3 font-medium text-slate-800">
                          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="overflow-hidden rounded-[24px] bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                    <img
                      alt="Course technical depth illustration"
                      src={course.thumbnail}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </section>

                {/* Syllabus */}
                <section>
                  <h2 className="mb-8 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <span className="h-8 w-2 rounded-full bg-emerald-700" />
                    Course Syllabus
                  </h2>

                  <div className="space-y-4">
                    {course.modules.map((module, moduleIndex) => {
                      const previewLessons = module.lessons.slice(0, 2);
                      const isLocked = false;

                      return (
                        <details
                          key={module.id}
                          className={`group rounded-[22px] bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)] ${isLocked ? 'opacity-70' : ''}`}
                          open={moduleIndex === 0}
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-6 [&::-webkit-details-marker]:hidden">
                            <div className="flex items-start gap-6">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f8] font-bold text-indigo-600">
                                {moduleIndex + 1}
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-900">{module.title}</h3>
                                <p className="text-sm text-slate-500">
                                  {isLocked ? 'Coming soon' : `${module.lessons.length} lessons • ${module.duration}`}
                                </p>
                                {!isLocked && (
                                  <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-4">
                                    {previewLessons.map((lesson) => (
                                      <div key={lesson.id} className="flex items-center gap-2 text-sm text-slate-500">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                                        {lesson.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-500">
                              <Clock3 className="h-5 w-5" />
                              {!isLocked && <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />}
                              {isLocked && <Lock className="h-5 w-5" />}
                            </div>
                          </summary>

                          {!isLocked && (
                            <div className="border-t border-slate-200/60 px-6 pb-6 pt-0">
                              <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-3">
                                  {module.lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center gap-2 text-sm text-slate-500">
                                      <span className="text-xs text-slate-400">•</span>
                                      {lesson.title}
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2 rounded-[18px] bg-[#f6fafe] p-5 text-sm text-slate-600">
                                  <div className="font-semibold text-slate-900">Module overview</div>
                                  <div>Practical delivery focused on {module.title.toLowerCase()} and the build patterns that follow from it.</div>
                                  <div className="pt-2 text-xs uppercase tracking-[0.25em] text-slate-400">{module.duration}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </details>
                      );
                    })}
                  </div>
                </section>

                {/* Announcements */}
                <section>
                  <h2 className="mb-8 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <span className="h-8 w-2 rounded-full bg-rose-700" />
                    Announcements
                  </h2>

                  {announcements.length === 0 ? (
                    <div className="rounded-[24px] border-2 border-dashed border-[#c7c4d7] bg-[#f0f4f8] p-12 text-center">
                      <Megaphone className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                      <p className="font-medium text-slate-500">No course announcements yet.</p>
                      <p className="mt-1 text-sm text-slate-400">Updates from the instructor will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="rounded-[24px] bg-white p-6 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                            {announcement.author.firstName} {announcement.author.lastName}
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-slate-900">{announcement.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{announcement.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Testimonials */}
                <section>
                  <h2 className="mb-8 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <span className="h-8 w-2 rounded-full bg-indigo-600" />
                    What our students say
                  </h2>

                  <div className="grid gap-8 md:grid-cols-2">
                    {[
                      {
                        quote: 'The most practical cloud course I have ever taken. The CI/CD modules were a game changer for my team\'s workflow.',
                        name: 'Sarah Jenkins',
                        role: 'Software Engineer',
                        avatar: course.instructor.avatar,
                      },
                      {
                        quote: 'CourseForge\'s approach to complex infrastructure makes even high-level architecture feel intuitive and approachable.',
                        name: 'Raj Patel',
                        role: 'Tech Lead',
                        avatar: course.instructor.avatar,
                      },
                    ].map((testimonial) => (
                      <div key={testimonial.name} className="rounded-[24px] bg-white p-8 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                        <p className="text-base italic leading-8 text-slate-500">“{testimonial.quote}”</p>
                        <div className="mt-6 flex items-center gap-4">
                          <img alt={testimonial.name} src={testimonial.avatar} className="h-12 w-12 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-slate-900">{testimonial.name}</p>
                            <p className="text-sm text-slate-500">{testimonial.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Review form */}
                {user?.role === 'STUDENT' && enrollment?.status === 'COMPLETED' && (
                  <section>
                    <h2 className="mb-8 flex items-center gap-3 text-lg font-semibold text-slate-900">
                      <span className="h-8 w-2 rounded-full bg-emerald-700" />
                      Leave a Review
                    </h2>
                    <div className="rounded-[24px] bg-white p-6 shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                      <div className="grid gap-4">
                        <select
                          value={reviewForm.rating}
                          onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                          className="rounded-2xl border border-slate-200 bg-[#f0f4f8] px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} stars
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                          className="min-h-32 rounded-2xl border border-slate-200 bg-[#f0f4f8] px-4 py-3 text-sm text-slate-900 outline-none"
                          placeholder="Share what worked well and what could improve."
                        />
                        <button
                          onClick={async () => {
                            try {
                              await createCourseReview(course.id, reviewForm);
                              addToast('Review submitted for moderation.', 'success');
                              setReviewForm({ rating: 5, comment: '' });
                            } catch (error) {
                              addToast(error instanceof Error ? error.message : 'Unable to submit review', 'error');
                            }
                          }}
                          className="w-fit rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.96]"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:px-8">
              <div className="rounded-[28px] bg-white p-12 text-center shadow-[8px_8px_16px_rgba(0,0,0,0.05),inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_rgba(223,227,231,0.5)]">
                <h1 className="text-3xl font-extrabold text-slate-900">Course not found</h1>
                <p className="mt-4 text-sm text-slate-500">This course may have been removed or is no longer available.</p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#dfe3e7]/80 bg-[#f0f4f8] py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 md:grid-cols-4 md:px-6 lg:px-8">
            <div className="col-span-2 space-y-6 md:col-span-1">
              <div className="flex items-center gap-2 font-headline text-xl font-extrabold tracking-tight text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base text-white">T</div>
                CourseForge
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Platform</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/courses" className="text-sm text-slate-500 hover:underline">
                  Browse Catalog
                </Link>
                <Link href={dashboardPath} className="text-sm text-slate-500 hover:underline">
                  Dashboard
                </Link>
                <Link href="/settings" className="text-sm text-slate-500 hover:underline">
                  Settings
                </Link>
                <Link href="/blog" className="text-sm text-slate-500 hover:underline">
                  Blog
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Roles</h4>
              <nav className="flex flex-col gap-2">
                <span className="text-sm text-slate-500">Students</span>
                <span className="text-sm text-slate-500">Instructors</span>
                <span className="text-sm text-slate-500">Platform Admins</span>
                <span className="text-sm text-slate-500">Help Center</span>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">Account</h4>
              <nav className="flex flex-col gap-2">
                {user ? (
                  <button onClick={() => signOut().then(() => router.push('/'))} className="w-fit text-sm text-slate-500 hover:underline">
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link href="/login" className="text-sm text-slate-500 hover:underline">
                      Sign In
                    </Link>
                    <Link href="/register" className="text-sm text-slate-500 hover:underline">
                      Create Account
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>

          <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-slate-200 px-4 pt-8 md:flex-row md:px-6 lg:px-8">
            <p className="text-sm text-slate-500">© 2026 CourseForge. Learning made tactile.</p>
            <div className="flex gap-6 text-slate-400">
              <span className="text-sm">◎</span>
              <span className="text-sm">◌</span>
              <span className="text-sm">◍</span>
            </div>
          </div>
        </footer>
      </div>
  );
}
