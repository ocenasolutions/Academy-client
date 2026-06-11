'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ChevronRight,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { StudentReferenceShell } from '@/components/StudentReferenceShell';
import { getMyPayments } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { readSession } from '@/lib/auth';
import { useProtectedPage } from '@/lib/use-protected-page';
import { PaymentRecord } from '@/types';

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80';

type MockPaymentRow = {
  description: string;
  detail: string;
  amountCents: number;
  status: string;
  createdAt: string;
  course: { id: string; title: string; thumbnailUrl?: string | null };
};

type DisplayPaymentRow = PaymentRecord | MockPaymentRow;

function formatINR(amountCents: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function normalizeStatus(status: string) {
  return status.toUpperCase();
}

function statusTone(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized.includes('SUCC') || normalized.includes('PAID') || normalized.includes('COMPLETE')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (normalized.includes('PEND') || normalized.includes('INIT')) {
    return 'bg-slate-200 text-slate-700';
  }
  if (normalized.includes('FAIL') || normalized.includes('ERR')) {
    return 'bg-rose-100 text-rose-700';
  }
  return 'bg-amber-100 text-amber-700';
}

export default function StudentPaymentsPage() {
  useProtectedPage(['STUDENT']);
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    // PERF: start the billing fetch immediately instead of waiting for auth state to resolve.
    getMyPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const transactionRows = payments.slice(0, 6);
  const paymentMethods = [
    { name: 'Primary Method', mask: '•••• •••• •••• 4242', expiry: '09/26' },
    { name: 'Backup Method', mask: '•••• •••• •••• 8812', expiry: '12/25' },
  ];
  const displayRows: DisplayPaymentRow[] = transactionRows.length ? transactionRows : mockRows;

  return (
    <StudentReferenceShell activeSidebar="payments">
      <div className="space-y-8">
        
        {/* Header */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 md:text-[3.7rem]">Payments & Billing</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Manage your saved cards and view your transaction history.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100 px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure SaaS Transaction</span>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Payment Methods (Cards) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Saved Cards</h2>
                  <p className="mt-1 text-xs text-slate-500">Your registered payment methods.</p>
                </div>
                <button className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700">+ Add</button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.02)]">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{method.name}</div>
                        <div className="text-xl font-semibold tracking-[0.08em] text-slate-950">{method.mask}</div>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Holder</div>
                        <div className="mt-1 font-medium text-slate-950 truncate">{user?.name?.toUpperCase() || 'JOHN DOE'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Expires</div>
                        <div className="mt-1 font-medium text-slate-950">{method.expiry}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction History (Bills) */}
          <div className="lg:col-span-2">
            <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Transaction History</h2>
                  <p className="mt-1 text-xs text-slate-500 font-medium">All billing receipts and status updates.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Filter</button>
                  <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Export</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-8 py-4">Description</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {displayRows.map((payment, index) => {
                      const isMock = !('id' in payment);
                      const course = isMock ? payment.course : payment.order.items[0]?.course;
                      const status = payment.status;
                      const amount = payment.amountCents;
                      const timestamp = isMock ? payment.createdAt : payment.paidAt || payment.createdAt;
                      const detail = isMock ? payment.detail : payment.provider.toUpperCase();
                      const title = course?.title || (isMock ? payment.description : 'Payment');
                      return (
                        <tr key={`${course?.id || 'mock'}-${index}`} className="align-middle">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={course?.thumbnailUrl || DEFAULT_THUMBNAIL}
                                alt={course?.title || 'Payment'}
                                className="h-10 w-10 rounded-xl object-cover"
                              />
                              <div>
                                <div className="font-semibold text-sm text-slate-950 line-clamp-1">{title}</div>
                                <div className="text-xs text-slate-500">{detail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">{formatDateTime(timestamp)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-950">{formatINR(amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusTone(status)}`}>{status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {normalizeStatus(status).includes('FAIL') ? (
                              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Retry</button>
                            ) : (
                              <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                <ArrowDownToLine className="h-3.5 w-3.5" />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-8 py-4">
                <div className="flex flex-col gap-4 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
                  <div>Showing {transactionRows.length || mockRows.length} of {payments.length || mockRows.length} transactions</div>
                  <div className="flex items-center gap-2">
                    <PageDot label="1" active />
                    <PageDot label="2" />
                    <PageDot label="3" />
                    <PageArrow direction="left" />
                    <PageArrow direction="right" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </StudentReferenceShell>
  );
}



function PageDot({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
        active ? 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function PageArrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
    >
      <ChevronRight className={`h-4 w-4 ${direction === 'left' ? 'rotate-180' : ''}`} />
    </button>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const mockRows: MockPaymentRow[] = [
  {
    description: 'AdvancedUX/UI Certification',
    detail: 'Subscription Payment',
    amountCents: 29900,
    status: 'SUCCEEDED',
    createdAt: '2026-10-24T14:30:00.000Z',
    course: { id: 'ux-ui', title: 'AdvancedUX/UI Certification', thumbnailUrl: DEFAULT_THUMBNAIL },
  },
  {
    description: 'Tactile Motion Masterclass',
    detail: 'One-time Purchase',
    amountCents: 14900,
    status: 'PENDING',
    createdAt: '2026-10-12T09:15:00.000Z',
    course: { id: 'motion', title: 'Tactile Motion Masterclass', thumbnailUrl: DEFAULT_THUMBNAIL },
  },
  {
    description: 'Professional Creative Coaching',
    detail: 'Session Add-on',
    amountCents: 8500,
    status: 'FAILED',
    createdAt: '2026-09-28T18:45:00.000Z',
    course: { id: 'coaching', title: 'Professional Creative Coaching', thumbnailUrl: DEFAULT_THUMBNAIL },
  },
];
