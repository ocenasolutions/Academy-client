'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Award, Bell, BookOpen, CreditCard, LifeBuoy, PlayCircle, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { createSupportTicket, getMyCertificates, getMyEnrollments, getMyNotifications, getMyPayments, getMySupportTickets } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Certificate, Enrollment, PaymentRecord, SupportTicket } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function StudentDashboard() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { user, loading: authLoading } = useProtectedPage(['STUDENT']);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'GENERAL' });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyEnrollments(), getMyCertificates(), getMyPayments(), getMyNotifications(), getMySupportTickets()])
      .then(([nextEnrollments, nextCertificates, nextPayments, nextNotifications, nextTickets]) => {
        setEnrollments(nextEnrollments);
        setCertificates(nextCertificates);
        setPayments(nextPayments);
        setNotifications(nextNotifications.notifications);
        setAnnouncements(nextNotifications.announcements);
        setTickets(nextTickets);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      addToast('Checkout completed and your course is now in the dashboard.', 'success');
    }
  }, [addToast, searchParams]);

  const activeCourses = enrollments.filter((enrollment) => enrollment.status === 'ACTIVE');
  const completedCourses = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">My Learning</h1>
          <p className="text-[var(--color-text-main)]/70 font-medium mt-2">Welcome back{user ? `, ${user.firstName}` : ''}. Your dashboard is now backed by real enrollments and progress.</p>
        </div>
        <div className="flex z-10 items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-2xl font-bold shadow-inner w-fit">
          <Trophy className="w-5 h-5" />
          <span>{completedCourses.length} completed courses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="clay p-6">
          <div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-2">Active Enrollments</div>
          <div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{loading || authLoading ? '...' : activeCourses.length}</div>
        </div>
        <div className="clay p-6">
          <div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-2">Certificates</div>
          <div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{loading || authLoading ? '...' : certificates.length}</div>
        </div>
        <div className="clay p-6">
          <div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-2">Average Progress</div>
          <div className="text-3xl font-display font-black text-[var(--color-text-heading)]">
            {loading || authLoading || enrollments.length === 0 ? '...' : `${Math.round(enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercent, 0) / enrollments.length)}%`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)]">Continue Learning</h2>
          <div className="grid grid-cols-1 gap-6">
            {activeCourses.length === 0 && !loading ? (
              <div className="clay p-8 text-center">
                <p className="font-bold text-[var(--color-text-main)]/70 mb-4">You have no active courses yet.</p>
                <Link href="/courses" className="clay-btn px-6 py-3 inline-flex">Browse catalog</Link>
              </div>
            ) : (
              activeCourses.map((enrollment) => (
                <div key={enrollment.id} className="clay p-6 flex flex-col sm:flex-row hover:scale-[1.01] transition-transform gap-6">
                  <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full sm:w-48 h-32 object-cover rounded-2xl shadow-inner shrink-0" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-[var(--color-text-heading)] text-xl leading-tight mb-2 line-clamp-2">{enrollment.course.title}</h3>
                      <p className="font-bold text-[var(--color-text-main)]/60 mb-4 bg-[var(--glass-bg)] px-3 py-1 rounded-xl inline-block text-sm">{enrollment.course.instructor.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm font-black text-brand-600 mb-2">
                        <span className="flex items-center gap-2"><PlayCircle className="w-5 h-5" /> {Math.round(enrollment.progressPercent)}% complete</span>
                      </div>
                      <div className="w-full bg-[var(--glass-bg)] rounded-full h-3 shadow-inner border border-[var(--glass-border)] mb-4">
                        <div className="bg-gradient-to-r from-brand-500 to-indigo-500 h-3 rounded-full relative" style={{ width: `${enrollment.progressPercent}%` }}></div>
                      </div>
                      <Link href={`/course/${enrollment.course.id}/lesson/${enrollment.course.modules[0]?.lessons[0]?.id || 'start'}`} className="inline-block text-center clay-btn py-3 px-6 text-sm font-black tracking-wide">
                        Resume Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-brand-500" /> Notifications
            </h2>
            <div className="space-y-4">
              {[...announcements, ...notifications].slice(0, 4).map((entry: any, index) => (
                <div key={entry.id ?? `${entry.title}-${index}`} className="clay p-4 !rounded-2xl">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-500">
                    {'body' in entry ? 'Course Update' : entry.channel}
                  </div>
                  <div className="mt-2 font-black text-[var(--color-text-heading)]">{entry.title}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-main)]/70 line-clamp-3">{entry.body ?? entry.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-500" /> Learning Snapshot
            </h2>
            <div className="space-y-4">
              {enrollments.slice(0, 3).map((enrollment) => (
                <div key={enrollment.id} className="clay p-5 !rounded-2xl border-l-4 border-l-brand-500">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">{enrollment.status}</div>
                  <div className="font-black text-[var(--color-text-heading)] mb-1 leading-tight">{enrollment.course.title}</div>
                  <div className="text-sm font-medium text-[var(--color-text-main)]/70 mb-3">{Math.round(enrollment.progressPercent)}% complete</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-500" /> Payments
            </h2>
            <div className="space-y-4">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="clay p-4 !rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[var(--color-text-heading)]">
                        {payment.order.items.map((item) => item.course.title).join(', ')}
                      </div>
                      <div className="mt-1 text-xs font-bold text-[var(--color-text-main)]/60">
                        {payment.provider} • {payment.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-600">${(payment.amountCents / 100).toFixed(2)}</div>
                      <div className="text-xs text-[var(--color-text-main)]/50">
                        {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" /> Certificates
            </h2>
            <div className="space-y-4">
              {certificates.length === 0 && !loading ? (
                <div className="clay p-4 !rounded-2xl text-sm font-bold text-[var(--color-text-main)]/70">Complete a course to unlock your first certificate.</div>
              ) : (
                certificates.map((certificate) => (
                  <Link key={certificate.id} href={`/certificate/${certificate.id}`} className="clay p-4 flex items-center gap-4 !rounded-2xl hover:scale-[1.01] transition-transform">
                    <div className="p-3 rounded-xl shadow-inner bg-amber-500/20 text-amber-500">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-[var(--color-text-heading)] mb-0.5">{certificate.courseTitle}</div>
                      <div className="text-xs font-bold text-[var(--color-text-main)]/60">Issued {new Date(certificate.issuedAt).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-rose-500" /> Support
            </h2>
            <div className="clay p-5 !rounded-3xl">
              <div className="grid gap-3">
                <input value={ticketForm.subject} onChange={(e) => setTicketForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject" className="clay-input" />
                <select value={ticketForm.category} onChange={(e) => setTicketForm((current) => ({ ...current, category: e.target.value }))} className="clay-input">
                  <option value="GENERAL">General</option>
                  <option value="STUDENT">Student</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="TECHNICAL">Technical</option>
                </select>
                <textarea value={ticketForm.description} onChange={(e) => setTicketForm((current) => ({ ...current, description: e.target.value }))} placeholder="Describe the issue" className="clay-input min-h-28" />
                <button
                  disabled={submittingTicket || !ticketForm.subject.trim() || !ticketForm.description.trim()}
                  onClick={async () => {
                    setSubmittingTicket(true);
                    try {
                      const created = await createSupportTicket(ticketForm);
                      setTickets((current) => [created, ...current]);
                      setTicketForm({ subject: '', description: '', category: 'GENERAL' });
                      addToast('Support ticket created.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to create support ticket', 'error');
                    } finally {
                      setSubmittingTicket(false);
                    }
                  }}
                  className="clay-btn px-5 py-3"
                >
                  {submittingTicket ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl bg-[var(--glass-bg)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-[var(--color-text-heading)]">{ticket.subject}</div>
                      <div className="text-xs font-black text-brand-600">{ticket.status}</div>
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-text-main)]/70">{ticket.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
