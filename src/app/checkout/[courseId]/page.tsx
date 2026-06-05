'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { createCheckout, completeOrder, getCourse, getEnrollmentByCourse } from '@/lib/api';
import { Course } from '@/types';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';

export default function Checkout() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { loading: authLoading } = useProtectedPage(['STUDENT']);
  const { addToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [pricingPreview, setPricingPreview] = useState<{ subtotalCents: number; discountCents: number; totalCents: number } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    Promise.allSettled([getCourse(courseId), getEnrollmentByCourse(courseId)])
      .then(([courseResult, enrollmentResult]) => {
        if (courseResult.status === 'fulfilled') {
          setCourse(courseResult.value);
        }
        if (enrollmentResult.status === 'fulfilled') {
          setAlreadyEnrolled(true);
        } else {
          setAlreadyEnrolled(false);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleCheckout = async () => {
    if (!course) return;
    if (alreadyEnrolled) {
      addToast('You are already enrolled in this course.', 'info');
      router.push('/dashboard/student');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createCheckout([course.id], couponCode.trim() || undefined);
      setPricingPreview({
        subtotalCents: result.subtotalCents,
        discountCents: result.discountCents,
        totalCents: result.totalCents,
      });
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
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-gray-50 p-10"><div className="max-w-5xl mx-auto h-[60vh] bg-white rounded-2xl animate-pulse" /></div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center">Course not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
        <Link href={`/courses/${course.id}`} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-full flex justify-center">
          <div className="text-xl font-display font-bold tracking-tight text-gray-950 flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white text-xs">C</div>
            CourseForge Checkout
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 border-2 border-brand-500 bg-brand-50 rounded-xl cursor-pointer">
                <input type="radio" name="payment" className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" defaultChecked />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-600" /> Card / Hosted Checkout
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gray-50 text-sm text-gray-600">
              The order is created on the Nest backend. If Stripe is configured, you will be redirected to a hosted checkout session. Otherwise, the order completes locally for development.
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Coupon Code</label>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Optional coupon"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" /> Payments and enrollments are handled through the LMS backend.
          </p>
        </div>

        <div className="w-full md:w-96 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-8 shadow-sm">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="flex gap-4">
                <img src={course.thumbnail} className="w-20 h-14 object-cover rounded shadow-sm" alt="course" />
                <div className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{course.title}</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>${((pricingPreview?.subtotalCents ?? Math.round(course.price * 100)) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Discount</span>
                <span className="text-green-600">-${((pricingPreview?.discountCents ?? 0) / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-3xl font-display font-bold text-gray-900">${((pricingPreview?.totalCents ?? Math.round(course.price * 100)) / 100).toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} disabled={submitting || alreadyEnrolled} className="w-full mt-6 bg-brand-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-60">
                {alreadyEnrolled ? 'Already Enrolled' : submitting ? 'Processing...' : 'Complete Checkout'}
              </button>
              <div className="text-xs text-gray-500 mt-4 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                <span>By proceeding, your order will be recorded and the course will be enrolled into your dashboard on successful payment.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
