'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Play, ChevronDown, ChevronUp, Volume2, Pause, BookOpen, Video, HelpCircle, ClipboardList, Radio } from 'lucide-react';
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
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(true);

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

  // Auto-expand current lesson's module on load
  useEffect(() => {
    if (lessonData?.module?.id) {
      setExpandedModules((prev) => ({
        ...prev,
        [lessonData.module.id]: true,
      }));
    }
  }, [lessonData?.module?.id]);

  // Clean up speech synthesis on unmount or lesson change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lessonId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      addToast('Text-to-speech is not supported in this browser.', 'error');
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    const textToRead = `${lessonData?.lesson?.title}. ${lessonData?.lesson?.description}. ` + sections.map((s: any) => `${s.heading}. ${s.body}`).join('\n\n');
    if (!textToRead) {
      addToast('No reading content available to read.', 'warning');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => {
      setIsPlayingSpeech(false);
    };
    utterance.onerror = () => {
      setIsPlayingSpeech(false);
    };

    setIsPlayingSpeech(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const getLessonIcon = (type: string) => {
    const normType = type?.toLowerCase();
    switch (normType) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'reading':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-purple-400" />;
      case 'assignment':
        return <ClipboardList className="w-3.5 h-3.5 text-rose-400" />;
      case 'live':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Play className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const lessonType = lessonData?.lesson?.type?.toLowerCase();
  const lessonContent = lessonData?.lesson?.content as any;

  const sections = useMemo(() => {
    if (!lessonContent) return [];
    if (Array.isArray(lessonContent?.sections)) {
      return lessonContent.sections;
    }
    if (Array.isArray(lessonContent?.body)) {
      return lessonContent.body.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          const parts = item.split(':');
          const heading = parts[0] ? parts[0].trim() : `Section ${idx + 1}`;
          const body = parts.slice(1).join(':').trim() || item;
          return { heading, body };
        }
        return { heading: item.heading || `Section ${idx + 1}`, body: item.body || '' };
      });
    }
    if (typeof lessonContent?.body === 'string') {
      return [{ heading: 'Overview', body: lessonContent.body }];
    }
    return [];
  }, [lessonContent]);

  const quizQuestions = useMemo(() => {
    const rawQuestions = Array.isArray(lessonActivity?.quiz?.questions)
      ? lessonActivity.quiz.questions
      : Array.isArray(lessonContent?.questions)
        ? lessonContent.questions
        : lessonContent?.question
          ? [{
              prompt: lessonContent.question,
              options: lessonContent.options ?? [],
              correctIndex: lessonContent.correctIndex,
              explanation: lessonContent.explanation,
            }]
          : [];

    return rawQuestions.map((q: any) => {
      const prompt = q.prompt || q.question || '';
      const options = Array.isArray(q.options) ? q.options : [];
      let correctIndex = q.correctIndex;
      if (correctIndex === undefined && q.answer !== undefined) {
        const idx = options.findIndex((opt: string) => opt === q.answer);
        correctIndex = idx >= 0 ? idx : 0;
      }
      return {
        prompt,
        options,
        correctIndex: correctIndex ?? 0,
        explanation: q.explanation || '',
      };
    });
  }, [lessonContent, lessonActivity]);

  if (!lessonData) {
    return <div className="min-h-screen bg-gray-950 text-white p-10">Loading lesson...</div>;
  }

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
          {lessonType === 'video' && (
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

          {lessonType === 'reading' && (
            <div className="mx-auto max-w-6xl w-full px-8 py-12">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Reading Lesson</div>
                  <h2 className="mt-1 text-2xl font-black text-white">{lessonData.lesson.title}</h2>
                  <p className="mt-3 text-lg text-gray-300">{lessonData.lesson.description}</p>
                </div>
                <button
                  onClick={toggleSpeech}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-800 bg-gray-900 hover:bg-gray-800 text-sm font-semibold text-white transition-all shadow-md shrink-0 hover:border-brand-500/50"
                  title="Listen to this lesson read aloud"
                >
                  {isPlayingSpeech ? (
                    <>
                      <Pause className="w-4 h-4 text-brand-500 animate-pulse" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-brand-400" />
                      <span>Listen Lesson</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-6">
                {sections.map((section: any, index: number) => (
                  <div key={`${section.heading}-${index}`} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 overflow-hidden">
                    <h3 className="text-xl font-black text-white">{section.heading}</h3>
                    <p className="mt-3 leading-8 text-gray-300">{section.body}</p>
                    
                    {(section.imageUrl || section.image) && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-800/80 bg-black/40 shadow-inner">
                        <img 
                          src={section.imageUrl || section.image} 
                          alt={section.heading} 
                          className="w-full max-h-[380px] object-cover transition-transform duration-500 hover:scale-[1.02]" 
                        />
                      </div>
                    )}

                    {section.diagram && (
                      <div className="mt-6 rounded-2xl bg-black/40 border border-gray-800/80 p-6 flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
                        {section.diagram.split('->').map((step: string, sIdx: number, arr: any[]) => (
                          <div key={sIdx} className="flex flex-col md:flex-row items-center gap-4">
                            <div className="px-5 py-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-white font-bold text-sm tracking-wide text-center shadow-lg min-w-[140px]">
                              {step.trim()}
                            </div>
                            {sIdx < arr.length - 1 && (
                              <span className="text-brand-400 font-extrabold rotate-90 md:rotate-0 text-xl">
                                →
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lessonType === 'quiz' && (
            <div className="mx-auto max-w-6xl w-full px-8 py-12">
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

          {lessonType === 'assignment' && (
            <div className="mx-auto max-w-6xl w-full px-8 py-12">
              <div className="rounded-[2rem] border border-gray-800 bg-gray-900/70 p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-400">Assignment</div>
                <p className="mt-4 text-lg leading-8 text-gray-300">{lessonActivity?.assignment?.description || lessonContent?.brief || lessonData.lesson.description}</p>
                <div className="mt-6 space-y-2">
                  {(lessonActivity?.assignment?.deliverables || lessonContent?.deliverables || []).map((item: string, index: number) => (
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

          {lessonType === 'live' && (
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
          <button 
            onClick={() => setShowBottomPanel(!showBottomPanel)} 
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${showBottomPanel ? 'text-brand-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" /> Discussion
          </button>
        </div>

        <div className="border-t border-gray-800 bg-gray-950/40">
          <button 
            onClick={() => setShowBottomPanel(!showBottomPanel)}
            className="w-full h-8 flex items-center justify-center bg-gray-900/20 hover:bg-gray-900/40 transition-colors border-b border-gray-800/30 text-gray-500 hover:text-gray-300 gap-1.5"
            title={showBottomPanel ? "Hide Discussion & Announcements" : "Show Discussion & Announcements"}
          >
            {showBottomPanel ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider">Hide Panel</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider">Show Discussion & Announcements</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {showBottomPanel && (
            <div className="px-8 py-6">
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
          )}
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
          {(enrollment?.course.modules ?? []).map((module: any) => {
            const isModuleCompleted = module.lessons.length > 0 && module.lessons.every((lesson: any) => completedLessonIds.has(lesson.id));
            const isExpanded = !!expandedModules[module.id];
            return (
              <div key={module.id} className="border-b border-gray-800">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className={`w-full p-4 font-semibold text-sm flex items-center justify-between text-left transition-colors hover:bg-gray-800/40 ${
                    isModuleCompleted 
                      ? 'bg-emerald-950/20 text-emerald-400 border-b border-emerald-950/30' 
                      : 'bg-gray-800/50 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isModuleCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    )}
                    <span>{module.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="bg-gray-950/50">
                    {module.lessons.map((lesson: any) => {
                      const active = lesson.id === lessonId;
                      const completed = completedLessonIds.has(lesson.id);
                      return (
                        <Link 
                          key={lesson.id} 
                          href={`/course/${courseId}/lesson/${lesson.id}`} 
                          className={`flex items-start gap-3 p-4 pl-6 cursor-pointer hover:bg-gray-800 transition-colors ${
                            active 
                              ? 'bg-gray-800 border-l-2 border-brand-500' 
                              : completed 
                                ? 'bg-emerald-950/5' 
                                : ''
                          }`}
                        >
                          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${completed ? 'text-emerald-500' : 'text-gray-600'}`} />
                          <div>
                            <div className={`text-sm font-medium mb-1 ${
                              active 
                                ? 'text-brand-400 font-semibold' 
                                : completed 
                                  ? 'text-emerald-400/90' 
                                  : 'text-gray-300'
                            }`}>{lesson.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1.5">
                                {getLessonIcon(lesson.type)}
                                <span className="capitalize">{lesson.type?.toLowerCase()}</span>
                              </span>
                              <span>•</span>
                              <span>{lesson.duration || '5m'}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
