'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award, Download, Share2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyCertificates } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Certificate } from '@/types';

export default function StudentCertificatesPage() {
  useProtectedPage(['STUDENT']);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      return;
    }

    // PERF: load certificates immediately instead of waiting for the auth hook to provide a user object.
    getMyCertificates().then(setCertificates).catch(() => setCertificates([]));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">Certificates</h1>
          <p className="mt-2 text-[var(--color-text-main)]/70 font-medium">View, download, and share your completed course achievements.</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-700 shadow-inner">
          {certificates.length} certificate{certificates.length === 1 ? '' : 's'}
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="clay p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
            <Award className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-display font-black text-[var(--color-text-heading)]">No certificates yet</h2>
          <p className="mt-2 text-[var(--color-text-main)]/70">Finish a course and your verified certificate will appear here.</p>
          <Link href="/courses" className="mt-6 inline-flex rounded-2xl bg-brand-500 px-6 py-3 text-sm font-black text-white">
            Browse More Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Link key={certificate.id} href={`/certificate/${certificate.id}`} className="clay block p-6 transition hover:scale-[1.01]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 shadow-inner">
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-[var(--color-text-heading)]">{certificate.courseTitle}</div>
                    <div className="mt-1 text-sm font-bold text-[var(--color-text-main)]/60">
                      Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--glass-bg)] px-3 py-2 text-xs font-black text-brand-600">
                  {certificate.certificateNo}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-[var(--color-text-heading)]">
                  <Download className="h-4 w-4" /> View Certificate
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-[var(--color-text-heading)]">
                  <Share2 className="h-4 w-4" /> Share Achievement
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
