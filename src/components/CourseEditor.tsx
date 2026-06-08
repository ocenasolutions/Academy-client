'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Image as ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { formatINRFromPaise } from '@/lib/currency';
import { getAdminCategories, getAdminCourseDetail, updateCourse, updateCourseCurriculum, updateCourseStatus } from '@/lib/api';

type LessonDraft = {
  id?: string;
  quizId?: string;
  assignmentId?: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE';
  durationSeconds: number;
  isPreview: boolean;
  videoUrl: string;
  contentText: string;
  quizEnabled: boolean;
  quizTitle: string;
  quizDescription: string;
  quizPassingScore: number;
  quizQuestionsText: string;
  assignmentEnabled: boolean;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentDueAt: string;
};

type ModuleDraft = {
  id?: string;
  title: string;
  description: string;
  lessons: LessonDraft[];
};

type CourseBasicsDraft = {
  title: string;
  summary: string;
  description: string;
  thumbnailUrl: string;
  trailerUrl: string;
  priceCents: number;
  categoryId: string;
  level: string;
  language: string;
  status: string;
  isFeatured: boolean;
};

type Props = {
  courseId: string;
};

const lessonTypes: LessonDraft['type'][] = ['VIDEO', 'READING', 'QUIZ', 'ASSIGNMENT', 'LIVE'];

function toLessonDraft(lesson: any): LessonDraft {
  return {
    id: lesson.id,
    title: lesson.title || '',
    description: lesson.description || '',
    type: lesson.type || 'VIDEO',
    durationSeconds: lesson.durationSeconds ?? 0,
    isPreview: Boolean(lesson.isPreview),
    videoUrl: lesson.videoUrl || '',
    contentText: lesson.content ? JSON.stringify(lesson.content, null, 2) : '',
    quizEnabled: Boolean(lesson.quiz) || lesson.type === 'QUIZ',
    quizId: lesson.quiz?.id,
    quizTitle: lesson.quiz?.title || '',
    quizDescription: lesson.quiz?.description || '',
    quizPassingScore: lesson.quiz?.passingScore ?? 70,
    quizQuestionsText: lesson.quiz?.questions ? JSON.stringify(lesson.quiz.questions, null, 2) : '[]',
    assignmentEnabled: Boolean(lesson.assignment) || lesson.type === 'ASSIGNMENT',
    assignmentId: lesson.assignment?.id,
    assignmentTitle: lesson.assignment?.title || '',
    assignmentDescription: lesson.assignment?.description || '',
    assignmentDueAt: lesson.assignment?.dueAt ? new Date(lesson.assignment.dueAt).toISOString().slice(0, 16) : '',
  };
}

function toModuleDraft(module: any): ModuleDraft {
  return {
    id: module.id,
    title: module.title || '',
    description: module.description || '',
    lessons: (module.lessons || []).map(toLessonDraft),
  };
}

function rupeesToPaise(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100));
}

function paiseToRupees(paise: number) {
  return (Number(paise || 0) / 100).toFixed(2);
}

export function CourseEditor({ courseId }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [course, setCourse] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'basics' | 'curriculum' | 'quiz' | 'assignments' | 'media'>('basics');
  const [basics, setBasics] = useState<CourseBasicsDraft>({
    title: '',
    summary: '',
    description: '',
    thumbnailUrl: '',
    trailerUrl: '',
    priceCents: 0,
    categoryId: '',
    level: '',
    language: 'en',
    status: 'DRAFT',
    isFeatured: false,
  });
  const [modules, setModules] = useState<ModuleDraft[]>([]);

  const categoryOptions = useMemo(() => {
    const topLevel = categories.filter((category) => !category.parentId);
    return topLevel.length > 0 ? topLevel : categories;
  }, [categories]);

  const totalLessons = useMemo(() => modules.reduce((sum, module) => sum + module.lessons.length, 0), [modules]);
  const activeTabLabel = {
    basics: 'Basics',
    curriculum: 'Curriculum',
    quiz: 'Quizzes',
    assignments: 'Assignments',
    media: 'Media',
  }[activeTab];

  async function load() {
    setLoading(true);
    try {
      const [nextCourse, nextCategories] = await Promise.all([
        getAdminCourseDetail(courseId),
        getAdminCategories(),
      ]);
      setCourse(nextCourse);
      setCategories(nextCategories);
      setBasics({
        title: nextCourse.title || '',
        summary: nextCourse.summary || '',
        description: nextCourse.description || '',
        thumbnailUrl: nextCourse.thumbnailUrl || '',
        trailerUrl: nextCourse.trailerUrl || '',
        priceCents: nextCourse.priceCents ?? 0,
        categoryId: nextCourse.categoryId || nextCourse.category?.id || '',
        level: nextCourse.level || '',
        language: nextCourse.language || 'en',
        status: nextCourse.status || 'DRAFT',
        isFeatured: Boolean(nextCourse.isFeatured),
      });
      setModules((nextCourse.modules || []).map(toModuleDraft));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load course editor', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  function updateLesson(moduleIndex: number, lessonIndex: number, updater: (lesson: LessonDraft) => LessonDraft) {
    setModules((current) =>
      current.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, currentLessonIndex) => (currentLessonIndex === lessonIndex ? updater(lesson) : lesson)),
            }
          : module,
      ),
    );
  }

  function buildCurriculumPayload() {
    return {
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description || undefined,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || undefined,
          type: lesson.type,
          content: lesson.contentText.trim()
            ? safeParseJson(lesson.contentText, { raw: lesson.contentText })
            : undefined,
          videoUrl: lesson.videoUrl || undefined,
          durationSeconds: Number(lesson.durationSeconds || 0),
          isPreview: Boolean(lesson.isPreview),
          quiz: lesson.quizEnabled
            ? {
                id: lesson.quizId,
                title: lesson.quizTitle || `${lesson.title || 'Quiz'} Quiz`,
                description: lesson.quizDescription || undefined,
                passingScore: Number(lesson.quizPassingScore || 70),
                questions: safeParseJson(lesson.quizQuestionsText, []),
              }
            : undefined,
          assignment: lesson.assignmentEnabled
            ? {
                id: lesson.assignmentId,
                title: lesson.assignmentTitle || `${lesson.title || 'Assignment'} Assignment`,
                description: lesson.assignmentDescription || undefined,
                dueAt: lesson.assignmentDueAt || undefined,
              }
            : undefined,
        })),
      })),
    };
  }

  async function saveBasics() {
    setSavingBasics(true);
    try {
      const payload: Record<string, unknown> = {};
      const originalCategoryId = course.categoryId || course.category?.id || '';
      const originalPriceCents = Number(course.priceCents ?? 0);

      // PERF: only send changed basics fields so unchanged large descriptions do not get pushed back through the update route.
      if (basics.title !== (course.title || '')) payload.title = basics.title;
      if (basics.summary !== (course.summary || '')) payload.summary = basics.summary;
      if (basics.description !== (course.description || '')) payload.description = basics.description;
      if ((basics.thumbnailUrl || '') !== (course.thumbnailUrl || '')) payload.thumbnailUrl = basics.thumbnailUrl || undefined;
      if ((basics.trailerUrl || '') !== (course.trailerUrl || '')) payload.trailerUrl = basics.trailerUrl || undefined;
      if (Number(basics.priceCents || 0) !== originalPriceCents) payload.priceCents = Number(basics.priceCents || 0);
      if ((basics.categoryId || '') !== originalCategoryId) payload.categoryId = basics.categoryId || undefined;
      if (basics.level !== (course.level || '')) payload.level = basics.level;
      if (basics.language !== (course.language || 'en')) payload.language = basics.language;
      if (Boolean(basics.isFeatured) !== Boolean(course.isFeatured)) payload.isFeatured = basics.isFeatured;

      if (Object.keys(payload).length > 0) {
        await updateCourse(courseId, payload);
      }
      if (basics.status !== course.status) {
        // PERF: keep status changes on the dedicated backend route instead of mixing them into the generic basics payload.
        await updateCourseStatus(courseId, basics.status);
      }
      if (Object.keys(payload).length === 0 && basics.status === course.status) {
        addToast('No basics changes to save.', 'success');
        return;
      }
      addToast('Course basics saved.', 'success');
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save course basics', 'error');
    } finally {
      setSavingBasics(false);
    }
  }

  async function saveCurriculum() {
    setSavingCurriculum(true);
    try {
      const payload = buildCurriculumPayload();
      await updateCourseCurriculum(courseId, payload);
      addToast('Course curriculum saved.', 'success');
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save curriculum', 'error');
    } finally {
      setSavingCurriculum(false);
    }
  }

  function addModule() {
    setModules((current) => [
      ...current,
      {
        title: 'New Module',
        description: '',
        lessons: [
          {
            title: 'New Lesson',
            description: '',
            type: 'VIDEO',
            durationSeconds: 0,
            isPreview: false,
            videoUrl: '',
            contentText: '',
            quizEnabled: false,
            quizTitle: '',
            quizDescription: '',
            quizPassingScore: 70,
            quizQuestionsText: '[]',
            assignmentEnabled: false,
            assignmentTitle: '',
            assignmentDescription: '',
            assignmentDueAt: '',
          },
        ],
      },
    ]);
  }

  function addLesson(moduleIndex: number) {
    setModules((current) =>
      current.map((module, currentIndex) =>
        currentIndex === moduleIndex
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  title: 'New Lesson',
                  description: '',
                  type: 'VIDEO',
                  durationSeconds: 0,
                  isPreview: false,
                  videoUrl: '',
                  contentText: '',
                  quizEnabled: false,
                  quizTitle: '',
                  quizDescription: '',
                  quizPassingScore: 70,
                  quizQuestionsText: '[]',
                  assignmentEnabled: false,
                  assignmentTitle: '',
                  assignmentDescription: '',
                  assignmentDueAt: '',
                },
              ],
            }
          : module,
      ),
    );
  }

  function removeModule(moduleIndex: number) {
    setModules((current) => current.filter((_, index) => index !== moduleIndex));
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    setModules((current) =>
      current.map((module, currentIndex) =>
        currentIndex === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.filter((_, index) => index !== lessonIndex),
            }
          : module,
      ),
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading course editor...</div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="admin">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Course not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/dashboard/admin/courses" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-brand-700">
            <BookOpen className="h-4 w-4" /> Edit Course
          </div>
          <h1 className="mt-4 text-4xl font-black text-slate-900">{course.title}</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">
            Edit the course basics, remove modules or lessons by deleting them from the list, and save quiz or assignment changes from the same editor.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={saveBasics} disabled={savingBasics} className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-black text-white shadow-sm">
            {savingBasics ? 'Saving Basics...' : 'Save Basics'}
          </button>
          <button onClick={saveCurriculum} disabled={savingCurriculum} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm">
            {savingCurriculum ? 'Saving Curriculum...' : 'Save Curriculum'}
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 rounded-[26px] border border-slate-200 bg-white p-2 shadow-sm">
        {[
          ['basics', 'Basics'],
          ['curriculum', 'Curriculum'],
          ['quiz', 'Quizzes'],
          ['assignments', 'Assignments'],
          ['media', 'Media'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              activeTab === key ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,320px]">
        <div className="space-y-8">
          {activeTab === 'basics' && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Course Basics</h2>
                <p className="mt-1 text-sm text-slate-600">Title, description, category, pricing, and publish state.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {course.status}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <input value={basics.title} onChange={(e) => setBasics((current) => ({ ...current, title: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Course title" />
                <p className="text-xs font-medium text-slate-500">This is the name learners see in the catalog and dashboard.</p>
              </div>
              <div className="space-y-2">
                <select value={basics.categoryId} onChange={(e) => setBasics((current) => ({ ...current, categoryId: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parentId ? `• ${category.name}` : category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-medium text-slate-500">Choose the main category that best matches the course topic.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <textarea value={basics.summary} onChange={(e) => setBasics((current) => ({ ...current, summary: e.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Short summary" />
                <p className="text-xs font-medium text-slate-500">A short 1-2 line summary shown in course cards and previews.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <textarea value={basics.description} onChange={(e) => setBasics((current) => ({ ...current, description: e.target.value }))} className="min-h-40 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Full description" />
                <p className="text-xs font-medium text-slate-500">The full course description shown on the course detail page.</p>
              </div>
              <div className="space-y-2">
                <input type="number" step="0.01" value={paiseToRupees(basics.priceCents)} onChange={(e) => setBasics((current) => ({ ...current, priceCents: rupeesToPaise(e.target.value) }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Price in rupees" />
                <p className="text-xs font-medium text-slate-500">Enter rupees here. The app converts it to paise behind the scenes.</p>
              </div>
              <div className="space-y-2">
                <input value={basics.level} onChange={(e) => setBasics((current) => ({ ...current, level: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Level" />
                <p className="text-xs font-medium text-slate-500">Difficulty label shown to learners, like Beginner or Advanced.</p>
              </div>
              <div className="space-y-2">
                <input value={basics.language} onChange={(e) => setBasics((current) => ({ ...current, language: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Language" />
                <p className="text-xs font-medium text-slate-500">Language code for the course, usually `en` for English.</p>
              </div>
              <div className="space-y-2">
                <select value={basics.status} onChange={(e) => setBasics((current) => ({ ...current, status: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <option value="DRAFT">DRAFT</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <p className="text-xs font-medium text-slate-500">Controls whether the course is hidden, under review, live, or archived.</p>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
                <input type="checkbox" checked={basics.isFeatured} onChange={(e) => setBasics((current) => ({ ...current, isFeatured: e.target.checked }))} />
                <span className="text-sm font-bold text-slate-700">Featured course</span>
                <span className="text-xs font-medium text-slate-500">Show this course prominently in featured sections.</span>
              </label>
            </div>
          </section>
          )}

          {activeTab === 'media' && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-slate-900">Media</h2>
                <p className="mt-1 text-sm text-slate-600">Thumbnail, trailer, and preview assets for the course listing.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={basics.thumbnailUrl} onChange={(e) => setBasics((current) => ({ ...current, thumbnailUrl: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Thumbnail URL" />
                <input value={basics.trailerUrl} onChange={(e) => setBasics((current) => ({ ...current, trailerUrl: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Trailer URL" />
              </div>
              <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                <div className="aspect-[16/8] w-full bg-gradient-to-br from-slate-100 to-slate-200">
                  {basics.thumbnailUrl ? (
                    <img src={basics.thumbnailUrl} alt="Course preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">Thumbnail preview</div>
                  )}
                </div>
                <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                  Use this media for the course card, detail page, and admin preview.
                </div>
              </div>
            </section>
          )}

          {(activeTab === 'curriculum' || activeTab === 'quiz' || activeTab === 'assignments') && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {activeTab === 'curriculum' ? 'Curriculum' : activeTab === 'quiz' ? 'Quizzes' : 'Assignments'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {activeTab === 'curriculum'
                    ? 'Remove modules or lessons by deleting them, then save.'
                    : activeTab === 'quiz'
                      ? 'Edit quiz title, score, and questions per lesson.'
                      : 'Edit assignment details per lesson.'}
                </p>
              </div>
              <button onClick={addModule} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                <Plus className="mr-2 inline-block h-4 w-4" /> Add Module
              </button>
            </div>

            <div className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <div key={module.id ?? moduleIndex} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid flex-1 gap-3">
                      <input value={module.title} onChange={(e) => setModules((current) => current.map((entry, index) => (index === moduleIndex ? { ...entry, title: e.target.value } : entry)))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black" placeholder="Module title" />
                      <textarea value={module.description} onChange={(e) => setModules((current) => current.map((entry, index) => (index === moduleIndex ? { ...entry, description: e.target.value } : entry)))} className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Module description" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addLesson(moduleIndex)} className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-black text-white">
                        <Plus className="mr-2 inline-block h-4 w-4" /> Add Lesson
                      </button>
                      <button onClick={() => removeModule(moduleIndex)} className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-700">
                        <Trash2 className="mr-2 inline-block h-4 w-4" /> Delete Module
                      </button>
                    </div>
                  </div>

                    <div className="mt-5 space-y-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id ?? lessonIndex} className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="grid flex-1 gap-3">
                              {(activeTab === 'curriculum' || activeTab === 'quiz' || activeTab === 'assignments') && (
                                <>
                                  <div className="grid gap-3 md:grid-cols-[1fr,220px]">
                                    <input
                                      value={lesson.title}
                                      onChange={(e) =>
                                        updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, title: e.target.value }))
                                      }
                                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold"
                                      placeholder="Lesson title"
                                    />
                                    <select
                                      value={lesson.type}
                                      onChange={(e) =>
                                        updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, type: e.target.value as LessonDraft['type'] }))
                                      }
                                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                    >
                                      {lessonTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {activeTab === 'curriculum' && (
                                    <>
                                      <textarea
                                        value={lesson.description}
                                        onChange={(e) =>
                                          updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, description: e.target.value }))
                                        }
                                        className="min-h-20 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                        placeholder="Lesson description"
                                      />
                                      <div className="grid gap-3 md:grid-cols-3">
                                        <input
                                          value={lesson.durationSeconds}
                                          onChange={(e) =>
                                            updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, durationSeconds: Number(e.target.value) || 0 }))
                                          }
                                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                          placeholder="Duration seconds"
                                        />
                                        <input
                                          value={lesson.videoUrl}
                                          onChange={(e) =>
                                            updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, videoUrl: e.target.value }))
                                          }
                                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2"
                                          placeholder="Video URL"
                                        />
                                      </div>
                                      <textarea
                                        value={lesson.contentText}
                                        onChange={(e) =>
                                          updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, contentText: e.target.value }))
                                        }
                                        className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs"
                                        placeholder="Lesson content JSON"
                                      />
                                      <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={lesson.isPreview}
                                          onChange={(e) =>
                                            updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, isPreview: e.target.checked }))
                                          }
                                        />
                                        Preview lesson
                                      </label>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            <button onClick={() => removeLesson(moduleIndex, lessonIndex)} className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-700">
                              <Trash2 className="mr-2 inline-block h-4 w-4" /> Delete Lesson
                            </button>
                          </div>

                        {(activeTab === 'quiz' && (lesson.type === 'QUIZ' || lesson.quizEnabled)) && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="text-sm font-black text-slate-900">Quiz</div>
                              <button
                                onClick={() => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizEnabled: !current.quizEnabled }))}
                                className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700"
                              >
                                {lesson.quizEnabled ? 'Keep Quiz' : 'Enable Quiz'}
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input value={lesson.quizTitle} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizTitle: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Quiz title" />
                              <input type="number" min={0} max={100} value={lesson.quizPassingScore} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizPassingScore: Number(e.target.value) || 70 }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Passing score" />
                              <textarea value={lesson.quizDescription} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizDescription: e.target.value }))} className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2" placeholder="Quiz description" />
                              <textarea value={lesson.quizQuestionsText} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizQuestionsText: e.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs md:col-span-2" placeholder="Quiz questions JSON" />
                            </div>
                            <button
                              onClick={() => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, quizEnabled: false, quizTitle: '', quizDescription: '', quizQuestionsText: '[]' }))}
                              className="mt-3 rounded-2xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-700"
                            >
                              Remove Quiz
                            </button>
                          </div>
                        )}

                        {(activeTab === 'assignments' && (lesson.type === 'ASSIGNMENT' || lesson.assignmentEnabled)) && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="text-sm font-black text-slate-900">Assignment</div>
                              <button
                                onClick={() => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, assignmentEnabled: !current.assignmentEnabled }))}
                                className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700"
                              >
                                {lesson.assignmentEnabled ? 'Keep Assignment' : 'Enable Assignment'}
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input value={lesson.assignmentTitle} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, assignmentTitle: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Assignment title" />
                              <input type="datetime-local" value={lesson.assignmentDueAt} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, assignmentDueAt: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" />
                              <textarea value={lesson.assignmentDescription} onChange={(e) => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, assignmentDescription: e.target.value }))} className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2" placeholder="Assignment description" />
                            </div>
                            <button
                              onClick={() => updateLesson(moduleIndex, lessonIndex, (current) => ({ ...current, assignmentEnabled: false, assignmentTitle: '', assignmentDescription: '', assignmentDueAt: '' }))}
                              className="mt-3 rounded-2xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-700"
                            >
                              Remove Assignment
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-brand-600" />
              <div className="text-lg font-black text-slate-900">Preview · {activeTabLabel}</div>
            </div>
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">{basics.title || 'Untitled Course'}</div>
              <div className="mt-1 text-xs text-slate-600">{basics.summary || 'No summary yet.'}</div>
              <div className="mt-3 text-xs font-bold text-slate-500">
                {basics.level || 'Level not set'} • {basics.language || 'en'} • {course.modules?.length ?? modules.length} modules
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                Remove a module or lesson from the list and press Save Curriculum to delete it from the course.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                Quiz and assignment content is edited inline under the lesson it belongs to.
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-lg font-black text-slate-900">Course Stats</div>
            <div className="mt-4 grid gap-3">
              <Stat label="Modules" value={String(modules.length)} />
              <Stat label="Lessons" value={String(totalLessons)} />
              <Stat label="Price" value={formatINRFromPaise(Number(basics.priceCents || 0))} />
              <Stat label="Featured" value={basics.isFeatured ? 'Yes' : 'No'} />
            </div>
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function safeParseJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}
