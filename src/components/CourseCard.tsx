'use client';

import { Course } from '../types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.55, type: 'spring', bounce: 0.28 }}
      whileHover={{ y: -5 }}
      className="theme-surface group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] shadow-[0_10px_26px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.09)]"
    >
      <Link href={`/courses/${course.id}`} className="relative block aspect-[16/9] overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#07006c] shadow-sm">
            {course.category}
          </span>
          <span className="rounded-full bg-emerald-200/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-900 shadow-sm">
            {course.level}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 md:px-5">
        <Link href={`/courses/${course.id}`}>
          <h3 className="mb-2 text-[1.05rem] font-semibold leading-[1.25] text-slate-950 transition-colors group-hover:text-blue-700">
            {course.title}
          </h3>
        </Link>
        <p className="mb-5 line-clamp-2 text-[12px] leading-5 text-slate-600">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {course.language?.toUpperCase() || 'EN'}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
            View Course <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
