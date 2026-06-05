"use client";

import { motion } from 'motion/react';

export function SkeletonCourseCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex h-[445px] flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,249,255,0.96)_100%)] p-3 shadow-[0_16px_36px_rgba(84,107,153,0.12)]"
    >
      <div className="relative aspect-[16/10] rounded-[1.5rem] bg-[var(--glass-bg)] animate-pulse" />
      
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="h-8 w-28 rounded-full bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-8 w-16 rounded-full bg-[var(--glass-bg)] animate-pulse" />
        </div>
        
        <div className="mb-3 h-8 w-full rounded-xl bg-[var(--glass-bg)] animate-pulse" />
        <div className="mb-6 h-8 w-3/4 rounded-xl bg-[var(--glass-bg)] animate-pulse" />
        
        <div className="mb-6 space-y-3">
          <div className="h-4 w-full rounded-lg bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-4 w-5/6 rounded-lg bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-4 w-4/6 rounded-lg bg-[var(--glass-bg)] animate-pulse" />
        </div>
        
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="h-16 rounded-2xl bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-16 rounded-2xl bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-16 rounded-2xl bg-[var(--glass-bg)] animate-pulse" />
        </div>
        
        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-text-heading)]/5 pt-5">
          <div className="h-10 w-32 rounded-2xl bg-[var(--glass-bg)] animate-pulse" />
          <div className="h-12 w-32 rounded-2xl bg-[var(--glass-bg)] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
