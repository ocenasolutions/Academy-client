'use client';

import { motion } from 'motion/react';

export function SkeletonCourseCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="theme-surface flex h-full flex-col overflow-hidden rounded-[1.5rem] shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
    >
      <div className="relative aspect-[16/9] bg-[var(--surface-border)] animate-pulse" />

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 md:px-5">
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-24 rounded-full bg-[var(--surface-border)] animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-[var(--surface-border)] animate-pulse" />
        </div>
        <div className="mb-3 h-5 w-11/12 rounded-lg bg-[var(--surface-border)] animate-pulse" />
        <div className="mb-4 h-5 w-4/5 rounded-lg bg-[var(--surface-border)] animate-pulse" />

        <div className="mb-5 space-y-2.5">
          <div className="h-3.5 w-full rounded-lg bg-[var(--surface-border)] animate-pulse" />
          <div className="h-3.5 w-5/6 rounded-lg bg-[var(--surface-border)] animate-pulse" />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--surface-border)] pt-3">
          <div className="h-5 w-24 rounded-full bg-[var(--surface-border)] animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-[var(--surface-border)] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
