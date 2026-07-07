'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle2, Clock3, FileText, Film, ImageIcon, Layers3, Sparkles } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { formatINRFromPaise } from '@/lib/currency';
import {
  applyAiCourseGenerationJob,
  generateAiCourseDraft,
  getCategories,
  getMyAiCourseGenerationJobs,
  getCourse,
} from '@/lib/api';
import { AiCourseGenerationJob, Category } from '@/types';

type Props = {
  role: 'admin' | 'instructor';
  onCourseApplied?: (courseId: string) => Promise<void> | void;
};

const panelClass = 'rounded-[1.75rem] border border-slate-200 bg-white/90 shadow-sm';
const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const mutedCardClass = 'rounded-2xl border border-slate-200 bg-slate-50';
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[var(--color-text-heading)] outline-none transition placeholder:text-slate-400 focus:border-brand-500';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(var(--brand-500-rgb,59,130,246),0.2)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--color-text-heading)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

const initialForm = {
  title: '',
  prompt: '',
  context:
    'Content quality should match premium platforms like Coursera and Udemy. Generate structured modules, quizzes, assignments, project work, certificates, image briefs, and video production notes. Focus on employability and real-world skills.',
  targetAudience: '',
  difficulty: 'Intermediate',
  estimatedHours: 8,
  language: 'en',
  priceCents: 0,
  moduleCount: 4,
  lessonsPerModule: 4,
  categoryId: '',
  learningObjectives: '',
  industryFocus: '',
  teachingStyle: 'Project-Based',
  additionalInstructions: '',
  includeQuizzes: true,
  includeAssignments: true,
  includeMedia: true,
};

function rupeesToPaise(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100));
}

function paiseToRupees(paise: number) {
  return (Number(paise || 0) / 100).toFixed(2);
}

export function AiCourseStudio({ role, onCourseApplied }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [jobs, setJobs] = useState<AiCourseGenerationJob[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applyingMode, setApplyingMode] = useState<'draft' | 'review' | null>(null);
  const targetHours = Math.max(5, Math.min(8, Number(form.estimatedHours) || 8));

  async function load() {
    setLoading(true);
    try {
      const [nextJobs, nextCategories] = await Promise.all([getMyAiCourseGenerationJobs(), getCategories()]);
      setJobs(nextJobs);
      setCategories(nextCategories);
      setSelectedJobId((current) => current || nextJobs[0]?.id || '');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load AI studio', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  const blueprint = selectedJob?.result ?? null;

  async function handleGenerate() {
    if (!form.title.trim() || !form.prompt.trim()) {
      addToast('Title and prompt are required.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const job = await generateAiCourseDraft(form);
      setJobs((current) => [job, ...current]);
      setSelectedJobId(job.id);
      addToast('AI course blueprint generated.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to generate blueprint', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply(submitForReview: boolean) {
    if (!selectedJob) {
      addToast('Select a generated blueprint first.', 'error');
      return;
    }

    setApplyingMode(submitForReview ? 'review' : 'draft');
    try {
      const course = await applyAiCourseGenerationJob(selectedJob.id, { submitForReview });
      await load();
      if (course?.id && onCourseApplied) {
        await onCourseApplied(course.id);
      }
      addToast(
        submitForReview ? 'Course draft applied and moved to review.' : 'Course draft applied to workspace.',
        'success',
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to apply blueprint', 'error');
    } finally {
      setApplyingMode(null);
    }
  }

  async function handleViewAsStudent(courseId: string) {
    try {
      const courseDetails = await getCourse(courseId);
      const firstLessonId = courseDetails?.modules?.[0]?.lessons?.[0]?.id;
      if (firstLessonId) {
        router.push(`/course/${courseId}/lesson/${firstLessonId}`);
      } else {
        addToast('No lessons found in this course. Please publish or check course structure.', 'info');
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load course for preview', 'error');
    }
  }

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-500/10 px-4 py-2 text-sm font-black text-brand-600">
            <Bot className="w-4 h-4" />
            Open-source-ready AI Course Studio
          </div>
          <h2 className="mt-4 text-3xl font-display font-black text-[var(--color-text-heading)]">
            {role === 'admin' ? 'Build and approve complete course drafts' : 'Generate complete course drafts before publishing'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-[var(--color-text-main)]/70">
            Generate modules, chapter pacing, MCQ quizzes, assignments, student-visible duration, hero artwork, and trailer storyboards from structured course inputs through Groq.
          </p>
          <p className="mt-3 max-w-3xl text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-main)]/45">
            Put the platform or business context first so pricing, review flow, media output, and student preview stay aligned with the course.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Blueprints" value={String(jobs.length)} icon={<Layers3 className="w-4 h-4" />} />
          <Metric label="Ready To Apply" value={String(jobs.filter((job) => job.status === 'COMPLETED').length)} icon={<CheckCircle2 className="w-4 h-4" />} />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className={`${panelClass} p-6`}>
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-brand-600">
              <Sparkles className="w-4 h-4" />
              Prompt Builder
            </div>
            <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-950">
              Recommended course size is <span className="font-black">5-8 hours</span>. Use the duration and module controls below to set the amount of content the AI should generate.
            </div>
            <div className="grid gap-4">
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Course name or topic"
                className={inputClass}
              />
              <p className="text-xs font-medium text-slate-500">The course title shown to learners and admins.</p>
              <textarea
                value={form.context}
                onChange={(e) => setForm((current) => ({ ...current, context: e.target.value }))}
                placeholder="Platform or business context: where this course will be used, who reviews it, and what the student should see."
                className={`${inputClass} min-h-28`}
              />
              <p className="text-xs font-medium text-slate-500">Use this to tell AI about the business rules, review flow, and platform goals for the course.</p>
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((current) => ({ ...current, prompt: e.target.value }))}
                placeholder="Course brief: what students should learn, build, or achieve."
                className={`${inputClass} min-h-36`}
              />
              <p className="text-xs font-medium text-slate-500">Describe the actual course outcome, topic, and scope.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.targetAudience} onChange={(e) => setForm((current) => ({ ...current, targetAudience: e.target.value }))} placeholder="Target audience" className={inputClass} />
                <select value={form.difficulty} onChange={(e) => setForm((current) => ({ ...current, difficulty: e.target.value }))} className={inputClass}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-xs font-medium text-slate-500">Who this is for, such as students, working professionals, or founders.</p>
                <p className="text-xs font-medium text-slate-500">How hard the course should feel for the learner.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.industryFocus} onChange={(e) => setForm((current) => ({ ...current, industryFocus: e.target.value }))} placeholder="Industry focus: SaaS, FinTech, EdTech..." className={inputClass} />
                <select value={form.teachingStyle} onChange={(e) => setForm((current) => ({ ...current, teachingStyle: e.target.value }))} className={inputClass}>
                  <option value="Project-Based">Project-Based</option>
                  <option value="Theory-Heavy">Theory-Heavy</option>
                  <option value="Workshop-Style">Workshop-Style</option>
                  <option value="Case-Study">Case-Study</option>
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <p className="text-xs font-medium text-slate-500">Optional industry lens like SaaS, fintech, healthtech, or cloud.</p>
                <p className="text-xs font-medium text-slate-500">Tells the AI whether to favor practical projects, theory, or workshop flow.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-4">
                <FieldBlock
                  label="Target duration"
                  helper="Set the full course length in hours. Recommended: 5-8."
                  value={`${targetHours} hours`}
                >
                  <input
                    type="number"
                    min={5}
                    max={8}
                    value={form.estimatedHours}
                    onChange={(e) => setForm((current) => ({ ...current, estimatedHours: Number(e.target.value) || 8 }))}
                    className={inputClass}
                  />
                </FieldBlock>
                <FieldBlock
                  label="Price (INR)"
                  helper="Type the rupee amount here. The backend converts it to paise automatically."
                  value={`₹${paiseToRupees(form.priceCents)}`}
                >
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={paiseToRupees(form.priceCents)}
                    onChange={(e) => setForm((current) => ({ ...current, priceCents: rupeesToPaise(e.target.value) }))}
                    className={inputClass}
                  />
                </FieldBlock>
                <FieldBlock
                  label="Modules"
                  helper="How many major sections the course should have."
                  value={`${form.moduleCount} sections`}
                >
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={form.moduleCount}
                    onChange={(e) => setForm((current) => ({ ...current, moduleCount: Number(e.target.value) || 4 }))}
                    className={inputClass}
                  />
                </FieldBlock>
                <FieldBlock
                  label="Lessons per module"
                  helper="How many lessons AI should create inside each module."
                  value={`${form.lessonsPerModule} lessons`}
                >
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={form.lessonsPerModule}
                    onChange={(e) => setForm((current) => ({ ...current, lessonsPerModule: Number(e.target.value) || 4 }))}
                    className={inputClass}
                  />
                </FieldBlock>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <input value={form.language} onChange={(e) => setForm((current) => ({ ...current, language: e.target.value }))} placeholder="Language code" className={inputClass} />
                  <p className="text-xs font-medium text-slate-500">Language code for the generated course, like `en` or `hi`.</p>
                </div>
                <div className="space-y-2">
                  <select value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))} className={inputClass}>
                  <option value="">Auto category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                  </select>
                  <p className="text-xs font-medium text-slate-500">Leave blank to let AI choose the best category automatically.</p>
                </div>
              </div>
              <textarea
                value={form.learningObjectives}
                onChange={(e) => setForm((current) => ({ ...current, learningObjectives: e.target.value }))}
                placeholder="Core learning objectives, one per line"
                className={`${inputClass} min-h-28`}
              />
              <p className="text-xs font-medium text-slate-500">Write the exact skills or outcomes you want the learner to leave with.</p>
              <textarea
                value={form.additionalInstructions}
                onChange={(e) => setForm((current) => ({ ...current, additionalInstructions: e.target.value }))}
                placeholder="Additional instructions for AI generation"
                className={`${inputClass} min-h-24`}
              />
              <p className="text-xs font-medium text-slate-500">Any special structure, tone, or constraints AI should follow.</p>
              <div className="grid gap-3 md:grid-cols-3">
                <Toggle label="MCQ quizzes" checked={form.includeQuizzes} onChange={(checked) => setForm((current) => ({ ...current, includeQuizzes: checked }))} />
                <Toggle label="Assignments" checked={form.includeAssignments} onChange={(checked) => setForm((current) => ({ ...current, includeAssignments: checked }))} />
                <Toggle label="Image and video briefs" checked={form.includeMedia} onChange={(checked) => setForm((current) => ({ ...current, includeMedia: checked }))} />
              </div>
              <button onClick={handleGenerate} disabled={generating} className={primaryButtonClass}>
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate Blueprint'}
              </button>
            </div>
          </div>

          <div className={`${panelClass} p-6`}>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-brand-600">Recent generations</div>
            {loading ? (
              <div className="text-sm font-medium text-[var(--color-text-main)]/60">Loading AI jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-sm font-medium text-[var(--color-text-main)]/60">No AI blueprints yet.</div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 6).map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedJob?.id === job.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-[var(--color-text-heading)]">{job.title}</div>
                      <div className="text-xs font-black text-brand-600">{job.status}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{job.result?.studentPreview.headline || job.prompt}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--color-text-main)]/60">
                      <span>{job.totalTokens} tokens</span>
                      <span>₹{Number(job.estimatedCostUsd ?? 0).toFixed(4)}</span>
                      <span>{job.course ? `Linked: ${job.course.title}` : 'Draft only'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${panelClass} p-6`}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">Student preview</div>
                <div className="mt-2 text-2xl font-display font-black text-[var(--color-text-heading)]">
                  {blueprint?.title || 'Select a blueprint'}
                </div>
              </div>
              {blueprint?.assets.heroImage?.dataUrl ? (
                <img src={blueprint.assets.heroImage.dataUrl} alt={blueprint.assets.heroImage.alt} className="h-24 w-40 rounded-2xl object-cover shadow-inner" />
              ) : null}
            </div>

            {!blueprint ? (
              <div className="text-sm font-medium text-[var(--color-text-main)]/60">Generate a blueprint to preview the student-facing syllabus and media plan.</div>
            ) : (
              <div className="space-y-5">
                <div className={`${mutedCardClass} p-4`}>
                  <div className="font-black text-[var(--color-text-heading)]">{blueprint.studentPreview.headline}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{blueprint.summary}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--color-text-main)]/60">
                    <span>{blueprint.difficulty}</span>
                    <span>{blueprint.industryFocus || 'General'}</span>
                    <span>{blueprint.teachingStyle || 'Project-Based'}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Time To Complete" value={blueprint.studentPreview.durationLabel} icon={<Clock3 className="w-4 h-4" />} />
                  <Metric label="Modules / Lessons" value={`${blueprint.studentPreview.moduleCount} / ${blueprint.studentPreview.lessonCount}`} icon={<Layers3 className="w-4 h-4" />} />
                  <Metric label="Quizzes" value={String(blueprint.studentPreview.quizCount)} icon={<FileText className="w-4 h-4" />} />
                  <Metric label="Assignments" value={String(blueprint.studentPreview.assignmentCount)} icon={<CheckCircle2 className="w-4 h-4" />} />
                </div>

                <div>
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">Learning outcomes</div>
                  <div className="space-y-2">
                    {blueprint.outcomes.map((outcome) => (
                      <div key={outcome} className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-medium text-[var(--color-text-main)]/80">
                        {outcome}
                      </div>
                    ))}
                  </div>
                </div>

                {blueprint.context ? (
                  <div>
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">Generation context</div>
                  <div className={`${mutedCardClass} px-4 py-3 text-sm font-medium text-[var(--color-text-main)]/80`}>
                      {blueprint.context}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">Open-source media workflow</div>
                  <div className="grid gap-3">
                    <MediaCard icon={<ImageIcon className="w-4 h-4" />} title="Hero image prompt" body={blueprint.assets.heroImage.prompt} />
                    <MediaCard icon={<Film className="w-4 h-4" />} title="Trailer storyboard" body={blueprint.assets.trailerStoryboard.scenes.join(' ')} />
                  </div>
                </div>

                {blueprint.assets.moduleVisuals?.length ? (
                  <div>
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">Generated module visuals</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {blueprint.assets.moduleVisuals.map((visual) => (
                        <div key={visual.title} className={`${cardClass} overflow-hidden`}>
                          <img src={visual.dataUrl} alt={visual.alt} className="h-40 w-full object-cover" />
                          <div className="p-4">
                            <div className="text-sm font-black text-[var(--color-text-heading)]">{visual.title}</div>
                            <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{visual.prompt}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleApply(false)} disabled={applyingMode !== null} className={primaryButtonClass}>
                    {applyingMode === 'draft' ? 'Applying...' : selectedJob?.course ? 'Update Draft Course' : 'Create Draft Course'}
                  </button>
                  <button onClick={() => handleApply(true)} disabled={applyingMode !== null} className={`${secondaryButtonClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                    {applyingMode === 'review' ? 'Submitting...' : 'Apply And Submit For Review'}
                  </button>
                  {selectedJob?.course?.id && (
                    <button
                      onClick={() => handleViewAsStudent(selectedJob.course.id)}
                      className={`${secondaryButtonClass} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                    >
                      <Sparkles className="h-4 w-4" />
                      View as Student
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {blueprint && (
            <div className={`${panelClass} p-6`}>
              <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-brand-600">Generated structure</div>
              <div className="space-y-4">
                {blueprint.modules.map((module) => (
                  <div key={module.title} className={`${mutedCardClass} p-4`}>
                    <div className="font-black text-[var(--color-text-heading)]">{module.title}</div>
                    <div className="mt-1 text-sm text-[var(--color-text-main)]/70">{module.description}</div>
                    <div className="mt-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={`${module.title}-${lesson.title}`} className={`${cardClass} px-4 py-3`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-bold text-[var(--color-text-heading)]">{lesson.title}</div>
                            <div className="text-xs font-black text-brand-600">
                              {lesson.type} • {Math.round(lesson.durationSeconds / 60)}m
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-[var(--color-text-main)]/70">{lesson.description}</div>
                          {lesson.quiz ? (
                            <div className="mt-2 text-xs font-medium text-[var(--color-text-main)]/65">
                              {lesson.quiz.questions.length} MCQs • passing score {lesson.quiz.passingScore}%
                            </div>
                          ) : null}
                          {lesson.assignment ? (
                            <div className="mt-2 text-xs font-medium text-[var(--color-text-main)]/65">
                              Assignment deliverables: {lesson.assignment.deliverables.join(', ')}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[var(--color-text-heading)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-brand-600">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-lg font-black text-[var(--color-text-heading)]">{value}</div>
    </div>
  );
}

function MediaCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-heading)]">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{body}</div>
    </div>
  );
}

function FieldBlock({
  label,
  helper,
  value,
  children,
}: {
  label: string;
  helper: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black text-[var(--color-text-heading)]">{label}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{helper}</div>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-brand-600 shadow-sm">{value}</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
