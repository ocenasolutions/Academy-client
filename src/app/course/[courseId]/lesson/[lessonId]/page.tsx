'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Play, ChevronDown, ChevronUp, Volume2, Pause, BookOpen, Video, HelpCircle, ClipboardList, Radio, AlertCircle, Lightbulb, PanelLeft, PanelRight, X, Sparkles, Send, RefreshCw, Brain } from 'lucide-react';
import { addLessonDiscussionComment, getEnrollmentDetails, getLessonActivity, getMyCertificates, submitAssignment, submitQuizAttempt, updateLessonProgress, askAiHelper } from '@/lib/api';
import { useProtectedPage } from '@/lib/use-protected-page';
import { useToast } from '@/contexts/ToastContext';

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
  }
  return null;
}

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const sentenceIndexRef = useRef(0);
  const sentencesRef = useRef<any[]>([]);
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
      isSpeakingRef.current = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
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
      isSpeakingRef.current = false;
      window.speechSynthesis.cancel();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      setIsPlayingSpeech(false);
      return;
    }

    // Helper to strip HTML/Markdown and normalize abbreviations for natural speech
    const cleanText = (text: string) => {
      return text
        .replace(/<[^>]*>/g, '') // strip HTML
        .replace(/[*#_`~\[\]\(\)]/g, '') // strip Markdown characters
        .replace(/\be\.g\.\s*/gi, 'for example, ')
        .replace(/\bi\.e\.\s*/gi, 'that is, ')
        .replace(/\betc\.\s*/gi, 'and so on, ')
        .replace(/\bvs\.\s*/gi, 'versus ')
        .replace(/\s+/g, ' ') // normalize whitespace
        .trim();
    };

    const rawText = `${lessonData?.lesson?.title || ''}. ${lessonData?.lesson?.description || ''}. ` + 
      sections.map((s: any) => `${s.heading || ''}. ${s.body || ''}`).join('\n\n');

    const textToRead = cleanText(rawText);
    if (!textToRead) {
      addToast('No reading content available to read.', 'info');
      return;
    }

    // Split text into sentences, protecting decimals (like 49.8%) from being split
    const sentences = textToRead.match(/(?!\s)[^.?!]+(?:[.?!](?![\d])|$)/g)?.map(s => s.trim()).filter(Boolean) || [];
    if (sentences.length === 0) {
      addToast('No readable text found.', 'info');
      return;
    }

    // Chunk sentences further by commas/semicolons/colons to add humanoid breathing/pauses
    const speechChunks: Array<{ text: string; pauseMs: number }> = [];
    for (const sentence of sentences) {
      if (sentence.length < 60) {
        speechChunks.push({ text: sentence, pauseMs: 650 });
      } else {
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        for (let i = 0; i < clauses.length; i++) {
          const clause = clauses[i].trim();
          if (!clause) continue;
          const isLast = i === clauses.length - 1;
          speechChunks.push({
            text: clause,
            pauseMs: isLast ? 650 : 350
          });
        }
      }
    }

    sentencesRef.current = speechChunks;
    sentenceIndexRef.current = 0;
    isSpeakingRef.current = true;
    setIsPlayingSpeech(true);

    // Cancel any previous speech
    window.speechSynthesis.cancel();
    (window as any)._allUtterances = []; // Prevent garbage collection of SpeechSynthesisUtterance

    const speakNext = () => {
      if (!isSpeakingRef.current) return;

      if (sentenceIndexRef.current >= sentencesRef.current.length) {
        setIsPlayingSpeech(false);
        isSpeakingRef.current = false;
        return;
      }

      const chunk = sentencesRef.current[sentenceIndexRef.current];
      if (!chunk || !chunk.text) {
        sentenceIndexRef.current += 1;
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utteranceRef.current = utterance;
      
      // Pin utterance to a global array to avoid garbage collection bug in Chrome
      if (!(window as any)._allUtterances) {
        (window as any)._allUtterances = [];
      }
      (window as any)._allUtterances.push(utterance);
      (window as any)._activeUtterance = utterance;

      // Set human-friendly speech parameters
      utterance.rate = 0.88; // Slightly slower speed, feels more humanoid and thoughtful
      utterance.pitch = 1.0; // Natural pitch

      // Pick the best natural/humanoid English voice if available
      if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));

        if (englishVoices.length > 0) {
          // Score each voice to find the most natural/humanoid option
          const scoredVoices = englishVoices.map(voice => {
            let score = 0;
            const name = voice.name.toLowerCase();

            // High scores for online/neural/premium/natural voices
            if (name.includes('natural')) score += 150;
            if (name.includes('neural')) score += 150;
            if (name.includes('google')) score += 120;
            if (name.includes('online')) score += 100;
            if (name.includes('premium')) score += 90;
            if (name.includes('siri')) score += 90;
            if (name.includes('samantha')) score += 80;
            if (name.includes('daniel')) score += 80;

            // Moderate scores for decent OS-level voices (Apple/Microsoft)
            if (name.includes('microsoft') || name.includes('david') || name.includes('zira') || name.includes('hazel')) score += 50;
            if (name.includes('moira') || name.includes('karen')) score += 50;

            // English locale preferences
            if (voice.lang.toLowerCase() === 'en-us') score += 10;
            if (voice.lang.toLowerCase() === 'en-gb') score += 5;

            // Heavily penalize extremely metallic/robotic Linux synthesizers
            if (name.includes('espeak')) score -= 150;
            if (name.includes('festival')) score -= 150;
            if (name.includes('mbrola')) score -= 150;

            return { voice, score };
          });

          // Sort descending by score
          scoredVoices.sort((a, b) => b.score - a.score);
          utterance.voice = scoredVoices[0].voice;
        }
      }

      utterance.onend = () => {
        if (isSpeakingRef.current) {
          sentenceIndexRef.current += 1;
          // Use the chunk's custom pause duration to simulate a human breath/pause
          setTimeout(() => {
            speakNext();
          }, chunk.pauseMs || 500);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && isSpeakingRef.current) {
          sentenceIndexRef.current += 1;
          setTimeout(() => {
            speakNext();
          }, chunk.pauseMs || 500);
        }
      };

      window.speechSynthesis.speak(utterance);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    };

    // Use a small timeout to let the cancel complete asynchronously before speaking
    setTimeout(() => {
      speakNext();
    }, 100);
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

  const parsedAssignment = useMemo(() => {
    const rawDesc = lessonActivity?.assignment?.description || lessonData?.lesson?.description || '';
    if (!rawDesc) return null;

    if (typeof rawDesc === 'string' && (rawDesc.trim().startsWith('{') || rawDesc.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(rawDesc);
        return {
          brief: parsed.brief || parsed.description || rawDesc,
          rubric: Array.isArray(parsed.rubric) ? parsed.rubric : [],
          deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
        };
      } catch (e) {
        // Fall through
      }
    }

    return {
      brief: rawDesc,
      rubric: [],
      deliverables: [],
    };
  }, [lessonActivity, lessonData]);

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
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--color-text-main)] flex items-center justify-center p-10 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wide animate-pulse">Loading lesson...</p>
        </div>
      </div>
    );
  }

  const renderSidebar = () => {
    if (!sidebarOpen) return null;
    return (
      <div className={`w-80 bg-[var(--surface-card)] ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-[var(--surface-border)] flex flex-col shrink-0 select-none z-20`}>
        <div className="p-6 border-b border-[var(--surface-border)] flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-[var(--text-heading)] tracking-wide">Course Content</h3>
            <div className="flex flex-col mt-2 gap-1.5">
              <div className="w-full bg-[var(--surface-card-soft)] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(enrollment?.progressPercent ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-[var(--text-main)]/70">{Math.round(enrollment?.progressPercent ?? 0)}% Completed</p>
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
              className="text-[var(--text-main)] hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--surface-card-soft)] transition-colors"
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
              className="text-[var(--text-main)] hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--surface-card-soft)] transition-colors"
              title="Collapse Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--surface-border)] scrollbar-track-transparent">
          {(enrollment?.course.modules ?? []).map((module: any) => {
            const isModuleCompleted = module.lessons.length > 0 && module.lessons.every((lesson: any) => completedLessonIds.has(lesson.id));
            const isExpanded = !!expandedModules[module.id];
            return (
              <div key={module.id} className="border-b border-[var(--surface-border)]">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className={`w-full p-4 font-semibold text-xs flex items-center justify-between text-left transition-colors hover:bg-[var(--surface-card-soft)] bg-[var(--surface-card)] text-[var(--text-heading)]`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isModuleCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span>{module.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-main)] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-main)] shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="bg-[var(--surface-card-soft)]/40">
                    {module.lessons.map((lesson: any) => {
                      const active = lesson.id === lessonId;
                      const completed = completedLessonIds.has(lesson.id);

                      // Icon selection based on lesson type
                      let LessonIcon = BookOpen;
                      let iconColor = 'text-[var(--text-main)]/60';
                      let bgTheme = 'bg-[var(--surface-card-soft)] border-[var(--surface-border)]';
                      
                      const lType = lesson.type?.toUpperCase();
                      if (lType === 'VIDEO') {
                        LessonIcon = Video;
                        iconColor = completed ? 'text-emerald-500' : active ? 'text-blue-500' : 'text-blue-500/80';
                      } else if (lType === 'READING') {
                        LessonIcon = BookOpen;
                        iconColor = completed ? 'text-emerald-500' : active ? 'text-blue-500' : 'text-purple-500/80';
                      } else if (lType === 'QUIZ') {
                        LessonIcon = HelpCircle;
                        iconColor = completed ? 'text-emerald-500' : active ? 'text-blue-500' : 'text-amber-500/80';
                      } else if (lType === 'ASSIGNMENT') {
                        LessonIcon = ClipboardList;
                        iconColor = completed ? 'text-emerald-500' : active ? 'text-blue-500' : 'text-teal-500/80';
                      }

                      if (completed) {
                        bgTheme = 'bg-emerald-500/10 border-emerald-550/20';
                      } else if (active) {
                        bgTheme = 'bg-blue-500/10 border-blue-550/30';
                      }

                      return (
                        <Link 
                          key={lesson.id} 
                          href={`/course/${courseId}/lesson/${lesson.id}`} 
                          className={`flex items-center gap-3.5 py-3.5 px-5 cursor-pointer hover:bg-[var(--surface-card-soft)]/50 transition-colors border-l-[3px] ${
                            active 
                              ? 'bg-blue-500/5 border-blue-500' 
                              : 'border-transparent'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all relative ${bgTheme}`}>
                            <LessonIcon className={`w-[18px] h-[18px] ${iconColor}`} />
                            {completed && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-[var(--surface-card)] shadow-sm flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[13px] font-bold tracking-wide leading-snug truncate ${
                              active 
                                ? 'text-blue-500 font-extrabold' 
                                : 'text-[var(--text-main)]/90 hover:text-[var(--text-heading)]'
                            }`}>{lesson.title}</div>
                            <div className="text-[10px] text-[var(--text-main)]/50 flex items-center gap-1.5 mt-1 font-semibold uppercase tracking-wider">
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
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-hidden">
      {sidebarPosition === 'left' && renderSidebar()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-main)]">
        
        {/* Top Header */}
        <div className="h-16 border-b border-[var(--surface-border)] flex items-center justify-between px-6 bg-[var(--surface-card)] z-10 select-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const nextOpen = !sidebarOpen;
                setSidebarOpen(nextOpen);
                localStorage.setItem('course_sidebar_open', String(nextOpen));
              }}
              className="text-[var(--text-main)]/80 hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--surface-card-soft)] transition-colors"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {sidebarOpen ? <PanelLeft className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
            <Link href={`/courses/${courseId}`} className="text-[var(--text-main)]/80 hover:text-[var(--text-heading)] flex items-center gap-2 text-sm font-medium transition-colors">
              &lt;&nbsp;&nbsp;Back to Course
            </Link>
          </div>
          <div className="text-sm font-medium text-[var(--text-main)]/80">{lessonData.module.title}</div>
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
          className="flex-1 bg-[var(--bg-main)] relative overflow-auto scrollbar-thin scrollbar-thumb-[var(--surface-border)] scrollbar-track-transparent"
        >
          {lessonType === 'video' && (() => {
            const embedUrl = getYoutubeEmbedUrl(lessonData?.lesson?.videoUrl);
            return (
              <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                {/* Immersive Video Player Card */}
                <div className="relative group rounded-3xl overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                  {/* Outer ambient glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500 pointer-events-none" />
                  
                  {embedUrl ? (
                    <div className="relative w-full aspect-video flex items-center justify-center bg-black overflow-hidden z-10">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video flex items-center justify-center bg-black overflow-hidden z-10">
                      <img 
                        src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1600" 
                        className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                        <button className="w-22 h-22 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl shadow-blue-550/40 border border-blue-400/30">
                          <Play className="w-9 h-9 ml-1 fill-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end px-6 pb-5">
                        <div className="w-full">
                          <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer overflow-hidden">
                            <div className="w-1/3 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full relative" />
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-white/80 tracking-wide">
                            <span className="flex items-center gap-1">
                              <Video className="w-3.5 h-3.5 text-blue-400" /> {lessonData.lesson.duration}
                            </span>
                            <span>{Math.round(enrollment?.progressPercent ?? 0)}% complete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sleek Lesson Details & Description */}
                <div className="space-y-6">
                  {/* Meta badges row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.1em] bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Video className="w-3.5 h-3.5 fill-current" /> Video Lesson
                    </span>
                    <span className="text-sm text-[var(--text-main)]/30">•</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]/60 bg-[var(--surface-card)] border border-[var(--surface-border)] px-3 py-1 rounded-full">
                      Duration: {lessonData.lesson.duration}
                    </span>
                  </div>

                  {/* Title & Description Card */}
                  <div className="p-8 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-xl relative overflow-hidden backdrop-blur-md">
                    {/* Subtle design element: corner gradient accent */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-heading)] leading-tight">
                      {lessonData.lesson.title}
                    </h2>
                    
                    <div className="h-px w-full bg-gradient-to-r from-[var(--surface-border)] via-transparent to-transparent my-6" />
                    
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-main)]/50">Overview & Key Takeaways</h3>
                      <p className="text-base leading-relaxed text-[var(--text-main)]/80 font-medium whitespace-pre-line">
                        {lessonData.lesson.description || "No description provided for this lesson."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {lessonType === 'reading' && (
            <div className="mx-auto max-w-4xl w-full px-8 py-12">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Reading Lesson</div>
                  <h2 className="mt-1 text-2xl font-black text-[var(--text-heading)]">{lessonData.lesson.title}</h2>
                  <p className="mt-3 text-lg text-[var(--text-main)]/90">{lessonData.lesson.description}</p>
                </div>
                <button
                  onClick={toggleSpeech}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-soft)] text-sm font-semibold text-[var(--text-heading)] transition-all shadow-md shrink-0 hover:border-blue-500/50"
                  title="Listen to this lesson read aloud"
                >
                  {isPlayingSpeech ? (
                    <>
                      <Pause className="w-4 h-4 text-blue-550 animate-pulse" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <span>Listen Lesson</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-6">
                {sections.map((section: any, index: number) => (
                  <div key={`${section.heading}-${index}`} className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 overflow-hidden">
                    <h3 className="text-xl font-black text-[var(--text-heading)]">{section.heading}</h3>
                    {Array.isArray(section.body) ? (
                      section.body.map((para: string, pIdx: number) => (
                        <p key={pIdx} className="mt-4 leading-8 text-[var(--text-main)]/90 text-justify">
                          {para}
                        </p>
                      ))
                    ) : typeof section.body === 'string' ? (
                      section.body.split('\n').filter(Boolean).map((para: string, pIdx: number) => (
                        <p key={pIdx} className="mt-4 leading-8 text-[var(--text-main)]/90 text-justify">
                          {para}
                        </p>
                      ))
                    ) : null}
                    
                    {(section.imageUrl || section.image) && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 shadow-inner">
                        <img 
                          src={section.imageUrl || section.image} 
                          alt={section.heading} 
                          className="w-full max-h-[380px] object-cover transition-transform duration-500 hover:scale-[1.02]" 
                        />
                      </div>
                    )}

                    {section.diagram && (
                      <div className="mt-6 rounded-2xl bg-[var(--surface-card-soft)]/30 border border-[var(--surface-border)] p-6 flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
                        {section.diagram.split('->').map((step: string, sIdx: number, arr: any[]) => (
                          <div key={sIdx} className="flex flex-col md:flex-row items-center gap-4">
                            <div className="px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[var(--text-heading)] font-bold text-sm tracking-wide text-center shadow-lg min-w-[140px]">
                              {step.trim()}
                            </div>
                            {sIdx < arr.length - 1 && (
                              <span className="text-blue-500 font-extrabold rotate-90 md:rotate-0 text-xl">
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
                      <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-card-soft)] border border-[var(--surface-border)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-blue-500 font-mono">
                            <Award className="w-3.5 h-3.5" /> QUIZ COMPLETED
                          </div>
                          <h3 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] mt-3">{lessonData.lesson.title}</h3>
                          <p className="text-xs text-[var(--text-main)]/70">
                            Passing Score Requirement: <strong className="text-blue-555">{lessonActivity.quiz.passingScore ?? 70}%</strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 bg-[var(--surface-card-soft)]/50 border border-[var(--surface-border)] p-6 rounded-2xl">
                          <div className="text-center">
                            <div className="text-3xl font-black text-[var(--text-heading)]">{latestAttempt.score}%</div>
                            <div className="text-[10px] text-[var(--text-main)]/60 mt-1 uppercase tracking-wider font-semibold">Your Score</div>
                          </div>
                          <div className="h-px sm:h-10 w-10 sm:w-px bg-[var(--surface-border)]" />
                          <div className="text-center">
                            <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold ${
                              passed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {passed ? 'PASSED' : 'FAILED'}
                            </span>
                            <div className="text-[10px] text-[var(--text-main)]/60 mt-1 uppercase tracking-wider font-semibold">Status</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Answers Overview */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]/80 px-1">Questions Summary & Explanations</h4>
                        
                        {quizQuestions.map((question: any, qIdx: number) => {
                          const userSelectedOption = attemptAnswers[qIdx];
                          const isCorrect = userSelectedOption === question.correctIndex;

                          return (
                            <div key={qIdx} className={`rounded-xl border p-6 bg-[var(--surface-card)] space-y-4 ${
                              isCorrect ? 'border-emerald-500/20' : 'border-rose-500/20'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--text-main)]/50 font-mono">QUESTION {qIdx + 1} OF {quizQuestions.length}</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>

                              <div className="text-sm font-bold text-[var(--text-heading)] leading-relaxed">{question.prompt}</div>

                              <div className="space-y-2">
                                {(question.options ?? []).map((option: string, oIdx: number) => {
                                  const wasSelected = userSelectedOption === oIdx;
                                  const isRightAnswer = oIdx === question.correctIndex;

                                  let optStyle = "border-[var(--surface-border)] bg-[var(--surface-card-soft)]/30 text-[var(--text-main)]";
                                  if (wasSelected) {
                                    optStyle = isRightAnswer 
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold" 
                                      : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold";
                                  } else if (isRightAnswer) {
                                    optStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-650 dark:text-emerald-350";
                                  }

                                  return (
                                    <div key={oIdx} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-xs ${optStyle}`}>
                                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                        wasSelected
                                          ? isRightAnswer ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                                          : isRightAnswer ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-350' : 'border-[var(--surface-border)] text-[var(--text-main)]/50'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{option}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {question.explanation && (
                                <div className="mt-4 p-4 rounded-lg bg-[var(--surface-card-soft)]/50 border border-[var(--surface-border)] text-xs leading-relaxed text-[var(--text-main)]/90">
                                  <span className="font-bold text-indigo-500 dark:text-indigo-400 block mb-1">Explanation</span>
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
                    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[480px]">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-[var(--surface-border)] gap-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-card-soft)] border border-[var(--surface-border)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-500 font-mono">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Quiz Attempt
                            </span>
                            <h3 className="text-lg font-bold text-[var(--text-heading)] mt-2 leading-tight">{lessonData.lesson.title}</h3>
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
                              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 block font-mono">QUESTION</span>
                              <span className="text-sm font-black text-[var(--text-heading)] font-mono">{activeQuestionIndex + 1} / {quizQuestions.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[var(--surface-card-soft)] h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${((activeQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                          />
                        </div>

                        {currentQuestion && (
                          <div className="space-y-6 pt-2">
                            <h4 className="text-base font-bold text-[var(--text-heading)] leading-relaxed">{currentQuestion.prompt}</h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                              {(currentQuestion.options ?? []).map((option: string, oIdx: number) => {
                                const isSelected = quizSelection[activeQuestionIndex] === oIdx;

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => setQuizSelection(prev => ({ ...prev, [activeQuestionIndex]: oIdx }))}
                                    className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-500/10 text-[var(--text-heading)] shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'border-[var(--surface-border)] bg-[var(--surface-card-soft)]/30 text-[var(--text-main)]/90 hover:bg-[var(--surface-card-soft)]/60 hover:border-[var(--surface-border)]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-500 text-white'
                                          : 'border-[var(--surface-border)] text-[var(--text-main)]/50'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span className="text-xs md:text-sm">{option}</span>
                                    </div>
                                    <div className={`h-2.5 w-2.5 rounded-full border transition-all ${
                                      isSelected ? 'bg-blue-500 border-blue-400 scale-110' : 'border-[var(--surface-border)]'
                                    }`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Compact Pagination controls */}
                      <div className="flex items-center justify-between gap-4 pt-6 mt-8 border-t border-[var(--surface-border)] select-none">
                        <button
                          onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={activeQuestionIndex === 0}
                          className="text-xs font-bold px-4 py-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/40 text-[var(--text-main)] hover:bg-[var(--surface-card-soft)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          &larr; Previous
                        </button>

                        <div className="text-[10px] text-[var(--text-main)]/60 font-bold uppercase tracking-wider">
                          {Object.keys(quizSelection).length} / {quizQuestions.length} Selected
                        </div>

                        {activeQuestionIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setActiveQuestionIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                            className="text-xs font-bold px-4 py-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/40 text-[var(--text-main)] hover:bg-[var(--surface-card-soft)]/80 transition-all duration-200"
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
                        <div className="relative rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-2xl flex flex-col h-[600px] max-w-xl w-full animate-in zoom-in-95 duration-200">
                          
                          {/* Close Button */}
                          <button 
                            onClick={() => setShowAiModal(false)}
                            className="absolute top-4 right-4 text-[var(--text-main)] hover:text-[var(--text-heading)] transition-all p-1.5 rounded-lg hover:bg-[var(--surface-card-soft)]"
                          >
                            <X className="w-5 h-5" />
                          </button>

                          {/* AI Assistant Header */}
                          <div className="flex items-center gap-3 pb-3.5 border-b border-[var(--surface-border)]">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                              <Brain className="h-5.5 w-5.5 animate-pulse text-indigo-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-[var(--text-heading)] tracking-wide">AI Learning Assistant</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              </div>
                              <span className="text-xs text-[var(--text-main)]/70 block">Stuck on a term or concept? Ask me!</span>
                            </div>
                          </div>

                          {/* Chat Messages Log */}
                          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-[var(--surface-border)] scrollbar-track-transparent">
                            {aiMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-card-soft)] border border-[var(--surface-border)] text-indigo-500">
                                  <Sparkles className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-sm font-bold text-[var(--text-heading)]">Ask for Clarifications</h5>
                                  <p className="text-xs text-[var(--text-main)]/70 leading-relaxed max-w-sm">
                                    I can explain concepts and define tricky words. (I won't tell you the answer!)
                                  </p>
                                </div>

                                {/* Shortcut Suggestion Prompts */}
                                <div className="pt-2 w-full space-y-2.5">
                                  <button 
                                    onClick={() => handleAskAi("Explain the core concept of this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-[var(--surface-card-soft)] border border-[var(--surface-border)] hover:border-blue-500/40 text-[var(--text-main)] hover:text-[var(--text-heading)] transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Explain the concept</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-main)]/50" />
                                  </button>
                                  <button 
                                    onClick={() => handleAskAi("Define any difficult words or terms in this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-[var(--surface-card-soft)] border border-[var(--surface-border)] hover:border-blue-500/40 text-[var(--text-main)] hover:text-[var(--text-heading)] transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Define difficult words</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-main)]/50" />
                                  </button>
                                  <button 
                                    onClick={() => handleAskAi("Give me a conceptual clue or hint for this question")}
                                    className="w-full text-left text-xs font-semibold px-4 py-2.5 rounded-lg bg-[var(--surface-card-soft)] border border-[var(--surface-border)] hover:border-blue-500/40 text-[var(--text-main)] hover:text-[var(--text-heading)] transition-all duration-200 flex items-center justify-between"
                                  >
                                    <span>Give me a hint</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-main)]/50" />
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
                                        isAI ? 'bg-blue-600/10 text-blue-500 border border-blue-550/20' : 'bg-[var(--surface-card-soft)] text-[var(--text-main)] border border-[var(--surface-border)]'
                                      }`}>
                                        {isAI ? 'AI' : 'ME'}
                                      </div>
                                      <div className={`rounded-xl p-3.5 text-sm leading-relaxed ${
                                        isAI 
                                          ? 'bg-[var(--surface-card-soft)] border border-[var(--surface-border)] text-[var(--text-main)]' 
                                          : 'bg-indigo-600/10 border border-indigo-500/20 text-[var(--text-heading)]'
                                      }`}>
                                        {msg.content}
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {aiLoading && (
                                  <div className="flex gap-3 max-w-[88%] mr-auto items-center">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500 border border-blue-550/20 text-[11px] font-bold">
                                      AI
                                    </div>
                                    <div className="rounded-xl p-3.5 bg-[var(--surface-card-soft)] border border-[var(--surface-border)] text-sm text-[var(--text-main)]/55 italic flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-main)]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-main)]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-main)]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                            className="mt-3 pt-3.5 border-t border-[var(--surface-border)] flex gap-2 select-text"
                          >
                            <input
                              type="text"
                              value={aiInput}
                              onChange={(e) => setAiInput(e.target.value)}
                              placeholder="Ask assistant..."
                              disabled={aiLoading}
                              className="flex-1 bg-[var(--surface-card-soft)] border border-[var(--surface-border)] focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder-[var(--text-main)]/50 outline-none transition-all duration-200"
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

          {lessonType === 'assignment' && (() => {
            const briefText = parsedAssignment?.brief || lessonContent?.brief || lessonData?.lesson?.description || '';
            const deliverables = [
              ...(lessonActivity?.assignment?.deliverables || []),
              ...(lessonContent?.deliverables || []),
              ...(parsedAssignment?.deliverables || [])
            ].filter(Boolean);
            
            const rubric = [
              ...(lessonActivity?.assignment?.rubric || []),
              ...(lessonContent?.rubric || []),
              ...(parsedAssignment?.rubric || [])
            ].filter(Boolean);

            return (
              <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                {/* Premium Header/Title Card */}
                <div className="p-8 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.1em] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                      <ClipboardList className="w-3.5 h-3.5" /> Assignment
                    </span>
                  </div>
                  
                  <h2 className="mt-4 text-2xl md:text-3xl font-black tracking-tight text-[var(--text-heading)] leading-tight">
                    {lessonData.lesson.title}
                  </h2>
                  
                  <div className="h-px w-full bg-gradient-to-r from-[var(--surface-border)] via-transparent to-transparent my-6" />
                  
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-main)]/50">Assignment Brief</h3>
                    <p className="text-base leading-relaxed text-[var(--text-main)]/80 font-medium whitespace-pre-line">
                      {briefText}
                    </p>
                  </div>
                </div>

                {/* Deliverables Section */}
                {deliverables.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]/80 px-1">Required Deliverables</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {deliverables.map((item: string, index: number) => (
                        <div key={`${item}-${index}`} className="flex gap-3 items-start rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-[var(--text-main)]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grading Rubric Section */}
                {rubric.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]/80 px-1">Evaluation Rubric</h3>
                    <div className="space-y-3">
                      {rubric.map((item: string, index: number) => (
                        <div key={`${item}-${index}`} className="flex gap-3 items-center rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-5 py-4 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-[var(--text-main)]/90">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Form */}
                <div className="p-8 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-xl space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">Your Submission</h3>
                    <p className="text-xs text-[var(--text-main)]/65">Submit your response, implementation outline, or download links below.</p>
                  </div>
                  
                  <textarea
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    placeholder="Write your assignment response or implementation outline here..."
                    className="min-h-40 w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 px-5 py-4 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/50 transition-all font-medium leading-relaxed resize-y"
                  />
                  
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      onClick={async () => {
                        if (!enrollment || !assignmentText.trim()) return;
                        setSubmittingActivity(true);
                        try {
                          await submitAssignment(enrollment.id, lessonId, { content: assignmentText });
                          const activity = await getLessonActivity(enrollment.id, lessonId);
                          setLessonActivity(activity);
                          addToast('Assignment submitted successfully.', 'success');
                          setAssignmentText('');
                        } catch (error) {
                          addToast(error instanceof Error ? error.message : 'Unable to submit assignment', 'error');
                        } finally {
                          setSubmittingActivity(false);
                        }
                      }}
                      disabled={!assignmentText.trim() || submittingActivity}
                      className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-sm font-black text-white disabled:opacity-40 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      {submittingActivity ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>

                  {(lessonActivity?.assignment?.submissions?.length ?? 0) > 0 && (
                    <div className="mt-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-600/80">
                        <span>LATEST SUBMISSION</span>
                        <span>{new Date(lessonActivity.assignment.submissions[0].submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-main)]/90 bg-[var(--surface-card)] border border-[var(--surface-border)] px-4 py-3 rounded-xl">
                        {lessonActivity.assignment.submissions[0].content}
                      </p>
                      {lessonActivity.assignment.submissions[0].score !== null && lessonActivity.assignment.submissions[0].score !== undefined && (
                        <div className="flex items-start gap-2 text-sm font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                          <Award className="w-5 h-5 shrink-0" />
                          <div>
                            <div>Graded Score: {lessonActivity.assignment.submissions[0].score}%</div>
                            {lessonActivity.assignment.submissions[0].feedback && (
                              <div className="mt-1 text-xs text-[var(--text-main)]/80 font-normal">
                                Feedback: {lessonActivity.assignment.submissions[0].feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {lessonType === 'live' && (
            <div className="mx-auto max-w-4xl px-8 py-12">
              <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-8">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-550">Live Session</div>
                <p className="mt-4 text-lg text-[var(--text-main)]">{lessonContent?.note || lessonData.lesson.description}</p>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {(lessonContent?.agenda ?? []).map((item: string, index: number) => (
                    <div key={`${item}-${index}`} className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 p-5 text-sm font-bold text-[var(--text-main)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mid Navigation controls */}
        <div className="h-20 bg-[var(--surface-card)] border-t border-[var(--surface-border)] flex items-center px-8 gap-8 justify-between select-none">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">{lessonData.lesson.title}</h2>
          </div>
          <div className="flex items-center gap-6">
            {previousLesson ? (
              <button 
                onClick={() => router.push(`/course/${courseId}/lesson/${previousLesson.id}`)} 
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)] hover:text-[var(--text-heading)] transition-colors"
              >
                &lt;&nbsp;&nbsp;Previous
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]/40 cursor-not-allowed">
                &lt;&nbsp;&nbsp;Previous
              </span>
            )}
            {nextLesson ? (
              <button 
                onClick={() => router.push(`/course/${courseId}/lesson/${nextLesson.id}`)} 
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)] hover:text-[var(--text-heading)] transition-colors"
              >
                Next&nbsp;&nbsp;&gt;
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]/40 cursor-not-allowed">
                Next&nbsp;&nbsp;&gt;
              </span>
            )}
            <button 
              onClick={() => setShowBottomPanel(!showBottomPanel)} 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${showBottomPanel ? 'text-blue-500 font-semibold' : 'text-[var(--text-main)] hover:text-[var(--text-heading)]'}`}
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
              className="relative rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-2xl flex flex-col h-[550px] max-w-2xl w-full animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close Button */}
              <button 
                onClick={() => setShowBottomPanel(false)}
                className="absolute top-4 right-4 text-[var(--text-main)] hover:text-[var(--text-heading)] transition-all p-1.5 rounded-lg hover:bg-[var(--surface-card-soft)]"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Tabs Header */}
              <div className="flex items-center gap-6 border-b border-[var(--surface-border)] pb-3 mb-4 pr-10">
                <button
                  onClick={() => setActiveBottomTab('discussion')}
                  className={`text-xs font-black uppercase tracking-[0.25em] transition-all relative pb-3 flex items-center gap-2 ${
                    activeBottomTab === 'discussion' ? 'text-blue-500' : 'text-[var(--text-main)]/60 hover:text-[var(--text-heading)]'
                  }`}
                >
                  <span>Discussion</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeBottomTab === 'discussion' ? 'bg-blue-500/20 text-blue-300' : 'bg-[var(--surface-card-soft)] text-[var(--text-main)]/50'}`}>
                    {lessonActivity?.discussion?.length ?? 0}
                  </span>
                  {activeBottomTab === 'discussion' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveBottomTab('announcements')}
                  className={`text-xs font-black uppercase tracking-[0.25em] transition-all relative pb-3 flex items-center gap-2 ${
                    activeBottomTab === 'announcements' ? 'text-blue-500' : 'text-[var(--text-main)]/60 hover:text-[var(--text-heading)]'
                  }`}
                >
                  <span>Course Announcements</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeBottomTab === 'announcements' ? 'bg-blue-500/20 text-blue-300' : 'bg-[var(--surface-card-soft)] text-[var(--text-main)]/50'}`}>
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
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-[var(--surface-border)] scrollbar-track-transparent">
                    {(lessonActivity?.discussion ?? []).map((comment: any) => (
                      <div key={comment.id} className="rounded-lg bg-[var(--surface-card-soft)]/55 px-4 py-2.5 border border-[var(--surface-border)] animate-in fade-in duration-200 select-text">
                        <div className="text-xs font-bold text-[var(--text-main)]/70">{comment.user.firstName} {comment.user.lastName}</div>
                        <div className="mt-0.5 text-sm text-[var(--text-heading)] leading-relaxed">{comment.message}</div>
                      </div>
                    ))}
                    {(lessonActivity?.discussion?.length ?? 0) === 0 && (
                      <div className="text-xs text-[var(--text-main)]/50 py-3 font-medium">No discussion yet for this lesson.</div>
                    )}
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-[var(--surface-border)] flex gap-2 items-end">
                    <textarea 
                      value={discussionMessage} 
                      onChange={(e) => setDiscussionMessage(e.target.value)} 
                      placeholder="Ask a question or share an insight..." 
                      className="min-h-12 flex-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)]/50 px-4 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-blue-500/50 transition-colors placeholder:[var(--text-main)]/50 resize-none select-text" 
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
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-[var(--surface-border)] scrollbar-track-transparent">
                  {(lessonActivity?.announcements ?? []).map((announcement: any) => (
                    <div key={announcement.id} className="rounded-lg bg-[var(--surface-card-soft)]/55 px-4 py-3 border border-[var(--surface-border)] animate-in fade-in duration-200 select-text">
                      <div className="text-xs font-bold text-[var(--text-heading)]">{announcement.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-main)]/80 leading-relaxed">{announcement.body}</div>
                      <div className="mt-2 text-[10px] text-[var(--text-main)]/50 font-semibold">
                        {announcement.author.firstName} {announcement.author.lastName} • {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {(lessonActivity?.announcements?.length ?? 0) === 0 && (
                    <div className="text-xs text-[var(--text-main)]/50 py-3 font-medium">No announcements yet.</div>
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
