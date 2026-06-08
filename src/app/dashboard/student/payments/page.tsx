'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDownToLine,
  BadgeCheck,
  ChevronRight,
  CreditCard,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Wallet,
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

  const summary = useMemo(() => {
    const successful = payments.filter((payment) => /SUCC|PAID|COMPLETE/i.test(payment.status));
    const totalSpentCents = successful.reduce((sum, payment) => sum + payment.amountCents, 0);
    const pendingInvoices = payments.filter((payment) => /PEND|INIT/i.test(payment.status)).length;
    const activeSubscriptions = new Set(
      successful.flatMap((payment) => payment.order.items.map((item) => item.course.id)),
    ).size;

    return {
      totalSpentCents,
      pendingInvoices,
      activeSubscriptions,
    };
  }, [payments]);

  const primaryPayment = payments[0];
  const orderCourse = primaryPayment?.order.items[0]?.course;
  const transactionRows = payments.slice(0, 6);
  const paymentMethods = [
    { name: 'Primary Method', mask: '•••• •••• •••• 4242', expiry: '09/26' },
    { name: 'Backup Method', mask: '•••• •••• •••• 8812', expiry: '12/25' },
  ];
  const displayRows: DisplayPaymentRow[] = transactionRows.length ? transactionRows : mockRows;

  return (
    <StudentReferenceShell activeSidebar="payments">
      <div className="space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 md:text-[3.7rem]">Payments & Billing</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Manage your subscriptions, view invoices, and update payment methods.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100 px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure SaaS Transaction</span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.25)]">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-950">Payment Method</div>
                  <p className="mt-2 text-sm text-slate-500">Choose how your course enrollment payments are processed.</p>
                </div>
              </div>

              <div className="rounded-[28px] border-2 border-indigo-600 bg-indigo-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-4 border-indigo-600 bg-white">
                      <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-indigo-700">Card / Hosted Checkout</div>
                      <div className="text-sm text-slate-500">Secure payment via Razorpay or local provider</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <CreditCard className="h-6 w-6" />
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-start gap-3 text-slate-700">
                  <div className="rounded-full bg-indigo-600/10 p-2 text-indigo-700">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 italic text-slate-600">
                    Orders are created on the backend. If Razorpay is configured, you will be redirected to the hosted checkout modal.
                    Otherwise, the order completes locally for development.
                  </p>
                </div>
              </div>

              <div className="my-8 h-px bg-slate-200" />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <div className="mb-3 text-lg font-medium text-slate-950">Coupon Code</div>
                  <div className="flex gap-3">
                    <input
                      disabled
                      value="ENTER CODE"
                      className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-500 outline-none"
                    />
                    <button className="rounded-2xl bg-slate-200 px-6 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-300">
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm font-medium text-slate-700">256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                  <RefreshCcw className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm font-medium text-slate-700">30-Day Money Back</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <StatCard label="Total Spent" value={formatINR(summary.totalSpentCents)} accent="text-indigo-600" icon={<Wallet className="h-5 w-5" />} />
              <StatCard label="Pending Invoices" value={String(summary.pendingInvoices).padStart(2, '0')} accent="text-rose-600" icon={<FileText className="h-5 w-5" />} />
              <StatCard label="Active Subscriptions" value={String(summary.activeSubscriptions).padStart(2, '0')} accent="text-emerald-700" icon={<RefreshCcw className="h-5 w-5" />} />
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">Payment Methods</h2>
                  <p className="mt-2 text-sm text-slate-500">Saved cards and hosted checkout options appear here.</p>
                </div>
                <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">+ Add New Card</button>
              </div>

              <div className="grid gap-5 px-8 py-8 md:grid-cols-2">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-8 flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{method.name}</div>
                        <div className="text-2xl font-semibold tracking-[0.08em] text-slate-950">{method.mask}</div>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Card Holder</div>
                        <div className="mt-2 font-medium text-slate-950">{user?.name?.toUpperCase() || 'JOHN DOE'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Expires</div>
                        <div className="mt-2 font-medium text-slate-950">{method.expiry}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">Transaction History</h2>
                  <p className="mt-2 text-sm text-slate-500">All successful, pending, and failed billing events in one place.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Filter</button>
                  <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Export</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-8 py-4">Description</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayRows.map((payment, index) => {
                      const isMock = !('id' in payment);
                      const course = isMock ? payment.course : payment.order.items[0]?.course;
                      const status = payment.status;
                      const amount = payment.amountCents;
                      const timestamp = isMock ? payment.createdAt : payment.paidAt || payment.createdAt;
                      const detail = isMock ? payment.detail : payment.provider.toUpperCase();
                      const title = course?.title || (isMock ? payment.description : 'Payment');
                      return (
                        <tr key={`${course?.id || 'mock'}-${index}`} className="align-top">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <img
                                src={course?.thumbnailUrl || DEFAULT_THUMBNAIL}
                                alt={course?.title || 'Payment'}
                                className="h-12 w-12 rounded-2xl object-cover"
                              />
                              <div>
                                <div className="font-medium text-slate-950">{title}</div>
                                <div className="text-sm text-slate-500">{detail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600">{formatDateTime(timestamp)}</td>
                          <td className="px-6 py-5 text-base font-semibold text-slate-950">{formatINR(amount)}</td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(status)}`}>{status}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {normalizeStatus(status).includes('FAIL') ? (
                              <button className="text-sm font-semibold text-indigo-600">Retry</button>
                            ) : (
                              <button className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                                <ArrowDownToLine className="h-4 w-4" />
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

              <div className="border-t border-slate-200 px-8 py-5">
                <div className="flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
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

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Order Summary</h2>
              <div className="mt-8 flex items-start gap-4">
                <img
                  src={orderCourse?.thumbnailUrl || DEFAULT_THUMBNAIL}
                  alt={orderCourse?.title || 'Order summary'}
                  className="h-28 w-28 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-indigo-600">E-Course</div>
                  <div className="mt-1 line-clamp-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {orderCourse?.title || 'Cloud Delivery for Modern Teams'}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-950">★</span> 4.9
                    </span>
                    <span>(1.2k reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-sm">
                <Row label="Subtotal" value={formatINR(primaryPayment?.amountCents || summary.totalSpentCents || 12999)} />
                <Row label="Discount" value="−₹0.00" tone="text-emerald-700" />
                <div className="h-px bg-slate-200" />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Amount</div>
                    <div className="mt-2 text-5xl font-extrabold tracking-tight text-indigo-600">
                      {formatINR(primaryPayment?.amountCents || summary.totalSpentCents || 12999)}
                    </div>
                  </div>
                  <div className="pb-2 text-sm italic text-slate-500">Inclusive of all taxes</div>
                </div>
              </div>

              <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-indigo-600 px-6 py-5 text-xl font-semibold text-white shadow-[0_20px_45px_rgba(79,70,229,0.35)] transition hover:bg-indigo-700">
                Complete Checkout
                <ChevronRight className="h-6 w-6" />
              </button>

              <p className="mt-6 text-center text-sm text-slate-500">
                By completing your purchase, you agree to our <span className="text-indigo-600">Terms of Service</span> and{' '}
                <span className="text-indigo-600">Privacy Policy</span>.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-emerald-50/80 p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-800">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">Need help?</div>
                    <div className="text-sm text-slate-600">Talk to our learning experts</div>
                  </div>
                </div>
                <button className="rounded-full border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100">
                  Chat Now
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent View Portfolio</div>
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-inner">
                <div className="h-60 rounded-[24px] border border-white bg-[radial-gradient(circle_at_top,#ffffff, #e2e8f0)] p-5">
                  <div className="h-full rounded-[20px] border border-dashed border-slate-300 bg-white/70 p-4 opacity-70 backdrop-blur-sm">
                    <div className="h-4 w-20 rounded-full bg-slate-200" />
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="h-28 rounded-2xl bg-slate-100" />
                      <div className="h-28 rounded-2xl bg-slate-100" />
                      <div className="h-28 rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-slate-500">System snapshot from your last billing cycle.</p>
            </div>
          </div>
        </section>
      </div>
    </StudentReferenceShell>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">{icon}</div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">All Time</div>
      </div>
      <div className="mt-8 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-3 text-4xl font-extrabold tracking-tight ${accent}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, tone = 'text-slate-950' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-lg text-slate-700">{label}</div>
      <div className={`text-lg font-medium ${tone}`}>{value}</div>
    </div>
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
