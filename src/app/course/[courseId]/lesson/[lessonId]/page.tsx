'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Play } from 'lucide-react';
import { addLessonDiscussionComment, getEnrollmentDetails, getLessonActivity, getMyCertificates, submitAssignment, submitQuizAttempt, updateLessonProgress } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';

export default function VideoLesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { user } = useProtectedPage(['STUDENT']);
  const { addToast } = useToast();
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [completionCertificate, setCompletionCertificate] = useState<any | null>(null);
  const [quizSelection, setQuizSelection] = useState<Record<number, number>>({});
  const [assignmentText, setAssignmentText] = useState('');
  const [lessonActivity, setLessonActivity] = useState<any | null>(null);
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [discussionMessage, setDiscussionMessage] = useState('');

  useEffect(() => {
    if (!user || !courseId) return;
    getEnrollmentDetails(courseId).then(setEnrollment);
  }, [courseId, user]);

  useEffect(() => {
    if (!enrollment?.id || !lessonId) {
      return;
    }

    getLessonActivity(enrollment.id, lessonId)
      .then(setLessonActivity)
      .catch(() => setLessonActivity(null));
  }, [enrollment?.id, lessonId]);

  const lessonData = useMemo(() => {
    const modules = enrollment?.course.modules ?? [];
    for (const module of modules) {
      const lesson = module.lessons.find((entry: any) => entry.id === lessonId);
      if (lesson) {
        return { module, lesson };
      }
    }
    return null;
  }, [enrollment, lessonId]);

  const completedLessonIds = new Set((enrollment?.lessonProgress ?? []).filter((entry: any) => entry.isCompleted).map((entry: any) => entry.lessonId));
  const lessonList = (enrollment?.course.modules ?? []).flatMap((module: any) =>
    module.lessons.map((lesson: any) => ({ ...lesson, moduleTitle: module.title })),
  );
  const currentIndex = lessonList.findIndex((lesson: any) => lesson.id === lessonId);
  const previousLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

  if (!lessonData) {
    return <div className="min-h-screen bg-gray-950 text-white p-10">Loading lesson...</div>;
  }

  const lessonContent = lessonData.lesson.content as any;
  const quizQuestions = Array.isArray(lessonContent?.questions)
    ? lessonContent.questions
    : lessonContent?.question
      ? [{
          prompt: lessonContent.question,
          options: lessonContent.options ?? [],
          correctIndex: lessonContent.correctIndex,
          explanation: lessonContent.explanation,
        }]
      : [];

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950 z-10">
          <Link href={`/courses/${courseId}`} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </Link>
          <div className="text-sm font-medium">{lessonData.module.title}</div>
          <button
            onClick={async () => {
              if (!enrollment) return;
              setSaving(true);
              try {
                await updateLessonProgress(enrollment.id, lessonData.lesson.id, { isCompleted: true, watchedSeconds: lessonData.lesson.durationSeconds || 0 });
                const refreshed = await getEnrollmentDetails(courseId);
                setEnrollment(refreshed);
                if (refreshed.status === 'COMPLETED' || refreshed.progressPercent >= 100) {
                  const certificates = await getMyCertificates();
                  const matching = certificates.find((entry) => entry.courseId === courseId);
                  setCompletionCertificate(matching || null);
                }
                addToast('Lesson marked complete.', 'success');
              } catch (error) {
                addToast(error instanceof Error ? error.message : 'Unable to update progress', 'error');
              } finally {
                setSaving(false);
              }
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500"
          >
            {saving ? 'Saving...' : 'Mark Complete'}
          </button>
        </div>

        <div className="flex-1 bg-black relative overflow-auto">
          {lessonData.lesson.type === 'video' && (
            <div className="h-full flex items-center justify-center relative">
              <img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-brand-600/90 hover:bg-brand-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 shadow-2xl shadow-brand-500/50">
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end px-6 pb-4">
                <div className="w-full">
                  <div className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer">
                    <div className="w-1/3 h-full bg-brand-500 rounded-full relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-300">
                    <span>{lessonData.lesson.duration}</span>
                    <span>{Math.round(enrollment?.progressPercent ?? 0)}% complete</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {lessonData.lesson.type === 'reading' && (
            <div className="mx-auto max-w-4xl px-8 py-12">
              <div className="mb-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Reading Lesson</div>
                <p className="mt-3 text-lg text-gray-300">{lessonData.lesson.description}</p>
              </div>
              <div className="space-y-6">
                {(lessonContent?.sections ?? []).map((section: any, index: number) => (
                  <div key={`${section.heading}-${index}`} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
                    <h3 className="text-xl font-black text-white">{section.heading}</h3>
                    <p className="mt-3 leading-8 text-gray-300">{section.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lessonData.lesson.type === 'quiz' && (
            <div className="mx-auto max-w-3xl px-8 py-12">
              <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Knowledge Check</div>
                <h3 className="mt-4 text-2xl font-black text-white">{lessonData.lesson.title}</h3>
                <div className="mt-8 space-y-8">
                  {quizQuestions.map((question: any, questionIndex: number) => (
                    <div key={`${question.prompt}-${questionIndex}`} className="rounded-3xl border border-gray-800 bg-black/20 p-5">
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-400">Question {questionIndex + 1}</div>
                      <div className="mt-3 text-lg font-black text-white">{question.prompt}</div>
                      <div className="mt-5 space-y-3">
                        {(question.options ?? []).map((option: string, optionIndex: number) => (
                          <button
                            key={`${option}-${optionIndex}`}
                            onClick={() => setQuizSelection((current) => ({ ...current, [questionIndex]: optionIndex }))}
                            className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-bold transition ${
                              quizSelection[questionIndex] === optionIndex ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-gray-800 bg-black/30 text-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {quizSelection[questionIndex] !== undefined && (
                        <div className="mt-4 rounded-2xl bg-black/30 p-4 text-sm text-gray-300">
                          {quizSelection[questionIndex] === question.correctIndex ? 'Correct. ' : 'Review this one. '}
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (!enrollment || quizQuestions.length === 0 || Object.keys(quizSelection).length !== quizQuestions.length) return;
                    setSubmittingActivity(true);
                    try {
                      await submitQuizAttempt(enrollment.id, lessonId, {
                        answers: quizQuestions.map((_: any, index: number) => quizSelection[index]),
                      });
                      const activity = await getLessonActivity(enrollment.id, lessonId);
                      setLessonActivity(activity);
                      addToast('Quiz attempt submitted.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to submit quiz attempt', 'error');
                    } finally {
                      setSubmittingActivity(false);
                    }
                  }}
                  disabled={quizQuestions.length === 0 || Object.keys(quizSelection).length !== quizQuestions.length || submittingActivity}
                  className="mt-6 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {submittingActivity ? 'Submitting...' : 'Submit Quiz Attempt'}
                </button>
                {(lessonActivity?.quiz?.attempts?.length ?? 0) > 0 && (
                  <div className="mt-6 rounded-2xl bg-black/30 p-4 text-sm text-gray-300">
                    Latest score: {lessonActivity.quiz.attempts[0].score}% {lessonActivity.quiz.attempts[0].score >= (lessonActivity.quiz.passingScore ?? 70) ? '• Passed' : '• Review and retry'}
                  </div>
                )}
              </div>
            </div>
          )}

          {lessonData.lesson.type === 'assignment' && (
            <div className="mx-auto max-w-4xl px-8 py-12">
              <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Assignment</div>
                <p className="mt-4 text-lg leading-8 text-gray-300">{lessonContent?.brief || lessonData.lesson.description}</p>
                <div className="mt-6 space-y-2">
                  {(lessonContent?.deliverables ?? []).map((item: string, index: number) => (
                    <div key={`${item}-${index}`} className="rounded-2xl bg-black/30 px-4 py-3 text-sm font-bold text-gray-200">
                      {item}
                    </div>
                  ))}
                </div>
                <textarea
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  placeholder="Write your assignment response or implementation outline here."
                  className="mt-6 min-h-40 w-full rounded-2xl border border-gray-800 bg-black/30 px-4 py-4 text-sm text-white outline-none"
                />
                <button
                  onClick={async () => {
                    if (!enrollment || !assignmentText.trim()) return;
                    setSubmittingActivity(true);
                    try {
                      await submitAssignment(enrollment.id, lessonId, { content: assignmentText });
                      const activity = await getLessonActivity(enrollment.id, lessonId);
                      setLessonActivity(activity);
                      addToast('Assignment submitted.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to submit assignment', 'error');
                    } finally {
                      setSubmittingActivity(false);
                    }
                  }}
                  disabled={!assignmentText.trim() || submittingActivity}
                  className="mt-6 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {submittingActivity ? 'Submitting...' : 'Submit Assignment'}
                </button>
                {(lessonActivity?.assignment?.submissions?.length ?? 0) > 0 && (
                  <div className="mt-6 rounded-2xl bg-black/30 p-4 text-sm text-gray-300">
                    <div>Latest submission: {new Date(lessonActivity.assignment.submissions[0].submittedAt).toLocaleString()}</div>
                    {lessonActivity.assignment.submissions[0].score !== null && lessonActivity.assignment.submissions[0].score !== undefined && (
                      <div className="mt-2 text-emerald-300">
                        Graded: {lessonActivity.assignment.submissions[0].score}%{lessonActivity.assignment.submissions[0].feedback ? ` • ${lessonActivity.assignment.submissions[0].feedback}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {lessonData.lesson.type === 'live' && (
            <div className="mx-auto max-w-4xl px-8 py-12">
              <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Live Session</div>
                <p className="mt-4 text-lg text-gray-300">{lessonContent?.note || lessonData.lesson.description}</p>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {(lessonContent?.agenda ?? []).map((item: string, index: number) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-gray-800 bg-black/30 p-5 text-sm font-bold text-gray-200">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center px-8 gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-display font-medium">{lessonData.lesson.title}</h2>
          </div>
          {previousLesson && (
            <button onClick={() => router.push(`/course/${courseId}/lesson/${previousLesson.id}`)} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
          )}
          {nextLesson && (
            <button onClick={() => router.push(`/course/${courseId}/lesson/${nextLesson.id}`)} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <button className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" /> Discussion
          </button>
        </div>

        <div className="border-t border-gray-800 bg-gray-950/60 px-8 py-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Discussion</div>
              <div className="mt-4 space-y-3 max-h-64 overflow-auto">
                {(lessonActivity?.discussion ?? []).map((comment: any) => (
                  <div key={comment.id} className="rounded-2xl bg-black/30 px-4 py-3">
                    <div className="text-sm font-black text-white">{comment.user.firstName} {comment.user.lastName}</div>
                    <div className="mt-1 text-sm text-gray-300">{comment.message}</div>
                  </div>
                ))}
                {(lessonActivity?.discussion?.length ?? 0) === 0 && (
                  <div className="text-sm text-gray-400">No discussion yet for this lesson.</div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <textarea value={discussionMessage} onChange={(e) => setDiscussionMessage(e.target.value)} placeholder="Ask a question or share an insight" className="min-h-24 flex-1 rounded-2xl border border-gray-800 bg-black/30 px-4 py-3 text-sm text-white outline-none" />
                <button
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                  disabled={!discussionMessage.trim()}
                  onClick={async () => {
                    if (!enrollment || !discussionMessage.trim()) return;
                    try {
                      await addLessonDiscussionComment(enrollment.id, lessonId, discussionMessage.trim());
                      setLessonActivity(await getLessonActivity(enrollment.id, lessonId));
                      setDiscussionMessage('');
                      addToast('Discussion comment posted.', 'success');
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : 'Unable to post comment', 'error');
                    }
                  }}
                >
                  Post
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Course Announcements</div>
              <div className="mt-4 space-y-3 max-h-64 overflow-auto">
                {(lessonActivity?.announcements ?? []).map((announcement: any) => (
                  <div key={announcement.id} className="rounded-2xl bg-black/30 px-4 py-3">
                    <div className="text-sm font-black text-white">{announcement.title}</div>
                    <div className="mt-1 text-sm text-gray-300">{announcement.body}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {announcement.author.firstName} {announcement.author.lastName} • {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {(lessonActivity?.announcements?.length ?? 0) === 0 && (
                  <div className="text-sm text-gray-400">No announcements yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {completionCertificate && (
          <div className="border-t border-emerald-800 bg-emerald-950/70 px-8 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                  <Award className="w-4 h-4" /> Course Completed
                </div>
                <div className="mt-2 text-sm text-emerald-100">Your certificate is ready for this course.</div>
              </div>
              <Link href={`/certificate/${completionCertificate.id}`} className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">
                View Certificate
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h3 className="font-semibold text-lg mb-1">Course Content</h3>
          <p className="text-xs text-gray-400">{Math.round(enrollment?.progressPercent ?? 0)}% Completed</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(enrollment?.course.modules ?? []).map((module: any) => (
            <div key={module.id} className="border-b border-gray-800">
              <div className="p-4 bg-gray-800/50 font-medium text-sm text-gray-200">{module.title}</div>
              <div>
                {module.lessons.map((lesson: any) => {
                  const active = lesson.id === lessonId;
                  const completed = completedLessonIds.has(lesson.id);
                  return (
                    <Link key={lesson.id} href={`/course/${courseId}/lesson/${lesson.id}`} className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-800 transition-colors ${active ? 'bg-gray-800 border-l-2 border-brand-500' : ''}`}>
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${completed ? 'text-brand-500' : 'text-gray-600'}`} />
                      <div>
                        <div className={`text-sm font-medium mb-1 ${active ? 'text-brand-400' : 'text-gray-300'}`}>{lesson.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Play className="w-3 h-3" /> {lesson.duration}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
