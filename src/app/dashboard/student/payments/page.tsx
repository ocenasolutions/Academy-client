'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ReceiptText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyPayments } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { PaymentRecord } from '@/types';

export default function StudentPaymentsPage() {
  const { user } = useProtectedPage(['STUDENT']);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    getMyPayments().then(setPayments).catch(() => setPayments([]));
  }, [user]);

  return (
    <DashboardLayout role="student">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">Payments & Billing</h1>
          <p className="mt-2 text-[var(--color-text-main)]/70 font-medium">Track course purchases, payment status, and recent invoices.</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-700 shadow-inner">
          {payments.length} payment{payments.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-6">
        {payments.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <CreditCard className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-display font-black text-[var(--color-text-heading)]">No payments yet</h2>
            <p className="mt-2 text-[var(--color-text-main)]/70">Your course orders and invoices will show up here once you purchase a course.</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="clay p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xl font-black text-[var(--color-text-heading)]">
                    {payment.order.items.map((item) => item.course.title).join(', ')}
                  </div>
                  <div className="mt-2 text-sm font-bold text-[var(--color-text-main)]/60">
                    {payment.provider} • {payment.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-emerald-600">
                    ${(payment.amountCents / 100).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs font-bold text-[var(--color-text-main)]/55">
                    {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-black text-[var(--color-text-heading)]">
                <ReceiptText className="h-4 w-4" /> Invoice record available in payment history
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
