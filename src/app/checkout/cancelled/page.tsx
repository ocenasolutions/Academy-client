'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Checkout Cancelled</div>
        <h1 className="mt-4 text-4xl font-display font-black text-gray-950">Your checkout was not completed.</h1>
        <p className="mt-4 text-base font-medium leading-7 text-gray-600">
          No enrollment was created from this checkout attempt. You can return to the catalog, review the course again, and restart checkout whenever you are ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/courses" className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-black text-white">
            Browse Courses
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-black text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
