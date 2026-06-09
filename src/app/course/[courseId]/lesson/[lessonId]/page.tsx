'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Play, ChevronDown, ChevronUp, Volume2, Pause, BookOpen, Video, HelpCircle, ClipboardList, Radio, AlertCircle, Lightbulb, PanelLeft, PanelRight, X, Sparkles, Send, RefreshCw, Brain } from 'lucide-react';
import { addLessonDiscussionComment, getEnrollmentDetails, getLessonActivity, getMyCertificates, submitAssignment, submitQuizAttempt, updateLessonProgress, askAiHelper } from '@/lib/api';
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
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [quizAttemptSubmitted, setQuizAttemptSubmitted] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'discussion' | 'announcements'>('discussion');
  const [currentScrollPercent, setCurrentScrollPercent] = useState(0);
  const [hasScrolled70, setHasScrolled70] = useState(false);

  // Load sidebar preference on mount
  useEffect(() => {
    const savedOpen = localStorage.getItem('course_sidebar_open');
    if (savedOpen !== null) {
      setSidebarOpen(savedOpen === 'true');
    }
    const savedPos = localStorage.getItem('course_sidebar_position');
    if (savedPos === 'left' || savedPos === 'right') {
      setSidebarPosition(savedPos);
    }
  }, []);

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

  useEffect(() => {
    setActiveQuestionIndex(0);
    setQuizSelection({});
    setAiMessages([]);
    setAiInput('');
    setAiLoading(false);
    setQuizAttemptSubmitted(false);
    setShowAiModal(false);
    setCurrentScrollPercent(0);
    setHasScrolled70(false);
  }, [lessonId]);

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

  const hasPassedQuiz = useMemo(() => {
    if (lessonType !== 'quiz') return true;
    if (!lessonActivity?.quiz?.attempts?.length) return false;
    const passingScore = lessonActivity.quiz.passingScore ?? 70;
    return lessonActivity.quiz.attempts.some((attempt: any) => attempt.score >= passingScore);
  }, [lessonType, lessonActivity]);

  const isReadComplete = useMemo(() => {
    if (lessonType !== 'reading') return true;
    if (!lessonData?.lesson?.id) return false;
    return completedLessonIds.has(lessonData.lesson.id) || hasScrolled70;
  }, [lessonType, lessonData?.lesson?.id, completedLessonIds, hasScrolled70]);

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

  const handleAskAi = async (customMessage?: string) => {
    const textToSend = customMessage || aiInput;
    if (!textToSend.trim() || aiLoading) return;
    
    const newUserMsg = { role: 'user' as const, content: textToSend };
    setAiMessages(prev => [...prev, newUserMsg]);
    setAiInput('');
    setAiLoading(true);

    const question = quizQuestions[activeQuestionIndex];
    const questionContext = question 
      ? `Question Prompt: "${question.prompt}". Multiple choice options: ${question.options?.map((o: string, i: number) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}.` 
      : '';

    try {
      const response = await askAiHelper({
        message: textToSend,
        questionContext,
        history: aiMessages.map(m => ({ role: m.role, content: m.content })),
      });

      if (response && response.reply) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      } else {
        setAiMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an issue. Please try again." }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the assistant. Make sure the server is running." }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (!lessonData) {
    return <div className="min-h-screen bg-gray-950 text-white p-10">Loading lesson...</div>;
  }

  const renderSidebar = () => {
    if (!sidebarOpen) return null;
    return (
      <div className={`w-80 bg-[#090d16] ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-slate-900 flex flex-col shrink-0 select-none z-20`}>
        <div className="p-6 border-b border-slate-900 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-white tracking-wide">Course Content</h3>
            <div className="flex flex-col mt-2 gap-1.5">
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(enrollment?.progressPercent ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-slate-400">{Math.round(enrollment?.progressPercent ?? 0)}% Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            {/* Toggle Position Button */}
            <button
              onClick={() => {
                const nextPos = sidebarPosition === 'left' ? 'right' : 'left';
                setSidebarPosition(nextPos);
                localStorage.setItem('course_sidebar_position', nextPos);
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
              title={sidebarPosition === 'left' ? "Move to Right" : "Move to Left"}
            >
              {sidebarPosition === 'left' ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            {/* Collapse Sidebar Button */}
            <button 
              onClick={() => {
                setSidebarOpen(false);
                localStorage.setItem('course_sidebar_open', 'false');
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
              title="Collapse Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {(enrollment?.course.modules ?? []).map((module: any) => {
            const isModuleCompleted = module.lessons.length > 0 && module.lessons.every((lesson: any) => completedLessonIds.has(lesson.id));
            const isExpanded = !!expandedModules[module.id];
            return (
              <div key={module.id} className="border-b border-slate-900">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className={`w-full p-4 font-semibold text-xs flex items-center justify-between text-left transition-colors hover:bg-slate-900/40 bg-[#090d16] text-slate-200`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isModuleCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span>{module.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-450 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-450 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="bg-[#05080e]">
                    {module.lessons.map((lesson: any) => {
                      const active = lesson.id === lessonId;
                      const completed = completedLessonIds.has(lesson.id);

                      // Icon selection based on lesson type
                      let LessonIcon = BookOpen;
                      let iconColor = 'text-slate-400';
                      let bgTheme = 'bg-slate-900/40 border-slate-800/60';
                      
                      const lType = lesson.type?.toUpperCase();
                      if (lType === 'VIDEO') {
                        LessonIcon = Video;
                        iconColor = completed ? 'text-emerald-400' : active ? 'text-blue-400' : 'text-blue-400/80';
                      } else if (lType === 'READING') {
                        LessonIcon = BookOpen;
                        iconColor = completed ? 'text-emerald-440' : active ? 'text-blue-400' : 'text-purple-400/80';
                      } else if (lType === 'QUIZ') {
                        LessonIcon = HelpCircle;
                        iconColor = completed ? 'text-emerald-440' : active ? 'text-blue-400' : 'text-amber-400/80';
                      } else if (lType === 'ASSIGNMENT') {
                        LessonIcon = ClipboardList;
                        iconColor = completed ? 'text-emerald-440' : active ? 'text-blue-400' : 'text-teal-400/80';
                      }

                      if (completed) {
                        bgTheme = 'bg-emerald-950/15 border-emerald-900/30';
                      } else if (active) {
                        bgTheme = 'bg-blue-950/20 border-blue-900/40';
                      }

                      return (
                        <Link 
                          key={lesson.id} 
                          href={`/course/${courseId}/lesson/${lesson.id}`} 
                          className={`flex items-center gap-3.5 py-3.5 px-5 cursor-pointer hover:bg-slate-900/40 transition-colors border-l-[3px] ${
                            active 
                              ? 'bg-blue-950/5 border-blue-500' 
                              : 'border-transparent'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all relative ${bgTheme}`}>
                            <LessonIcon className={`w-[18px] h-[18px] ${iconColor}`} />
                            {completed && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-[#090d16] shadow-sm flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[13px] font-bold tracking-wide leading-snug truncate ${
                              active 
                                ? 'text-blue-400 font-extrabold' 
                                : 'text-slate-350 hover:text-white'
                            }`}>{lesson.title}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 font-semibold uppercase tracking-wider">
                              <span className={active ? 'text-blue-500/70' : ''}>{lesson.type?.toLowerCase()}</span>
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
    );
  };

  return (
    <div className="flex h-screen bg-[#030712] text-white font-sans overflow-hidden">
      {sidebarPosition === 'left' && renderSidebar()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#030712]">
        
        {/* Top Header */}
        <div className="h-16 border-b border-slate-900 flex items-center justify-between px-6 bg-[#030712] z-10 select-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const nextOpen = !sidebarOpen;
                setSidebarOpen(nextOpen);
                localStorage.setItem('course_sidebar_open', String(nextOpen));
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {sidebarOpen ? <PanelLeft className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
            <Link href={`/courses/${courseId}`} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
              &lt;&nbsp;&nbsp;Back to Course
            </Link>
          </div>
          <div className="text-sm font-medium text-slate-350">{lessonData.module.title}</div>
          <button
            onClick={async () => {
              if (!enrollment) return;
              if (lessonType === 'quiz' && !hasPassedQuiz) {
                addToast(`You must pass the quiz with a score of ${lessonActivity?.quiz?.passingScore ?? 70}% or higher to mark this lesson as complete.`, 'error');
                return;
              }
              if (lessonType === 'reading' && !isReadComplete) {
                addToast(`You must scroll and read at least 70% of the content to mark this lesson as complete.`, 'error');
                return;
              }
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
            disabled={(lessonType === 'quiz' && !hasPassedQuiz) || (lessonType === 'reading' && !isReadComplete)}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? 'Saving...'
              : lessonType === 'quiz' && !hasPassedQuiz
              ? 'Pass Quiz to Complete'
              : lessonType === 'reading' && !isReadComplete
              ? `Read 70% to Complete (${Math.round(currentScrollPercent)}%)`
              : 'Mark Complete'}
          </button>
        </div>

        <div 
          onScroll={(e) => {
            if (lessonType === 'reading') {
              const element = e.currentTarget;
              const totalScrollable = element.scrollHeight - element.clientHeight;
              if (totalScrollable > 0) {
                const pct = (element.scrollTop / totalScrollable) * 100;
                setCurrentScrollPercent(pct);
                if (pct >= 70) {
                  setHasScrolled70(true);
                }
              }
            }
          }}
          className="flex-1 bg-[#030712] relative overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {lessonType === 'video' && (
            <div className="h-full flex items-center justify-center relative">
              <img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-blue-600/90 hover:bg-blue-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 shadow-2xl shadow-blue-550/50">
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end px-6 pb-4">
                <div className="w-full">
                  <div className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer">
                    <div className="w-1/3 h-full bg-blue-500 rounded-full relative">
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
            <div className="mx-auto max-w-4xl w-full px-8 py-12">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Reading Lesson</div>
                  <h2 className="mt-1 text-2xl font-black text-white">{lessonData.lesson.title}</h2>
                  <p className="mt-3 text-lg text-gray-300">{lessonData.lesson.description}</p>
                </div>
                <button
                  onClick={toggleSpeech}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-900 bg-[#090d16] hover:bg-slate-900 text-sm font-semibold text-white transition-all shadow-md shrink-0 hover:border-blue-500/50"
                  title="Listen to this lesson read aloud"
                >
                  {isPlayingSpeech ? (
                    <>
                      <Pause className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <span>Listen Lesson</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-6">
                {sections.map((section: any, index: number) => (
                  <div key={`${section.heading}-${index}`} className="rounded-3xl border border-slate-900 bg-[#090d16]/70 p-6 overflow-hidden">
                    <h3 className="text-xl font-black text-white">{section.heading}</h3>
                    <p className="mt-3 leading-8 text-gray-300">{section.body}</p>
                    
                    {(section.imageUrl || section.image) && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-black/40 shadow-inner">
                        <img 
                          src={section.imageUrl || section.image} 
                          alt={section.heading} 
                          className="w-full max-h-[380px] object-cover transition-transform duration-500 hover:scale-[1.02]" 
                        />
                      </div>
                    )}

                    {section.diagram && (
                      <div className="mt-6 rounded-2xl bg-black/40 border border-slate-900 p-6 flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
                        {section.diagram.split('->').map((step: string, sIdx: number, arr: any[]) => (
                          <div key={sIdx} className="flex flex-col md:flex-row items-center gap-4">
                            <div className="px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-white font-bold text-sm tracking-wide text-center shadow-lg min-w-[140px]">
                              {step.trim()}
                            </div>
                            {sIdx < arr.length - 1 && (
                              <span className="text-blue-400 font-extrabold rotate-90 md:rotate-0 text-xl">
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
            <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8">
              {(() => {
                const hasAttempts = (lessonActivity?.quiz?.attempts?.length ?? 0) > 0;
                const showResults = hasAttempts && !quizAttemptSubmitted;

                if (showResults) {
                  const latestAttempt = lessonActivity.quiz.attempts[0];
                  const passed = latestAttempt.score >= (lessonActivity.quiz.passingScore ?? 70);
                  const attemptAnswers = Array.isArray(latestAttempt.answers) ? latestAttempt.answers : [];

                  return (
                    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-200">
                      {/* Results Dashboard Header */}
                      <div className="rounded-2xl border border-slate-900 bg-[#090d16] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-blue-400 font-mono">
                            <Award className="w-3.5 h-3.5" /> QUIZ COMPLETED
                          </div>
                          <h3 className="text-2xl font-bold tracking-tight text-white mt-3">{lessonData.lesson.title}</h3>
                          <p className="text-xs text-slate-400">
                            Passing Score Requirement: <strong className="text-blue-400">{lessonActivity.quiz.passingScore ?? 70}%</strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl">
                          <div className="text-center">
                            <div className="text-3xl font-black text-white">{latestAttempt.score}%</div>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Your Score</div>
                          </div>
                          <div className="h-px sm:h-10 w-10 sm:w-px bg-slate-900" />
                          <div className="text-center">
                            <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold ${
                              passed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {passed ? 'PASSED' : 'FAILED'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Status</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Answers Overview */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Questions Summary & Explanations</h4>
                        
                        {quizQuestions.map((question: any, qIdx: number) => {
                          const userSelectedOption = attemptAnswers[qIdx];
                          const isCorrect = userSelectedOption === question.correctIndex;

                          return (
                            <div key={qIdx} className={`rounded-xl border p-6 bg-[#090d16] space-y-4 ${
                              isCorrect ? 'border-emerald-500/20' : 'border-rose-500/20'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 font-mono">QUESTION {qIdx + 1} OF {quizQuestions.length}</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>

                              <div className="text-sm font-bold text-white leading-relaxed">{question.prompt}</div>

                              <div className="space-y-2">
                                {(question.options ?? []).map((option: string, oIdx: number) => {
                                  const wasSelected = userSelectedOption === oIdx;
                                  const isRightAnswer = oIdx === question.correctIndex;

                                  let optStyle = "border-slate-900 bg-slate-950/20 text-slate-450";
                                  if (wasSelected) {
                                    optStyle = isRightAnswer 
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold" 
                                      : "border-rose-500 bg-rose-500/10 text-rose-350 font-semibold";
                                  } else if (isRightAnswer) {
                                    optStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-400";
                                  }

                                  return (
                                    <div key={oIdx} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-xs ${optStyle}`}>
                                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                        wasSelected
                                          ? isRightAnswer ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                                          : isRightAnswer ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-350' : 'border-slate-800 text-slate-500'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{option}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {question.explanation && (
                                <div className="mt-4 p-4 rounded-lg bg-slate-950/40 border border-slate-900 text-xs leading-relaxed text-slate-300">
                                  <span className="font-bold text-indigo-400 block mb-1">Explanation</span>
                                  {question.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA Panel */}
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => {
                            setQuizSelection({});
                            setQuizAttemptSubmitted(true);
                            setActiveQuestionIndex(0);
                          }}
                          className="flex items-center gap-2 text-xs font-bold px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all duration-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retake Knowledge Check
                        </button>
                      </div>
                    </div>
                  );
                }

                // Quiz Taking (Active Attempt)
                const currentQuestion = quizQuestions[activeQuestionIndex];

                return (
                  <div className="relative mx-auto max-w-3xl animate-in fade-in duration-200">
                    
                    {/* Compact Quiz Player */}
                    <div className="rounded-2xl border border-slate-900 bg-[#090d16] p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[480px]">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-900 gap-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-405 font-mono">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Quiz Attempt
                            </span>
                            <h3 className="text-lg font-bold text-white mt-2 leading-tight">{lessonData.lesson.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {/* AI Helper trigger icon/button */}
                            <button
                              onClick={() => setShowAiModal(true)}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 px-4 py-2.5 text-xs md:text-sm font-black text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.03] active:scale-95 transition-all select-none"
                            >
                              <Brain className="w-4 h-4 animate-pulse text-white shrink-0" />
                              <span>AI Help</span>
                            </button>

                            <div className="text-right">
                              <span className="text-[10px] font-bold text-indigo-400 block font-mono">QUESTION</span>
                              <span className="text-sm font-black text-white font-mono">{activeQuestionIndex + 1} / {quizQuestions.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${((activeQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                          />
                        </div>

                        {currentQuestion && (
                          <div className="space-y-6 pt-2">
                            <h4 className="text-base font-bold text-white leading-relaxed">{currentQuestion.prompt}</h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                              {(currentQuestion.options ?? []).map((option: string, oIdx: number) => {
                                const isSelected = quizSelection[activeQuestionIndex] === oIdx;

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => setQuizSelection(prev => ({ ...prev, [activeQuestionIndex]: oIdx }))}
                                    className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'border-slate-800/80 bg-[#0a0f1d]/40 text-slate-350 hover:bg-[#111827]/60 hover:border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-500 text-white'
                                          : 'border-slate-700 text-slate-400'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span className="text-xs md:text-sm">{option}</span>
                                    </div>
                                    <div className={`h-2.5 w-2.5 rounded-full border transition-all ${
                                      isSelected ? 'bg-blue-500 border-blue-400 scale-110' : 'border-slate-800'
                                    }`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Compact Pagination controls */}
                      <div className="flex items-center justify-between gap-4 pt-6 mt-8 border-t border-slate-900 select-none">
                        <button
                          onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={activeQuestionIndex === 0}
                          className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-[#111827]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          &larr; Previous
                        </button>

                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {Object.keys(quizSelection).length} / {quizQuestions.length} Selected
                        </div>

                        {activeQuestionIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setActiveQuestionIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                            className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-[#111827]/80 transition-all duration-200"
                          >
                            Next &rarr;
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!enrollment || quizQuestions.length === 0 || Object.keys(quizSelection).length !== quizQuestions.length) return;
                              setSubmittingActivity(true);
                              try {
                                const correctCount = quizQuestions.reduce((acc: number, q: any, index: number) => {
                                  return acc + (quizSelection[index] === q.correctIndex ? 1 : 0);
                                }, 0);
                                const score = quizQuestions.length > 0 ? Math.round((correctCount / quizQuestions.length) * 100) : 0;

                                await submitQuizAttempt(enrollment.id, lessonId, {
                                  answers: quizQuestions.map((_: any, index: number) => quizSelection[index]),
                                  score,
                                });
                                const activity = await getLessonActivity(enrollment.id, lessonId);
                                setLessonActivity(activity);
                                setQuizAttemptSubmitted(false); // Reset to show result overview
                                addToast('Quiz submitted successfully!', 'success');
                              } catch (error) {
                                addToast(error instanceof Error ? error.message : 'Unable to submit quiz attempt', 'error');
                              } finally {
                                setSubmittingActivity(false);
                              }
                            }}
                            disabled={quizQuestions.length === 0 || Object.keys(quizSelection).length !== quizQuestions.length || submittingActivity}
                            className="text-xs font-bold px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {submittingActivity ? 'Submitting...' : 'Submit Attempt'}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* AI Assistant Popup Modal */}
                    {showAiModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
                        <div className="relative rounded-2xl border border-slate-900 bg-[#090d16] p-6 shadow-2xl flex flex-col h-[600px] max-w-xl w-full animate-in zoom-in-95 duration-200">
                          
                          {/* Close Button */}
                          <button 
                            onClick={() => setShowAiModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all p-1.5 rounded-lg hover:bg-slate-900"
                          >
                            <X className="w-5 h-5" />
                          </button>

                          {/* AI Assistant Header */}
                          <div className="flex items-center gap-3 pb-3.5 border-b border-slate-900">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                              <Brain className="h-5.5 w-5.5 animate-pulse text-indigo-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white tracking-wide">AI Learning Assistant</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              </div>
                              <span className="text-xs text-slate-400 block">Stuck on a term or concept? Ask me!</span>
                            </div>
                          </div>

                          {/* Chat Messages Log */}
                          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {aiMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 border border-slate-900 text-indigo-400">
                                  <Sparkles className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-sm font-bold text-white">Ask for Clarifications</h5>
                                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                                    I can explain concepts and define tricky words. (I won't tell you the answer!)
                                  </p>
                                </div>

                                {/* Shortcut Suggestion Prompts */}
                                <div className="pt-2 w-full space-y-2.5">
                                  <button 
                                    onClick={() => handleAskAi("Explain the core concept of this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900 hover:border-blue-500/40 text-slate-350 hover:text-white transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Explain the concept</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  </button>
                                  <button 
                                    onClick={() => handleAskAi("Define any difficult words or terms in this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#0a0f1d] border border-slate-900 hover:border-blue-500/40 text-slate-355 hover:text-white transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Define difficult words</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  </button>
                                  <button 
                                    onClick={() => handleAskAi("Give me a conceptual clue or hint for this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#0a0f1d] border border-slate-900 hover:border-blue-500/40 text-slate-355 hover:text-white transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Give me a hint</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {aiMessages.map((msg, idx) => {
                                  const isAI = msg.role === 'assistant';
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                                    >
                                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                                        isAI ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-slate-900 text-slate-300 border border-slate-800'
                                      }`}>
                                        {isAI ? 'AI' : 'ME'}
                                      </div>
                                      <div className={`rounded-xl p-3.5 text-sm leading-relaxed ${
                                        isAI 
                                          ? 'bg-slate-950/60 border border-slate-900 text-slate-200' 
                                          : 'bg-indigo-600/10 border border-indigo-500/20 text-white'
                                      }`}>
                                        {msg.content}
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {aiLoading && (
                                  <div className="flex gap-3 max-w-[88%] mr-auto items-center">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                                      AI
                                    </div>
                                    <div className="rounded-xl p-3.5 bg-slate-950/60 border border-slate-900 text-sm text-slate-500 italic flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Chat Input Area */}
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAskAi();
                            }}
                            className="mt-3 pt-3.5 border-t border-slate-900 flex gap-2 select-text"
                          >
                            <input
                              type="text"
                              value={aiInput}
                              onChange={(e) => setAiInput(e.target.value)}
                              placeholder="Ask assistant..."
                              disabled={aiLoading}
                              className="flex-1 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
                            />
                            <button
                              type="submit"
                              disabled={!aiInput.trim() || aiLoading}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>
          )}

          {lessonType === 'assignment' && (
            <div className="mx-auto max-w-4xl w-full px-8 py-12">
              <div className="rounded-2xl border border-slate-900 bg-[#090d16] p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Assignment</div>
                <p className="mt-4 text-lg leading-8 text-slate-350">{lessonActivity?.assignment?.description || lessonContent?.brief || lessonData.lesson.description}</p>
                <div className="mt-6 space-y-2">
                  {(lessonActivity?.assignment?.deliverables || lessonContent?.deliverables || []).map((item: string, index: number) => (
                    <div key={`${item}-${index}`} className="rounded-xl bg-black/30 px-4 py-3 text-sm font-bold text-slate-250 font-sans">
                      {item}
                    </div>
                  ))}
                </div>
                <textarea
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  placeholder="Write your assignment response or implementation outline here."
                  className="mt-6 min-h-40 w-full rounded-xl border border-slate-900 bg-black/30 px-4 py-4 text-sm text-white outline-none focus:border-slate-800 transition-colors"
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
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40 transition-colors"
                >
                  {submittingActivity ? 'Submitting...' : 'Submit Assignment'}
                </button>
                {(lessonActivity?.assignment?.submissions?.length ?? 0) > 0 && (
                  <div className="mt-6 rounded-xl bg-black/30 p-4 text-sm text-slate-400">
                    <div>Latest submission: {new Date(lessonActivity.assignment.submissions[0].submittedAt).toLocaleString()}</div>
                    {lessonActivity.assignment.submissions[0].score !== null && lessonActivity.assignment.submissions[0].score !== undefined && (
                      <div className="mt-2 text-emerald-400">
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
              <div className="rounded-2xl border border-slate-900 bg-[#090d16] p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Live Session</div>
                <p className="mt-4 text-lg text-slate-300">{lessonContent?.note || lessonData.lesson.description}</p>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {(lessonContent?.agenda ?? []).map((item: string, index: number) => (
                    <div key={`${item}-${index}`} className="rounded-xl border border-slate-900 bg-black/30 p-5 text-sm font-bold text-slate-205">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mid Navigation controls */}
        <div className="h-20 bg-[#090d16] border-t border-slate-900 flex items-center px-8 gap-8 justify-between select-none">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-350">{lessonData.lesson.title}</h2>
          </div>
          <div className="flex items-center gap-6">
            {previousLesson ? (
              <button 
                onClick={() => router.push(`/course/${courseId}/lesson/${previousLesson.id}`)} 
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                &lt;&nbsp;&nbsp;Previous
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-not-allowed">
                &lt;&nbsp;&nbsp;Previous
              </span>
            )}
            {nextLesson ? (
              <button 
                onClick={() => router.push(`/course/${courseId}/lesson/${nextLesson.id}`)} 
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Next&nbsp;&nbsp;&gt;
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-not-allowed">
                Next&nbsp;&nbsp;&gt;
              </span>
            )}
            <button 
              onClick={() => setShowBottomPanel(!showBottomPanel)} 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${showBottomPanel ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" /> Discussion
            </button>
          </div>
        </div>
        {/* Discussion & Announcements Modal */}
        {showBottomPanel && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowBottomPanel(false)}
          >
            <div 
              className="relative rounded-2xl border border-slate-900 bg-[#090d16] p-6 shadow-2xl flex flex-col h-[550px] max-w-2xl w-full animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close Button */}
              <button 
                onClick={() => setShowBottomPanel(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all p-1.5 rounded-lg hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Tabs Header */}
              <div className="flex items-center gap-6 border-b border-slate-900 pb-3 mb-4 pr-10">
                <button
                  onClick={() => setActiveBottomTab('discussion')}
                  className={`text-xs font-black uppercase tracking-[0.25em] transition-all relative pb-3 flex items-center gap-2 ${
                    activeBottomTab === 'discussion' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>Discussion</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeBottomTab === 'discussion' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-950 text-slate-600'}`}>
                    {lessonActivity?.discussion?.length ?? 0}
                  </span>
                  {activeBottomTab === 'discussion' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveBottomTab('announcements')}
                  className={`text-xs font-black uppercase tracking-[0.25em] transition-all relative pb-3 flex items-center gap-2 ${
                    activeBottomTab === 'announcements' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>Course Announcements</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeBottomTab === 'announcements' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-950 text-slate-600'}`}>
                    {lessonActivity?.announcements?.length ?? 0}
                  </span>
                  {activeBottomTab === 'announcements' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab contents */}
              {activeBottomTab === 'discussion' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {(lessonActivity?.discussion ?? []).map((comment: any) => (
                      <div key={comment.id} className="rounded-lg bg-black/40 px-4 py-2.5 border border-slate-900/50 animate-in fade-in duration-200 select-text">
                        <div className="text-xs font-bold text-slate-400">{comment.user.firstName} {comment.user.lastName}</div>
                        <div className="mt-0.5 text-sm text-slate-200 leading-relaxed">{comment.message}</div>
                      </div>
                    ))}
                    {(lessonActivity?.discussion?.length ?? 0) === 0 && (
                      <div className="text-xs text-slate-500 py-3 font-medium">No discussion yet for this lesson.</div>
                    )}
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-slate-900 flex gap-2 items-end">
                    <textarea 
                      value={discussionMessage} 
                      onChange={(e) => setDiscussionMessage(e.target.value)} 
                      placeholder="Ask a question or share an insight..." 
                      className="min-h-12 flex-1 rounded-xl border border-slate-900 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-850 transition-colors placeholder:text-slate-650 resize-none select-text" 
                    />
                    <button
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40 transition-colors shadow-md shadow-blue-900/20"
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
              )}

              {activeBottomTab === 'announcements' && (
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {(lessonActivity?.announcements ?? []).map((announcement: any) => (
                    <div key={announcement.id} className="rounded-lg bg-black/40 px-4 py-3 border border-slate-900/50 animate-in fade-in duration-200 select-text">
                      <div className="text-xs font-bold text-white">{announcement.title}</div>
                      <div className="mt-1 text-xs text-slate-350 leading-relaxed">{announcement.body}</div>
                      <div className="mt-2 text-[10px] text-slate-500 font-semibold">
                        {announcement.author.firstName} {announcement.author.lastName} • {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {(lessonActivity?.announcements?.length ?? 0) === 0 && (
                    <div className="text-xs text-slate-500 py-3 font-medium">No announcements yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

      {sidebarPosition === 'right' && renderSidebar()}
    </div>
  );
}
