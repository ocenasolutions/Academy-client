'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock3, FileText, Film, ImageIcon, Layers3, Sparkles } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  applyAiCourseGenerationJob,
  generateAiCourseDraft,
  getCategories,
  getMyAiCourseGenerationJobs,
} from '@/lib/api';
import { AiCourseGenerationJob, Category } from '@/types';

type Props = {
  role: 'admin' | 'instructor';
  onCourseApplied?: (courseId: string) => Promise<void> | void;
};

const initialForm = {
  title: '',
  prompt: '',
  context:
    ' Content quality should match premium platforms like Coursera and Udemy. Generate structured modules, quizzes, assignments, project work, certificates, image briefs, and video production notes. Focus on employability and real-world skills.',
  targetAudience: '',
  difficulty: 'Intermediate',
  estimatedHours: 12,
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

export function AiCourseStudio({ role, onCourseApplied }: Props) {
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [jobs, setJobs] = useState<AiCourseGenerationJob[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applyingMode, setApplyingMode] = useState<'draft' | 'review' | null>(null);

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

  return (
    <div className="clay p-8">
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
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Blueprints" value={String(jobs.length)} icon={<Layers3 className="w-4 h-4" />} />
          <Metric label="Ready To Apply" value={String(jobs.filter((job) => job.status === 'COMPLETED').length)} icon={<CheckCircle2 className="w-4 h-4" />} />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-brand-600">
              <Sparkles className="w-4 h-4" />
              Prompt Builder
            </div>
            <div className="grid gap-4">
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Course name or topic"
                className="clay-input !py-3"
              />
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((current) => ({ ...current, prompt: e.target.value }))}
                placeholder="Course brief: what students should learn, build, or achieve."
                className="clay-input min-h-36 !py-3"
              />
              <textarea
                value={form.context}
                onChange={(e) => setForm((current) => ({ ...current, context: e.target.value }))}
                placeholder="Business or platform context"
                className="clay-input min-h-28 !py-3"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.targetAudience} onChange={(e) => setForm((current) => ({ ...current, targetAudience: e.target.value }))} placeholder="Target audience" className="clay-input !py-3" />
                <select value={form.difficulty} onChange={(e) => setForm((current) => ({ ...current, difficulty: e.target.value }))} className="clay-input !py-3">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.industryFocus} onChange={(e) => setForm((current) => ({ ...current, industryFocus: e.target.value }))} placeholder="Industry focus: SaaS, FinTech, EdTech..." className="clay-input !py-3" />
                <select value={form.teachingStyle} onChange={(e) => setForm((current) => ({ ...current, teachingStyle: e.target.value }))} className="clay-input !py-3">
                  <option value="Project-Based">Project-Based</option>
                  <option value="Theory-Heavy">Theory-Heavy</option>
                  <option value="Workshop-Style">Workshop-Style</option>
                  <option value="Case-Study">Case-Study</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <input type="number" min={1} value={form.estimatedHours} onChange={(e) => setForm((current) => ({ ...current, estimatedHours: Number(e.target.value) || 1 }))} placeholder="Hours" className="clay-input !py-3" />
                <input type="number" min={0} value={form.priceCents} onChange={(e) => setForm((current) => ({ ...current, priceCents: Number(e.target.value) || 0 }))} placeholder="Price cents" className="clay-input !py-3" />
                <input type="number" min={2} max={8} value={form.moduleCount} onChange={(e) => setForm((current) => ({ ...current, moduleCount: Number(e.target.value) || 4 }))} placeholder="Modules" className="clay-input !py-3" />
                <input type="number" min={2} max={6} value={form.lessonsPerModule} onChange={(e) => setForm((current) => ({ ...current, lessonsPerModule: Number(e.target.value) || 4 }))} placeholder="Lessons/module" className="clay-input !py-3" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.language} onChange={(e) => setForm((current) => ({ ...current, language: e.target.value }))} placeholder="Language code" className="clay-input !py-3" />
                <select value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))} className="clay-input !py-3">
                  <option value="">Auto category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.learningObjectives}
                onChange={(e) => setForm((current) => ({ ...current, learningObjectives: e.target.value }))}
                placeholder="Core learning objectives, one per line"
                className="clay-input min-h-28 !py-3"
              />
              <textarea
                value={form.additionalInstructions}
                onChange={(e) => setForm((current) => ({ ...current, additionalInstructions: e.target.value }))}
                placeholder="Additional instructions for AI generation"
                className="clay-input min-h-24 !py-3"
              />
              <div className="grid gap-3 md:grid-cols-3">
                <Toggle label="MCQ quizzes" checked={form.includeQuizzes} onChange={(checked) => setForm((current) => ({ ...current, includeQuizzes: checked }))} />
                <Toggle label="Assignments" checked={form.includeAssignments} onChange={(checked) => setForm((current) => ({ ...current, includeAssignments: checked }))} />
                <Toggle label="Image and video briefs" checked={form.includeMedia} onChange={(checked) => setForm((current) => ({ ...current, includeMedia: checked }))} />
              </div>
              <button onClick={handleGenerate} disabled={generating} className="clay-btn inline-flex items-center justify-center gap-2 px-5 py-3">
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate Blueprint'}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6">
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
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedJob?.id === job.id ? 'border-brand-500 bg-brand-500/10' : 'border-[var(--glass-border)] bg-white/50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-[var(--color-text-heading)]">{job.title}</div>
                      <div className="text-xs font-black text-brand-600">{job.status}</div>
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{job.result?.studentPreview.headline || job.prompt}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--color-text-main)]/60">
                      <span>{job.totalTokens} tokens</span>
                      <span>${Number(job.estimatedCostUsd ?? 0).toFixed(4)}</span>
                      <span>{job.course ? `Linked: ${job.course.title}` : 'Draft only'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6">
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
                <div className="rounded-2xl bg-white/60 p-4">
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
                    <div className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-medium text-[var(--color-text-main)]/80">
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

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleApply(false)} disabled={applyingMode !== null} className="clay-btn px-5 py-3">
                    {applyingMode === 'draft' ? 'Applying...' : selectedJob?.course ? 'Update Draft Course' : 'Create Draft Course'}
                  </button>
                  <button onClick={() => handleApply(true)} disabled={applyingMode !== null} className="rounded-2xl bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-700">
                    {applyingMode === 'review' ? 'Submitting...' : 'Apply And Submit For Review'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {blueprint && (
            <div className="rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6">
              <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-brand-600">Generated structure</div>
              <div className="space-y-4">
                {blueprint.modules.map((module) => (
                  <div key={module.title} className="rounded-2xl bg-white/60 p-4">
                    <div className="font-black text-[var(--color-text-heading)]">{module.title}</div>
                    <div className="mt-1 text-sm text-[var(--color-text-main)]/70">{module.description}</div>
                    <div className="mt-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={`${module.title}-${lesson.title}`} className="rounded-xl bg-[var(--glass-bg)] px-4 py-3">
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
    <label className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-white/50 px-4 py-3 text-sm font-black text-[var(--color-text-heading)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/60 p-4">
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
    <div className="rounded-2xl bg-white/60 p-4">
      <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-heading)]">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm text-[var(--color-text-main)]/70">{body}</div>
    </div>
  );
}
