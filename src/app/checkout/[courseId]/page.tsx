'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, HelpCircle, ShieldCheck, WalletCards } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { completeOrder, createCheckout, getCourse, getEnrollmentByCourse, verifyRazorpayPayment } from '@/lib/api';
import { Course } from '@/types';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatMoney(cents: number) {
  return currencyFormatter.format((cents ?? 0) / 100);
}

export default function Checkout() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { loading: authLoading } = useProtectedPage(['STUDENT']);
  const { user } = useAuth();
  const { addToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponDraft, setCouponDraft] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [pricingPreview, setPricingPreview] = useState<{ subtotalCents: number; discountCents: number; totalCents: number } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    Promise.allSettled([getCourse(courseId), getEnrollmentByCourse(courseId)])
      .then(([courseResult, enrollmentResult]) => {
        if (courseResult.status === 'fulfilled') {
          setCourse(courseResult.value);
        }
        setAlreadyEnrolled(enrollmentResult.status === 'fulfilled');
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    let mounted = true;
    loadRazorpayScript().then((loaded) => {
      if (mounted) {
        setRazorpayReady(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const subtotalCents = pricingPreview?.subtotalCents ?? Math.round((course?.price ?? 0) * 100);
  const discountCents = pricingPreview?.discountCents ?? 0;
  const totalCents = pricingPreview?.totalCents ?? subtotalCents - discountCents;
  const courseTitle = course?.title ?? 'Selected course';

  const prefillName = useMemo(() => {
    if (!user) {
      return '';
    }
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }, [user]);

  const handleApplyCoupon = () => {
    const nextCoupon = couponDraft.trim().toUpperCase();
    setCouponCode(nextCoupon);
    addToast(nextCoupon ? `Coupon ${nextCoupon} saved for checkout.` : 'Coupon cleared.', 'info');
  };

  const handleCheckout = async () => {
    if (!course) return;

    if (alreadyEnrolled) {
      addToast('You are already enrolled in this course.', 'info');
      router.push('/dashboard/student');
      return;
    }

    setSubmitting(true);
    let hostedCheckoutOpened = false;

    try {
      const result = await createCheckout([course.id], couponCode || undefined);
      setPricingPreview({
        subtotalCents: result.subtotalCents,
        discountCents: result.discountCents,
        totalCents: result.totalCents,
      });

      if (result.provider === 'RAZORPAY' && result.razorpayOrderId && result.razorpayKeyId) {
        const loaded = razorpayReady || (await loadRazorpayScript());
        if (!loaded || !window.Razorpay) {
          throw new Error('Razorpay checkout could not be loaded.');
        }

        const checkout = new window.Razorpay({
          key: result.razorpayKeyId,
          order_id: result.razorpayOrderId,
          amount: result.totalCents,
          currency: result.currency || 'INR',
          name: 'CourseForge',
          description: courseTitle,
          image: course.thumbnail,
          prefill: {
            name: prefillName,
            email: user?.email ?? '',
          },
          notes: {
            courseId: course.id,
            couponCode: couponCode || '',
          },
          theme: {
            color: '#4338ca',
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyRazorpayPayment(result.orderId, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              addToast('Enrollment completed successfully.', 'success');
              router.push('/dashboard/student?checkout=success');
            } catch (error) {
              addToast(error instanceof Error ? error.message : 'Payment verification failed', 'error');
            } finally {
              setSubmitting(false);
            }
          },
        });

        checkout.on('payment.failed', () => {
          setSubmitting(false);
          addToast('Payment failed. Please try again.', 'error');
        });

        checkout.open();
        hostedCheckoutOpened = true;
        return;
      }

      if (result.checkoutSessionUrl) {
        window.location.href = result.checkoutSessionUrl;
        return;
      }

      await completeOrder(result.orderId);
      addToast('Enrollment completed successfully.', 'success');
      router.push('/dashboard/student?checkout=success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Checkout failed', 'error');
    } finally {
      if (!hostedCheckoutOpened) {
        setSubmitting(false);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f4f8fc] p-8">
        <div className="mx-auto h-[70vh] max-w-7xl rounded-[32px] bg-white/70 animate-pulse shadow-[0_20px_60px_rgba(15,23,42,0.06)]" />
      </div>
    );
  }

  if (!course) {
    return <div className="min-h-screen bg-[#f4f8fc] p-10 text-center text-slate-700">Course not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-600/20">
                C
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">CourseForge</div>
                <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Checkout</div>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-slate-200 md:block" />
            <Link href={`/courses/${course.id}`} className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 md:flex">
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:flex">
              <HelpCircle className="mr-2 h-4 w-4 text-indigo-600" />
              Help
            </button>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pr-4 shadow-sm">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user?.name || 'John Doe'}</div>
                <div className="text-xs text-slate-500">{user?.email || 'student@academy.test'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 md:text-6xl">Checkout</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">Review your order and complete your enrollment.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-100 px-6 py-4 text-emerald-900 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Secure Razorpay Transaction</span>
          </div>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <WalletCards className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Payment Method</h2>
                <p className="text-sm text-slate-500">Select a secure hosted payment option.</p>
              </div>
            </div>

            <div className="mt-10 rounded-[26px] border-2 border-indigo-600 bg-indigo-50/60 p-6">
              <label className="flex items-center gap-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-4 border-indigo-600 bg-white">
                  <span className="h-3.5 w-3.5 rounded-full bg-indigo-600" />
                </span>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-indigo-700">Card / Hosted Checkout</div>
                  <div className="text-sm text-slate-600">Secure payment via Razorpay or Stripe</div>
                </div>
                <div className="hidden gap-3 text-slate-400 md:flex">
                  <CreditCard className="h-6 w-6" />
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
                    <path d="M4 7h16v10H4z" />
                    <path d="M4 11h16" />
                  </svg>
                </div>
              </label>
            </div>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-6 text-slate-600">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <span className="text-sm font-bold">i</span>
                </div>
                <p className="text-[15px] leading-8 italic">
                  The order is created on the Nest backend. If Razorpay is configured, you will be redirected to a hosted checkout session. Otherwise, the order completes locally for development.
                </p>
              </div>
            </div>

            <div className="my-8 h-px bg-slate-200" />

            <div>
              <label className="mb-3 block text-lg font-semibold text-slate-900">Coupon Code</label>
              <div className="flex gap-3">
                <input
                  value={couponDraft}
                  onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="h-14 flex-1 rounded-2xl border border-slate-300 bg-white px-5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="h-14 rounded-2xl bg-slate-200 px-6 text-base font-medium text-slate-900 transition hover:bg-slate-300"
                >
                  Apply
                </button>
              </div>
              {couponCode ? <p className="mt-3 text-sm text-emerald-700">Coupon applied for checkout: {couponCode}</p> : null}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Order Summary</h2>

              <div className="mt-8 flex gap-4">
                <img src={course.thumbnail} alt={course.title} className="h-28 w-28 rounded-2xl object-cover shadow-sm" />
                <div className="flex-1 pt-1">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">E-Course</div>
                  <div className="mt-1 text-[17px] font-medium leading-7 text-slate-950">{course.title}</div>
                  <div className="mt-2 text-sm text-slate-600">★ {course.rating ? course.rating.toFixed(1) : '4.9'} ({course.reviews.toLocaleString()} reviews)</div>
                </div>
              </div>

              <div className="my-8 h-px bg-slate-200" />

              <div className="space-y-4 text-[15px]">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatMoney(subtotalCents)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-medium">-{formatMoney(discountCents)}</span>
                </div>
              </div>

              <div className="my-6 h-px bg-slate-200" />

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Total Amount</div>
                  <div className="mt-2 text-5xl font-extrabold tracking-tight text-indigo-600">{formatMoney(totalCents)}</div>
                </div>
                <div className="pb-3 text-sm italic text-slate-500">Inclusive of all taxes</div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || alreadyEnrolled}
                className="mt-8 inline-flex h-16 w-full items-center justify-center gap-3 rounded-full bg-indigo-600 px-6 text-xl font-bold text-white shadow-[0_18px_40px_rgba(67,56,202,0.35)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {alreadyEnrolled ? 'Already Enrolled' : submitting ? 'Processing...' : 'Complete Checkout'}
                <ArrowRight className="h-6 w-6" />
              </button>

              <p className="mt-6 text-center text-sm leading-6 text-slate-600">
                By completing your purchase, you agree to our <Link href="/terms" className="text-indigo-600">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600">Privacy Policy</Link>.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">Need help?</div>
                    <div className="text-sm text-slate-600">Talk to our learning experts</div>
                  </div>
                </div>
                <button type="button" className="rounded-2xl border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100">
                  Chat Now
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-4 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-5 text-slate-800 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <span className="font-medium">256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <span className="font-medium">30-Day Money Back Guarantee</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="text-lg font-semibold text-indigo-600">CourseForge</div>
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">World-class learning for anyone, anywhere. Build your skills with live courses, structured progress, and certificates.</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Platform</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Browse Catalog</li>
                <li>Dashboard</li>
                <li>Settings</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Roles</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Students</li>
                <li>Instructors</li>
                <li>Platform Admins</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Account</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Sign Out</li>
                <li>Help Center</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">© 2026 CourseForge. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
