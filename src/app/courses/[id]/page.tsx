'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { createCourseReview, getCourse, getCourseAnnouncements, getEnrollmentByCourse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { Award, CheckSquare, Clock, Globe, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/contexts/ToastContext';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCourse(id)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
    getCourseAnnouncements(id).then(setAnnouncements).catch(() => setAnnouncements([]));
  }, [id]);

  useEffect(() => {
    if (!id || !user || user.role !== 'STUDENT') {
      setEnrollment(null);
      return;
    }

    getEnrollmentByCourse(id)
      .then(setEnrollment)
      .catch(() => setEnrollment(null));
  }, [id, user]);

  const handleEnroll = () => {
    if (!course) return;
    if (!user) {
      addToast('Please sign in to continue to checkout.', 'info');
      navigate.push(`/login?redirect=/checkout/${course.id}`);
      return;
    }
    if (user.role === 'STUDENT' && enrollment) {
      const firstLessonId = enrollment.course.modules[0]?.lessons[0]?.id;
      if (firstLessonId) {
        navigate.push(`/course/${course.id}/lesson/${firstLessonId}`);
        return;
      }
      navigate.push('/dashboard/student');
      return;
    }
    navigate.push(`/checkout/${course.id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="mx-8 my-16 h-[60vh] clay animate-pulse" />
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="mx-8 my-16 clay p-16 text-center">
          <h1 className="text-3xl font-display font-black text-[var(--color-text-heading)] mb-4">Course not found</h1>
          <p className="text-[var(--color-text-main)]/70">This course may have been removed or is no longer available.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-[#4a044e] opacity-90 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center relative z-10 glass mx-4 md:mx-8 rounded-[3rem] mt-6 border border-[var(--glass-border)]">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-brand-950 bg-[var(--glass-bg)] px-4 py-2 rounded-xl backdrop-blur-md">
                {course.category}
              </span>
              <span className="text-white/60">•</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80 border border-[var(--glass-border)] px-4 py-2 rounded-xl">
                {course.level}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black mb-8 leading-tight text-white drop-shadow-md">
              {course.title}
            </h1>
            <p className="text-xl text-brand-100/90 mb-10 max-w-2xl leading-relaxed font-medium">{course.description}</p>

            <div className="flex flex-wrap items-center gap-8 text-sm text-brand-100 mb-10 glass-dark bg-black/20 p-4 rounded-2xl w-fit">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                  <Award className="w-5 h-5" />
                </div>
                <span className="font-black text-white text-lg">{course.reviews}</span>
                <span className="font-medium opacity-80">reviews</span>
              </div>
              <div className="flex items-center gap-2 font-bold bg-[var(--glass-bg)] px-4 py-2 rounded-xl">
                <Globe className="w-5 h-5" /> {course.language?.toUpperCase() || 'EN'}
              </div>
            </div>

            <div className="flex items-center gap-5 bg-[var(--glass-bg)] p-3 pr-6 rounded-2xl w-fit backdrop-blur-sm border border-[var(--glass-border)]">
              <img src={course.instructor.avatar} alt={course.instructor.name} className="w-14 h-14 rounded-xl border border-[var(--glass-border)] object-cover shadow-inner" />
              <div>
                <div className="font-black text-white text-lg">{course.instructor.name}</div>
                <div className="text-sm text-brand-200 font-medium">{course.instructor.headline}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 pt-8 lg:pr-8">
            <h2 className="text-3xl font-display font-black text-[var(--color-text-heading)] mb-8">What you'll learn</h2>
            <div className="clay p-10 mb-16 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-brand-500/10"><CheckSquare className="w-48 h-48" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {course.outcomes.map((outcome, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="bg-brand-500 text-white p-2 rounded-xl shadow-inner shrink-0 mt-1">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[var(--color-text-main)] font-bold leading-relaxed">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-3xl font-display font-black text-[var(--color-text-heading)] mb-8">Course Syllabus</h2>
            <div className="space-y-6 mb-12">
              {course.modules.map((module) => (
                <div key={module.id} className="clay overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-[var(--color-text-heading)] mb-2 text-lg">{module.title}</h4>
                      <p className="text-sm font-bold text-[var(--color-text-main)]/60">{module.lessons.length} lessons • {module.duration}</p>
                    </div>
                    <div className="w-10 h-10 bg-[var(--glass-bg)] rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[var(--color-text-main)]/50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-display font-black text-[var(--color-text-heading)] mb-8">Announcements</h2>
            <div className="space-y-4 mb-16">
              {announcements.length === 0 ? (
                <div className="clay p-6 text-sm font-bold text-[var(--color-text-main)]/70">No course announcements yet.</div>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="clay p-6">
                    <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-500">{announcement.author.firstName} {announcement.author.lastName}</div>
                    <div className="mt-2 text-xl font-black text-[var(--color-text-heading)]">{announcement.title}</div>
                    <div className="mt-3 text-[var(--color-text-main)]/75">{announcement.body}</div>
                  </div>
                ))
              )}
            </div>

            {user?.role === 'STUDENT' && enrollment?.status === 'COMPLETED' && (
              <>
                <h2 className="text-3xl font-display font-black text-[var(--color-text-heading)] mb-8">Leave a Review</h2>
                <div className="clay p-8 mb-12">
                  <div className="grid gap-4">
                    <select value={reviewForm.rating} onChange={(e) => setReviewForm((current) => ({ ...current, rating: Number(e.target.value) }))} className="clay-input !py-3">
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                    </select>
                    <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((current) => ({ ...current, comment: e.target.value }))} className="clay-input min-h-28" placeholder="Share what worked well and what could improve." />
                    <button
                      onClick={async () => {
                        try {
                          await createCourseReview(course.id, reviewForm);
                          addToast('Review submitted for moderation.', 'success');
                          setReviewForm({ rating: 5, comment: '' });
                        } catch (error) {
                          addToast(error instanceof Error ? error.message : 'Unable to submit review', 'error');
                        }
                      }}
                      className="clay-btn px-6 py-3 w-fit"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1 relative lg:-mt-72 z-20 hidden lg:block">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="clay p-3 !rounded-[2.5rem] sticky top-32">
              <div className="aspect-video relative overflow-hidden rounded-[2rem] shadow-inner">
                <img src={course.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-brand-950/40 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-20 h-20 glass rounded-[18px] flex items-center justify-center shadow-2xl">
                    <PlayCircle className="w-10 h-10 text-white fill-white/80" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-sm bg-black/20 backdrop-blur-md mx-6 py-2 rounded-xl">Preview this course</div>
              </div>

              <div className="p-8 pt-10">
                <div className="text-5xl font-display font-black text-[var(--color-text-heading)] mb-8 drop-shadow-sm">
                  {enrollment ? 'Enrolled' : `$${course.price.toFixed(2)}`}
                </div>
                <div className="flex flex-col gap-3 mb-6">
                  <button onClick={handleEnroll} className="block w-full clay-btn text-center py-5 text-xl">
                    {enrollment ? 'Resume Learning' : 'Enroll Now'}
                  </button>
                </div>
                <div className="text-center font-bold text-[var(--color-text-main)]/50 mb-8 p-3 bg-[var(--glass-bg)] rounded-xl">30-Day Money-Back Guarantee</div>

                <h4 className="font-black text-[var(--color-text-heading)] mb-6 text-lg">This course includes:</h4>
                <ul className="space-y-4 text-sm font-bold text-[var(--color-text-main)]/70">
                  <li className="flex items-center gap-4"><div className="p-2 bg-[var(--glass-bg)] rounded-lg"><PlayCircle className="w-5 h-5 text-brand-500" /></div> {course.duration} on-demand content</li>
                  <li className="flex items-center gap-4"><div className="p-2 bg-[var(--glass-bg)] rounded-lg"><Award className="w-5 h-5 text-indigo-500" /></div> Certificate of completion</li>
                  <li className="flex items-center gap-4"><div className="p-2 bg-[var(--glass-bg)] rounded-lg"><Clock className="w-5 h-5 text-emerald-500" /></div> Full lifetime access</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
