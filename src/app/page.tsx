'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, CheckCircle2, Globe2, Sparkles, Star, Trophy, Users, Zap, type LucideIcon } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { CourseCard } from '@/components/CourseCard';
import { getCategories, getCourses } from '@/lib/api';
import { Category, Course } from '@/types';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const highlights = [
    {
      icon: BookOpen,
      title: 'Structured learning paths',
      description: 'Build curriculum from modules, lessons, quizzes, and assignments that feel coherent from day one.',
    },
    {
      icon: Users,
      title: 'Instructor and admin ready',
      description: 'Role-aware dashboards, approval flows, and review tools keep content moving without chaos.',
    },
    {
      icon: Globe2,
      title: 'Marketplace discovery',
      description: 'Categories, filters, and featured blocks help learners find what fits their goals quickly.',
    },
    {
      icon: Trophy,
      title: 'Progress and outcomes',
      description: 'Track enrollments, completion, certificates, and payments with a backend that supports scale.',
    },
  ];

  const steps = [
    {
      title: 'Discover a path',
      text: 'Browse curated programs by category, level, and career goal.',
    },
    {
      title: 'Follow the curriculum',
      text: 'Learn through lessons, quizzes, assignments, and structured modules.',
    },
    {
      title: 'Finish with proof',
      text: 'Complete payments, earn certificates, and track real progress in the dashboard.',
    },
  ];

  const platformFeatures: Array<{
    title: string;
    text: string;
    icon: LucideIcon;
  }> = [
    {
      title: 'Courses',
      text: 'Catalog, filters, categories, and featured tracks',
      icon: BookOpen,
    },
    {
      title: 'Learning',
      text: 'Modules, lessons, quizzes, and assignments',
      icon: Sparkles,
    },
    {
      title: 'Payments',
      text: 'Checkout, invoices, and billing history',
      icon: Zap,
    },
    {
      title: 'Progress',
      text: 'Certificates, support, and completion tracking',
      icon: Trophy,
    },
  ];

  useEffect(() => {
    Promise.all([getCourses(), getCategories()])
      .then(([nextCourses, nextCategories]) => {
        setCourses(nextCourses.slice(0, 4));
        setCategories(nextCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="theme-shell">
        <section className="relative overflow-hidden pb-20 pt-12 md:pb-28 md:pt-16">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-4 md:px-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100">
                <Sparkles className="h-4 w-4" /> Live AI-Powered Learning Marketplace
              </div>

              <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-950 md:text-7xl md:leading-[1.05]">
                Learn without <br />
                <span className="text-blue-500">limits.</span>
              </h1>

              <p className="max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
                Explore structured online learning paths, instructor-led programs, and career-ready courses powered by a real backend and progress tracking.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)] transition hover:bg-blue-700"
                >
                  Join for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Explore Courses
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <span>{loading ? '...' : `${categories.length}+ Categories`}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span>{loading ? '...' : `${courses.length}+ Featured Courses`}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/70 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
                <div className="overflow-hidden rounded-[1.75rem]">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000"
                    alt="Students learning"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 left-8 rounded-[1.5rem] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-600">AI</div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">Structured Curriculum</div>
                      <div className="text-sm text-slate-500">Backed by enrollments and progress tracking</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Live platform
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Everything learners need in one place.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  Browse, enroll, learn, review, pay, and earn certificates without switching tools. The landing page should make that obvious immediately.
                </p>

                <div className="mt-10 border-y border-slate-200/70">
                  {platformFeatures.map((item, index) => {
                    const Icon = item.icon;
                    return (
                    <div key={item.title} className={`grid grid-cols-[auto_1fr] gap-4 py-5 ${index < 3 ? 'border-b border-slate-200/70' : ''}`}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-950">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-600">{item.text}</div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.id}
                      href={`/courses?category=${category.slug}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-[2.5rem] md:col-span-2">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"
                    alt="Learning workspace"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/65 via-slate-950/25 to-transparent" />
                  <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    AI Builder
                  </div>
                  <div className="absolute bottom-6 left-6 max-w-md rounded-[1.5rem] border border-white/20 bg-white/90 px-5 py-4 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-600">AI</div>
                      <div>
                        <div className="text-lg font-bold text-slate-900">Create courses, modules, and quizzes faster.</div>
                        <div className="text-sm text-slate-500">Backed by enrollments and progress tracking</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-surface-soft rounded-[1.8rem] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust signals</p>
                  <div className="mt-4 space-y-3">
                    {[
                      'AI-generated course blueprints',
                      'Instructor approval workflow',
                      'Student progress + certificate pipeline',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 border-b border-slate-200/70 py-3 text-sm text-slate-700 last:border-b-0">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="theme-surface-soft rounded-[1.8rem] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stats</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Courses</div>
                      <div className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : courses.length}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Categories</div>
                      <div className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : categories.length}</div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-200/70 pt-4 text-sm leading-6 text-slate-700">
                    Use the theme switcher now and these surfaces will change too. The page was using hardcoded light whites before.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="border-t border-slate-200/70 pt-10">
              <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <h2 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Launch your new career</h2>
                  <p className="mt-3 text-lg text-slate-600 md:text-xl">
                    Live catalog data from the LMS backend, ready for real enrollments and certificates.
                  </p>
                </div>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  View all programs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[420px] rounded-[1.5rem] bg-slate-100" />)
                  : courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="border-t border-slate-200/70 pt-10">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.55 }}
                      className="relative px-2 py-2 md:px-4"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      {index < highlights.length - 1 ? (
                        <div className="absolute right-0 top-2 hidden h-24 w-px bg-slate-200/80 xl:block dark:bg-slate-700/60" />
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="border-t border-slate-200/70 pt-10">
              <div className="grid gap-6 md:grid-cols-3">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="relative rounded-[1.5rem] px-2 py-2 md:px-4"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      0{index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                    {index < steps.length - 1 ? (
                      <div className="absolute right-0 top-2 hidden h-24 w-px bg-slate-200/80 md:block dark:bg-slate-700/60" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 text-center md:px-10">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Explore popular categories</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, type: 'spring' }}
                >
                  <Link
                    href={`/courses?category=${category.slug}`}
                    className="theme-surface inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition hover:border-blue-300 hover:text-blue-600 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    {category.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="py-2">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Featured learning paths</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Most active now</h2>
                  </div>
                  <Link href="/courses" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex">
                    Browse all
                  </Link>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {courses.slice(0, 2).map((course, index) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600">{index + 1}</div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{course.category}</div>
                          <div className="text-sm font-semibold text-slate-950">{course.level}</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950 group-hover:text-blue-600">{course.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{course.description}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500">
                        <span>{course.duration}</span>
                        <span>Open course</span>
                      </div>
                    </Link>
                  ))}
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-950">Why it stays active:</span>
                    <span>course creation</span>
                    <span>•</span>
                    <span>approvals</span>
                    <span>•</span>
                    <span>payments</span>
                    <span>•</span>
                    <span>progress tracking</span>
                  </div>
                </div>
              </div>

              <div className="theme-cta rounded-[2.5rem] p-10 shadow-[0_24px_90px_rgba(59,7,100,0.25)] md:p-12">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  Built for scale
                </div>
                <h2 className="mt-6 max-w-sm text-3xl font-black tracking-tight md:text-4xl">Real platform workflows, not demo fluff.</h2>
                <p className="theme-cta-muted mt-4 max-w-md text-sm leading-7">
                  Course creation, approvals, payments, learner progress, certificates, and category browsing all connect to the same backend.
                </p>

                <div className="mt-10 space-y-4">
                  {[
                    'AI-generated courses with module and quiz structure',
                    'Student dashboards with progress, payments, and support',
                    'Instructor and admin workflows with review states',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.2rem] bg-white/10 px-4 py-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7cf8dd]" />
                      <span className="text-sm leading-6 text-white/85">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <Link href="/register" className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100">
                    Start Learning Now
                  </Link>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/60">Payments • progress • approvals</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:px-10 md:py-24">
          <div className="theme-cta mx-auto max-w-[1440px] rounded-[2.5rem] px-6 py-16 text-center shadow-[0_24px_90px_rgba(59,7,100,0.25)] md:px-12 md:py-24">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Transform your life <br />through education
              </h2>
              <p className="theme-cta-muted mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg">
                Join live learners, real instructors, and an LMS built for scale with payments, enrollments, analytics, and certificates.
              </p>
              <Link
                href="/register"
                className="mt-10 inline-flex items-center rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
              >
                Start Learning Now
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
