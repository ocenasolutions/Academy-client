'use client';

import { Course } from '../types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Star } from 'lucide-react';

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const showDuration = course.duration && course.duration !== 'Self-paced' && course.duration !== 'SelfPaced';

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, type: 'spring', bounce: 0.2 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        href={`/courses/${course.id}`}
        className="bg-[var(--surface-card)] border border-[var(--surface-border)] backdrop-blur-md group flex h-full flex-col overflow-hidden rounded-[1.25rem] transition-all duration-300 hover:border-brand-500/40 hover:shadow-[0_12px_36px_rgba(59,130,246,0.08)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-[var(--surface-border)]">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5">
            CourseForge Academy
          </span>
          <h3 className="mb-2 text-base font-bold leading-snug text-[var(--text-heading)] transition-colors group-hover:text-brand-500 line-clamp-2">
            {course.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-main)]/70">
            {course.description}
          </p>

          <div className="mt-auto pt-3 border-t border-[var(--surface-border)]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-text-main)]/65">
            {/* Rating */}
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{course.rating ? course.rating.toFixed(1) : '4.8'}</span>
              <span className="text-[var(--color-text-main)]/45 font-medium">
                ({course.students > 0 ? course.students.toLocaleString() : '1,240'})
              </span>
            </div>

            {/* Level & Duration */}
            <div className="flex items-center gap-2 text-[var(--color-text-main)]/50">
              <span className="capitalize">{course.level}</span>
              {showDuration && (
                <>
                  <span>•</span>
                  <span>{course.duration}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
