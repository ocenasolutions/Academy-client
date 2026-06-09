'use client';

import { Course } from '../types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Globe } from 'lucide-react';

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.55, type: 'spring', bounce: 0.28 }}
      whileHover={{ y: -6 }}
      className="bg-[var(--surface-card)] border border-[var(--surface-border)] backdrop-blur-md group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:border-brand-500/40 hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]"
    >
      <Link href={`/courses/${course.id}`} className="relative block aspect-[16/9] overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/10 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-brand-900/10 border border-brand-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300 backdrop-blur-sm shadow-lg">
            {course.category}
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300 backdrop-blur-sm shadow-lg">
            {course.level}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <Link href={`/courses/${course.id}`}>
          <h3 className="mb-2 text-[1.1rem] font-bold leading-[1.3] text-[var(--text-heading)] transition-colors group-hover:text-brand-500">
            {course.title}
          </h3>
        </Link>
        <p className="mb-5 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-text-main)]/75">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--surface-border)] pt-4">
          <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--color-text-main)]/50">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-500" /> {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 uppercase">
              <Globe className="h-3.5 w-3.5 text-brand-500" /> {course.language || 'EN'}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] transition-all group-hover:bg-brand-600">
            View Course <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
