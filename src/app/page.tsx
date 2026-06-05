'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { CourseCard } from '@/components/CourseCard';
import { getCategories, getCourses } from '@/lib/api';
import { Category, Course } from '@/types';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Star, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourses(), getCategories()])
      .then(([nextCourses, nextCategories]) => {
        setCourses(nextCourses.slice(0, 3));
        setCategories(nextCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <section className="relative overflow-visible pb-32 pt-16">
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex-1 max-w-2xl relative"
          >
            <div className="inline-flex flex-row items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-pulse text-brand-600 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> Live AI-Powered Learning Marketplace
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-[var(--color-text-heading)] leading-[1.1] mb-6 drop-shadow-sm">
              Learn without <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-indigo-500">limits</span>.
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-text-main)]/70 mb-10 leading-relaxed font-medium">
              Explore structured online learning paths, instructor-led programs, and career-ready courses powered by a real backend and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/register" className="clay-btn px-8 py-4 font-bold text-lg flex items-center justify-center gap-2 group !rounded-[1.25rem]">
                Join for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/courses" className="clay px-8 py-4 font-bold text-lg text-[var(--color-text-heading)] flex items-center justify-center hover:scale-105 transition-transform !rounded-[1.25rem]">
                Explore Courses
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm font-bold text-[var(--color-text-main)]/60 flex-wrap">
              <div className="flex items-center gap-2 bg-[var(--glass-bg)] px-4 py-2 rounded-xl backdrop-blur-md border border-[var(--glass-border)]">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><Star className="w-4 h-4 fill-current" /></div>
                <span>{loading ? '...' : `${categories.length}+ Categories`}</span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--glass-bg)] px-4 py-2 rounded-xl backdrop-blur-md border border-[var(--glass-border)]">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><Zap className="w-4 h-4" /></div>
                <span>{loading ? '...' : `${courses.length}+ Featured Courses`}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 hidden lg:block relative"
          >
            <div className="relative z-10 p-4 clay rounded-[3rem] rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                alt="Students learning"
                className="rounded-[2.5rem] object-cover aspect-[4/3] shadow-inner"
              />
            </div>
            <div className="absolute -bottom-10 -left-16 glass p-6 rounded-3xl flex items-center gap-5 z-20 hover:-translate-y-2 transition-transform">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center shadow-inner border border-white">
                <span className="font-black text-2xl">AI</span>
              </div>
              <div>
                <div className="font-black text-xl text-[var(--color-text-heading)]">Structured Curriculum</div>
                <div className="text-sm font-bold text-[var(--color-text-main)]/60">Backed by enrollments and progress tracking</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 relative z-10 w-full px-4 md:px-8">
        <div className="max-w-7xl mx-auto glass rounded-[3rem] p-8 md:p-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-display font-black text-[var(--color-text-heading)] mb-4">Launch your new career</h2>
              <p className="text-xl text-[var(--color-text-main)]/70 font-medium">Live catalog data from the LMS backend, ready for real enrollments and certificates.</p>
            </div>
            <Link href="/courses" className="clay px-6 py-3 font-bold text-[var(--color-text-heading)] flex items-center gap-2 group hover:scale-105 transition-transform !rounded-2xl">
              View all programs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="clay-card h-[420px] animate-pulse" />
                ))
              : courses.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-display font-black text-[var(--color-text-heading)] mb-12 text-center">Explore popular categories</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, i) => (
              <motion.div key={category.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: 'spring' }}>
                <Link href={`/courses?category=${category.slug}`} className="clay px-8 py-4 font-bold text-[var(--color-text-heading)] hover:text-brand-600 transition-all block hover:scale-105 active:scale-95 text-lg">
                  {category.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto bg-brand-950 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[#4a044e] opacity-80 z-0"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

          <div className="relative z-10 text-center">
            <h2 className="text-5xl md:text-6xl font-display font-black text-white mb-6 leading-tight">Transform your life <br />through education</h2>
            <p className="text-xl text-brand-100/80 mb-12 max-w-2xl mx-auto font-medium">
              Join live learners, real instructors, and an LMS built for scale with payments, enrollments, analytics, and certificates.
            </p>
            <Link href="/register" className="inline-block bg-white text-brand-950 px-12 py-5 rounded-[1.5rem] font-black text-lg hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
              Start Learning Now
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
