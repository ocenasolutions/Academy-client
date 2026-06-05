'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, DollarSign, Megaphone, PlusCircle, Save, TrendingUp, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AiCourseStudio } from '@/components/AiCourseStudio';
import { createCourseAnnouncement, getCategories, getInstructorAnalytics, getInstructorWorkspace, gradeAssignmentSubmission, updateCourseCurriculum } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { InstructorAnalytics } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function InstructorDashboard() {
  const { user } = useProtectedPage(['INSTRUCTOR']);
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [workspace, setWorkspace] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [announcement, setAnnouncement] = useState({ title: '', body: '' });
  const [gradingState, setGradingState] = useState<Record<string, { score: string; feedback: string }>>({});
  const [curriculumDraft, setCurriculumDraft] = useState<any[]>([]);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  async function load() {
    const [nextAnalytics, nextWorkspace, nextCategories] = await Promise.all([
      getInstructorAnalytics(),
      getInstructorWorkspace(),
      getCategories(),
    ]);
    setAnalytics(nextAnalytics);
    setWorkspace(nextWorkspace);
    setCategories(nextCategories);
    if (!selectedCourseId && nextWorkspace[0]?.id) {
      setSelectedCourseId(nextWorkspace[0].id);
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const chartData = useMemo(() => {
    return (analytics?.courses ?? []).map((course) => ({
      name: course.title.length > 12 ? `${course.title.slice(0, 12)}…` : course.title,
      enrollments: course.students,
      progress: Math.round(course.progressPercent ?? analytics?.averageProgressPercent ?? 0),
    }));
  }, [analytics]);

  const selectedCourse = useMemo(() => workspace.find((course) => course.id === selectedCourseId) ?? workspace[0] ?? null, [workspace, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourse) return;
    setCurriculumDraft(
      (selectedCourse.modules ?? []).map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? '',
        lessons: module.lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? '',
          type: lesson.type,
          durationSeconds: lesson.durationSeconds ?? 0,
          isPreview: lesson.isPreview ?? false,
          content: lesson.content ?? {},
        })),
      })),
    );
  }, [selectedCourse]);

  return (
    <DashboardLayout role="instructor">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-heading)]">Instructor Workspace</h1>
          <p className="mt-2 text-[var(--color-text-main)]/70 font-medium">Manage curriculum, announcements, and grading from one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedCourse?.id ?? ''} onChange={(e) => setSelectedCourseId(e.target.value)} className="clay-input !py-3 min-w-64">
            {workspace.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="clay p-6"><div className="flex items-center gap-5"><div className="p-4 rounded-2xl shadow-inner bg-[var(--glass-bg)]"><Users className="w-7 h-7 text-[var(--color-text-heading)]" /></div><div><div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-1">Total Students</div><div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{analytics?.totalStudents ?? '...'}</div></div></div></div>
        <div className="clay p-6"><div className="flex items-center gap-5"><div className="p-4 rounded-2xl shadow-inner bg-brand-500/20"><DollarSign className="w-7 h-7 text-brand-600" /></div><div><div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-1">Published Courses</div><div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{analytics?.publishedCourses ?? '...'}</div></div></div></div>
        <div className="clay p-6"><div className="flex items-center gap-5"><div className="p-4 rounded-2xl shadow-inner bg-indigo-500/20"><BookOpen className="w-7 h-7 text-indigo-600" /></div><div><div className="text-sm font-bold text-[var(--color-text-main)]/60 mb-1">Average Progress</div><div className="text-3xl font-display font-black text-[var(--color-text-heading)]">{analytics ? `${Math.round(analytics.averageProgressPercent)}%` : '...'}</div></div></div></div>
      </div>

      <div className="mb-10">
        <AiCourseStudio
          role="instructor"
          onCourseApplied={async (courseId) => {
            await load();
            setSelectedCourseId(courseId);
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 clay p-8">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] flex items-center gap-2 mb-8">
            <TrendingUp className="w-6 h-6 text-brand-500" /> Course Performance
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="instructorPerformance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-500, #3b82f6)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand-500, #3b82f6)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="enrollments" stroke="var(--brand-500, #3b82f6)" strokeWidth={3} fillOpacity={1} fill="url(#instructorPerformance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clay p-8">
          <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Course Snapshot</h2>
          {selectedCourse ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-[var(--glass-bg)] p-5">
                <div className="font-black text-[var(--color-text-heading)]">{selectedCourse.title}</div>
                <div className="mt-1 text-sm text-[var(--color-text-main)]/70">{selectedCourse.summary}</div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-xl bg-brand-500/10 px-3 py-2 text-brand-600">{selectedCourse.status}</span>
                  <span className="rounded-xl bg-[var(--color-bg-main)] px-3 py-2 text-[var(--color-text-main)]">{selectedCourse.category?.name ?? 'Uncategorized'}</span>
                </div>
              </div>
              <div className="rounded-3xl bg-[var(--glass-bg)] p-5">
                <div className="text-sm font-bold text-[var(--color-text-main)]/60">Available categories</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.slice(0, 8).map((category) => (
                    <span key={category.id} className="rounded-xl bg-white/50 px-3 py-2 text-xs font-black text-[var(--color-text-heading)]">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-main)]/70">Create a course to unlock the workspace.</div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="clay p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)]">Curriculum Builder</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-main)]/70">Refine modules and lessons for the selected course.</p>
                </div>
                <button
                  disabled={savingCurriculum}
                  onClick={async () => {
                    setSavingCurriculum(true);
                    try {
                      await updateCourseCurriculum(selectedCourse.id, { modules: curriculumDraft });
                      await load();
                      addToast('Curriculum updated.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to update curriculum', 'error');
                    } finally {
                      setSavingCurriculum(false);
                    }
                  }}
                  className="clay-btn inline-flex items-center gap-2 px-5 py-3"
                >
                  <Save className="w-4 h-4" /> {savingCurriculum ? 'Saving...' : 'Save Curriculum'}
                </button>
              </div>

              <div className="space-y-6">
                {curriculumDraft.map((module, moduleIndex) => (
                  <div key={module.id ?? moduleIndex} className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
                    <input value={module.title} onChange={(e) => setCurriculumDraft((current) => current.map((entry, index) => index === moduleIndex ? { ...entry, title: e.target.value } : entry))} className="clay-input !py-3 font-black" placeholder="Module title" />
                    <textarea value={module.description} onChange={(e) => setCurriculumDraft((current) => current.map((entry, index) => index === moduleIndex ? { ...entry, description: e.target.value } : entry))} className="clay-input mt-3 min-h-24 !py-3" placeholder="Module description" />
                    <div className="mt-4 space-y-3">
                      {module.lessons.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id ?? lessonIndex} className="rounded-2xl bg-white/60 p-4">
                          <div className="grid gap-3 md:grid-cols-3">
                            <input value={lesson.title} onChange={(e) => setCurriculumDraft((current) => current.map((entry, entryIndex) => entryIndex === moduleIndex ? { ...entry, lessons: entry.lessons.map((lessonEntry: any, currentLessonIndex: number) => currentLessonIndex === lessonIndex ? { ...lessonEntry, title: e.target.value } : lessonEntry) } : entry))} className="clay-input !py-3 md:col-span-2" placeholder="Lesson title" />
                            <select value={lesson.type} onChange={(e) => setCurriculumDraft((current) => current.map((entry, entryIndex) => entryIndex === moduleIndex ? { ...entry, lessons: entry.lessons.map((lessonEntry: any, currentLessonIndex: number) => currentLessonIndex === lessonIndex ? { ...lessonEntry, type: e.target.value } : lessonEntry) } : entry))} className="clay-input !py-3">
                              <option value="VIDEO">VIDEO</option>
                              <option value="READING">READING</option>
                              <option value="QUIZ">QUIZ</option>
                              <option value="ASSIGNMENT">ASSIGNMENT</option>
                              <option value="LIVE">LIVE</option>
                            </select>
                          </div>
                          <textarea value={lesson.description} onChange={(e) => setCurriculumDraft((current) => current.map((entry, entryIndex) => entryIndex === moduleIndex ? { ...entry, lessons: entry.lessons.map((lessonEntry: any, currentLessonIndex: number) => currentLessonIndex === lessonIndex ? { ...lessonEntry, description: e.target.value } : lessonEntry) } : entry))} className="clay-input mt-3 min-h-20 !py-3" placeholder="Lesson description" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="clay p-8">
              <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Assignment Grading Queue</h2>
              <div className="space-y-4">
                {selectedCourse.modules.flatMap((module: any) => module.lessons).filter((lesson: any) => lesson.assignment?.submissions?.length).map((lesson: any) => (
                  <div key={lesson.id} className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
                    <div className="font-black text-[var(--color-text-heading)]">{lesson.title}</div>
                    <div className="mt-4 space-y-3">
                      {lesson.assignment.submissions.map((submission: any) => (
                        <div key={submission.id} className="rounded-2xl bg-white/60 p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="font-black text-[var(--color-text-heading)]">{submission.user.firstName} {submission.user.lastName}</div>
                              <div className="mt-1 text-sm text-[var(--color-text-main)]/70 whitespace-pre-wrap">{submission.content || submission.submissionUrl || 'No submission content.'}</div>
                              {submission.score !== null && submission.score !== undefined && (
                                <div className="mt-2 text-xs font-black text-emerald-600">Current grade: {submission.score}%</div>
                              )}
                            </div>
                            <div className="grid gap-2 md:w-72">
                              <input value={gradingState[submission.id]?.score ?? String(submission.score ?? '')} onChange={(e) => setGradingState((current) => ({ ...current, [submission.id]: { score: e.target.value, feedback: current[submission.id]?.feedback ?? submission.feedback ?? '' } }))} placeholder="Score" className="clay-input !py-3" />
                              <textarea value={gradingState[submission.id]?.feedback ?? submission.feedback ?? ''} onChange={(e) => setGradingState((current) => ({ ...current, [submission.id]: { score: current[submission.id]?.score ?? String(submission.score ?? ''), feedback: e.target.value } }))} placeholder="Feedback" className="clay-input min-h-24 !py-3" />
                              <button
                                onClick={async () => {
                                  const scoreValue = Number(gradingState[submission.id]?.score ?? submission.score ?? 0);
                                  try {
                                    await gradeAssignmentSubmission(submission.id, {
                                      score: scoreValue,
                                      feedback: gradingState[submission.id]?.feedback ?? submission.feedback ?? '',
                                    });
                                    await load();
                                    addToast('Assignment graded.', 'success');
                                  } catch (error) {
                                    addToast(error instanceof Error ? error.message : 'Unable to save grade', 'error');
                                  }
                                }}
                                className="clay-btn px-4 py-3"
                              >
                                Save Grade
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedCourse.modules.flatMap((module: any) => module.lessons).every((lesson: any) => !(lesson.assignment?.submissions?.length)) && (
                  <div className="text-sm text-[var(--color-text-main)]/70">No assignment submissions yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="clay p-8">
              <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-500" /> Send Announcement
              </h2>
              <div className="grid gap-3">
                <input value={announcement.title} onChange={(e) => setAnnouncement((current) => ({ ...current, title: e.target.value }))} className="clay-input !py-3" placeholder="Announcement title" />
                <textarea value={announcement.body} onChange={(e) => setAnnouncement((current) => ({ ...current, body: e.target.value }))} className="clay-input min-h-32 !py-3" placeholder="Share a course update, milestone, or reminder." />
                <button
                  disabled={sendingAnnouncement || !announcement.title.trim() || !announcement.body.trim()}
                  onClick={async () => {
                    setSendingAnnouncement(true);
                    try {
                      await createCourseAnnouncement(selectedCourse.id, announcement);
                      setAnnouncement({ title: '', body: '' });
                      await load();
                      addToast('Announcement published.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to create announcement', 'error');
                    } finally {
                      setSendingAnnouncement(false);
                    }
                  }}
                  className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3"
                >
                  <PlusCircle className="w-4 h-4" /> {sendingAnnouncement ? 'Sending...' : 'Publish'}
                </button>
              </div>
            </div>

            <div className="clay p-8">
              <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Recent Announcements</h2>
              <div className="space-y-4">
                {(selectedCourse.announcements ?? []).map((entry: any) => (
                  <div key={entry.id} className="rounded-2xl bg-[var(--glass-bg)] p-4">
                    <div className="font-black text-[var(--color-text-heading)]">{entry.title}</div>
                    <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{entry.body}</div>
                  </div>
                ))}
                {(selectedCourse.announcements?.length ?? 0) === 0 && (
                  <div className="text-sm text-[var(--color-text-main)]/70">No announcements yet.</div>
                )}
              </div>
            </div>

            <div className="clay p-8">
              <h2 className="text-2xl font-display font-black text-[var(--color-text-heading)] mb-6">Reviews</h2>
              <div className="space-y-4">
                {(selectedCourse.reviews ?? []).slice(0, 5).map((review: any) => (
                  <div key={review.id} className="rounded-2xl bg-[var(--glass-bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-[var(--color-text-heading)]">{review.user.firstName} {review.user.lastName}</div>
                      <div className="text-xs font-black text-brand-600">{review.rating}/5 • {review.status}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{review.comment || 'No written review.'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
