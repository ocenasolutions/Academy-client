'use client';

import { Course } from '../types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, Sparkles, Star } from 'lucide-react';

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, type: 'spring', bounce: 0.4 }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,255,0.96)_100%)] p-3 shadow-[0_16px_36px_rgba(84,107,153,0.12)] transition-all duration-300 hover:shadow-[0_20px_48px_rgba(59,130,246,0.16)]"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-28 rounded-b-[2rem] bg-gradient-to-b from-brand-500/10 to-transparent" />

      <Link href={`/courses/${course.id}`} className="relative block aspect-[16/10] overflow-hidden rounded-[1.5rem] shadow-inner">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/88 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-brand-700 shadow-sm">
            {course.category}
          </span>
          <span className="rounded-full bg-slate-950/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
            {course.level}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="rounded-2xl bg-white/16 px-3 py-2 backdrop-blur-md">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Student Time</div>
            <div className="mt-1 text-sm font-black text-white">{course.duration}</div>
          </div>
          <div className="rounded-2xl bg-white/92 px-3 py-2 text-right shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">Premium Access</div>
            <div className="mt-1 text-lg font-display font-black text-[var(--color-text-heading)]">
              {course.price > 0 ? `$${course.price.toFixed(0)}` : 'Free'}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Course
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/18 px-3 py-1.5 text-xs font-black text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
          </div>
        </div>
        <Link href={`/courses/${course.id}`}>
          <h3 className="mb-3 text-[1.35rem] font-display font-black leading-[1.12] text-[var(--color-text-heading)] transition-colors group-hover:text-brand-600">
            {course.title}
          </h3>
        </Link>
        <p className="mb-5 line-clamp-3 text-[14px] font-medium leading-7 text-[var(--color-text-main)]/72">
          {course.description}
        </p>

        <div className="mb-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-white/70 px-3 py-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-main)]/45">Lessons</div>
            <div className="mt-2 text-sm font-black text-[var(--color-text-heading)]">{course.lessons}</div>
          </div>
          <div className="rounded-2xl border border-[var(--glass-border)] bg-white/70 px-3 py-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-main)]/45">Reviews</div>
            <div className="mt-2 text-sm font-black text-[var(--color-text-heading)]">{course.reviews}</div>
          </div>
          <div className="rounded-2xl border border-[var(--glass-border)] bg-white/70 px-3 py-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-main)]/45">Students</div>
            <div className="mt-2 text-sm font-black text-[var(--color-text-heading)]">{course.students}</div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-text-heading)]/6 pt-4">
          <div className="flex items-center gap-3 text-xs font-bold text-[var(--color-text-main)]/60">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--glass-bg)] px-3 py-2">
              <Clock className="h-3.5 w-3.5" /> {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--glass-bg)] px-3 py-2">
              <BookOpen className="h-3.5 w-3.5" /> {course.language?.toUpperCase() || 'EN'}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(var(--brand-500-rgb,59,130,246),0.28)]">
            View Course <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
