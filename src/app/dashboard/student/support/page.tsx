'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, MessageSquareText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { createSupportTicket, getMySupportTickets } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useProtectedPage } from '@/lib/use-protected-page';
import { SupportTicket } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function StudentSupportPage() {
  useProtectedPage(['STUDENT']);
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'GENERAL' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      return;
    }

    // PERF: fetch support tickets on mount instead of waiting for the auth hook to settle.
    getMySupportTickets().then(setTickets).catch(() => setTickets([]));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">Support Center</h1>
          <p className="mt-2 text-[var(--color-text-main)]/70 font-medium">Create support requests and track replies from the Academy team.</p>
        </div>
        <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-600 dark:text-rose-400 shadow-inner">
          {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="clay p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black text-[var(--color-text-heading)]">Create Ticket</div>
              <div className="text-sm font-medium text-[var(--color-text-main)]/65">Describe the issue clearly so support can resolve it faster.</div>
            </div>
          </div>
          <div className="grid gap-4">
            <input value={ticketForm.subject} onChange={(e) => setTicketForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject" className="clay-input" />
            <select value={ticketForm.category} onChange={(e) => setTicketForm((current) => ({ ...current, category: e.target.value }))} className="clay-input">
              <option value="GENERAL">General</option>
              <option value="STUDENT">Student</option>
              <option value="PAYMENT">Payment</option>
              <option value="TECHNICAL">Technical</option>
            </select>
            <textarea value={ticketForm.description} onChange={(e) => setTicketForm((current) => ({ ...current, description: e.target.value }))} placeholder="Describe the issue" className="clay-input min-h-36" />
            <button
              disabled={submitting || !ticketForm.subject.trim() || !ticketForm.description.trim()}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const created = await createSupportTicket(ticketForm);
                  setTickets((current) => [created, ...current]);
                  setTicketForm({ subject: '', description: '', category: 'GENERAL' });
                  addToast('Support ticket created.', 'success');
                } catch (error) {
                  addToast(error instanceof Error ? error.message : 'Unable to create support ticket', 'error');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="clay-btn px-5 py-3"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="clay p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600">
                <MessageSquareText className="h-8 w-8" />
              </div>
              <h2 className="mt-6 text-2xl font-display font-black text-[var(--color-text-heading)]">No support tickets yet</h2>
              <p className="mt-2 text-[var(--color-text-main)]/70">Open your first ticket whenever you need help with learning, payments, or technical issues.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="clay p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xl font-black text-[var(--color-text-heading)]">{ticket.subject}</div>
                    <div className="mt-2 text-sm font-bold text-[var(--color-text-main)]/60">
                      {ticket.category} • Updated {new Date(ticket.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs font-black text-brand-600">
                    {ticket.status}
                  </div>
                </div>
                <div className="mt-4 text-sm text-[var(--color-text-main)]/75">{ticket.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
