'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getMyCertificates } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Certificate } from '@/types';

export default function CertificatePage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const { user } = useProtectedPage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!user) return;
    getMyCertificates().then(setCertificates);
  }, [user]);

  const certificate = useMemo(() => certificates.find((entry) => entry.id === certificateId), [certificateId, certificates]);

  if (!certificate) {
    return <div className="min-h-screen bg-gray-50 py-12 px-6 text-center">Certificate not found.</div>;
  }

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${certificate?.courseTitle} Certificate`,
          text: `View my course completion certificate for ${certificate?.courseTitle}.`,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Ignore share fallback errors.
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/student" className="text-brand-600 font-medium hover:text-brand-700">
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            {certificate.downloadUrl && (
              <a href={certificate.downloadUrl} target="_blank" className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition" rel="noreferrer">
                <Download className="w-4 h-4" /> Download PDF
              </a>
            )}
            <button onClick={handleShare} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        <div className="bg-white aspect-[1.414] w-full p-12 shadow-2xl border-8 border-double border-gray-200 rounded flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 border-[20px] border-solid border-brand-900 pointer-events-none opacity-5"></div>
          <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white mb-8"><Award className="w-10 h-10" /></div>
          <div className="text-brand-600 font-bold tracking-widest uppercase mb-4 text-sm">CourseForge Learning Platform</div>
          <h1 className="text-5xl font-display font-medium text-gray-900 mb-2 font-serif">Certificate of Completion</h1>
          <p className="text-lg text-gray-500 mb-8 italic">This is to certify that</p>
          <div className="text-4xl font-display font-bold text-gray-950 mb-8 border-b-2 border-gray-200 pb-2 w-3/4">{user?.name}</div>
          <p className="text-lg text-gray-500 mb-4 max-w-2xl">has successfully completed the course</p>
          <div className="text-2xl font-bold text-gray-900 mb-12">{certificate.courseTitle}</div>
          <div className="flex justify-between w-full px-12 mt-auto">
            <div className="text-center">
              <div className="border-b border-gray-900 font-serif italic text-xl px-4 py-2 mb-2">CourseForge</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Platform</div>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-900 font-medium px-4 py-2 mb-2">{new Date(certificate.issuedAt).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
