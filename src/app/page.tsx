'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
  Building,
  ChevronRight,
  Award,
  Compass,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Check,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { CourseCard } from '@/components/CourseCard';
import { getCategories, getCourses } from '@/lib/api';
import { Category, Course } from '@/types';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeCareer, setActiveCareer] = useState('software');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Career Explorer Data
  const careerPaths = [
    {
      id: 'software',
      title: 'Full-Stack Software Developer',
      growth: '+25% projected growth (Bureau of Labor Statistics)',
      salary: '$112,000 median salary',
      description: 'Develop comprehensive client-side and server-side web applications. Focus on scalable architectures, database integrity, and modern frontend frameworks.',
      skills: ['React & Next.js', 'Node.js & Express', 'SQL & Databases', 'RESTful APIs', 'Git & CI/CD Pipelines'],
      categorySlug: 'software-engineering',
    },
    {
      id: 'ai',
      title: 'Artificial Intelligence Specialist',
      growth: '+35% growth rate (Industry average)',
      salary: '$138,000 median salary',
      description: 'Build intelligent applications, design LLM workflows, and implement retrieval-augmented generation systems. Master cognitive automation and fine-tuning.',
      skills: ['Generative AI & LLMs', 'Prompt Engineering', 'Vector Databases', 'Python & LangChain', 'Neural Architectures'],
      categorySlug: 'artificial-intelligence',
    },
    {
      id: 'cloud',
      title: 'Cloud Architecture & Devops',
      growth: '+20% projected growth',
      salary: '$120,000 median salary',
      description: 'Design robust, resilient, and fault-tolerant cloud infrastructures. Architect CI/CD automated deployments and container orchestration scripts.',
      skills: ['AWS Services', 'Docker & Kubernetes', 'Infrastructure as Code', 'Linux Scripting', 'Monitoring & Analytics'],
      categorySlug: 'cloud-infrastructure',
    },
    {
      id: 'product',
      title: 'Technical Product Manager',
      growth: '+18% growth rate',
      salary: '$118,000 median salary',
      description: 'Bridge the gap between engineering, design, and business strategy. Lead cross-functional sprint deliveries and craft data-driven product roadmaps.',
      skills: ['Agile Methodologies', 'User Story Mapping', 'Data-driven Analytics', 'LMS Workflows', 'Market Analysis'],
      categorySlug: 'product-teams',
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Full Stack Engineer at Google',
      quote: 'The structured learning paths on CourseForge helped me transition from marketing to software engineering in 9 months. The verifiable certificates gave me real credibility.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face'
    },
    {
      name: 'Marcus Chen',
      role: 'AI Product Lead at Salesforce',
      quote: 'The AI Course Builder and interactive sandboxes are next-level. I was able to learn practical LLM engineering workflows and apply them directly to my team\'s projects.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face'
    },
    {
      name: 'Elena Rostova',
      role: 'Cloud Architect at IBM',
      quote: 'CourseForge stands out because of the production-grade quality. It\'s not just code snippets—you learn full system architecture, CI/CD pipelines, and cloud security.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face'
    }
  ];

  // FAQs Data
  const faqs = [
    {
      question: 'Are these learning paths self-paced or scheduled?',
      answer: 'Our learning programs are completely flexible and self-paced. You can study on your own schedule and take as long as you need to complete assignments, quizzes, and projects.'
    },
    {
      question: 'Will I receive a certificate upon completion?',
      answer: 'Yes! Once you complete all modules, quizzes, and projects in a learning path with a passing score, you will earn a verifiable digital certificate. These certificates can be shared on LinkedIn, resumes, or portfolios.'
    },
    {
      question: 'What is the AI Course Builder and how does it work?',
      answer: 'CourseForge features an interactive AI Course Builder that generates custom course blueprints, module outlines, and interactive quizzes based on your career interests and skill level, ensuring custom-tailored knowledge paths.'
    },
    {
      question: 'Is there support available if I get stuck?',
      answer: 'Absolutely. CourseForge has an integrated Student Support system. You can open support tickets directly from your student dashboard, connect with mentors, and collaborate with a community of fellow students.'
    }
  ];

  useEffect(() => {
    Promise.all([getCourses(), getCategories()])
      .then(([nextCourses, nextCategories]) => {
        setCourses(nextCourses);
        setCategories(nextCategories);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCoursesByTab = courses.filter(course => {
    if (activeTab === 'all') return true;
    return course.categorySlug === activeTab;
  }).slice(0, 4);

  const selectedCareerInfo = careerPaths.find(c => c.id === activeCareer) || careerPaths[0];

  return (
    <Layout>
      <div className="theme-shell selection:bg-brand-500/30 selection:text-[var(--text-heading)]">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pb-16 pt-16 md:pb-24 md:pt-20">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-4 md:px-10 lg:grid-cols-12 lg:gap-16">
            
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:col-span-7 max-w-2xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-900/10 border border-brand-500/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                <Sparkles className="h-4.5 w-4.5 text-brand-500 animate-pulse" />
                World-Class AI-Powered Learning Platform
              </div>

              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-6xl lg:text-7xl md:leading-[1.1] leading-[1.15]">
                Learn without <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-blue-500 to-indigo-500">limits.</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[var(--color-text-main)]/80 md:text-lg">
                Start, switch, or advance your career with hundreds of practical courses, professional certificates, and AI-assisted learning paths designed by industry experts.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)] transition hover:bg-brand-600 active:scale-95"
                >
                  Join for Free
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-soft)] px-8 py-4 text-sm font-bold text-[var(--text-heading)] shadow-sm transition active:scale-95"
                >
                  Explore Catalog
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-main)]/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </span>
                  <span>140M+ Learners</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Award className="h-4.5 w-4.5" />
                  </span>
                  <span>Verifiable Certs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Building className="h-4.5 w-4.5" />
                  </span>
                  <span>300+ Partner Entities</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5 relative hidden lg:block"
            >
              <div className="absolute -right-6 -top-6 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="relative rounded-[2.5rem] border border-[var(--surface-border)] bg-[var(--surface-card)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
                <div className="overflow-hidden rounded-[2rem]">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000"
                    alt="Students learning together"
                    className="aspect-[4/3] w-full object-cover grayscale-[20%] transition-transform duration-700 hover:scale-105"
                  />
                </div>
                
                {/* Floating Interactive Card */}
                <div className="absolute -bottom-6 -left-6 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-strong)] px-6 py-5 shadow-2xl backdrop-blur-md max-w-xs">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-black text-sm shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
                      LMS
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)]">Real LMS Workflows</h4>
                      <p className="text-xs text-[var(--color-text-main)]/70 mt-1 leading-relaxed">
                        Curriculum building, course checkpoints, student cohorts & grading.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
          </div>
        </section>

        {/* TRUSTED BY/PARTNER LOGOS SECTION */}
        <section className="border-y border-[var(--surface-border)] bg-[var(--surface-card-soft)]/20 py-10">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-main)]/50 mb-6">
              Collaborating with leading universities and companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16 lg:gap-x-20">
              {['Google', 'IBM', 'Meta', 'Stanford University', 'Duke', 'Salesforce', 'Microsoft', 'Imperial'].map((partner) => (
                <div
                  key={partner}
                  className="text-base md:text-lg font-black tracking-tight text-[var(--color-text-main)]/40 hover:text-[var(--color-text-main)]/70 transition duration-300 select-none cursor-default"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE CAREER EXPLORER (COURSERA STYLE) */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                <Compass className="h-4 w-4" /> Career pathways explorer
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-5xl mt-4">
                Explore pathways to popular careers
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-main)]/70">
                Discover targeted learning trajectories designed to get you hired. See salaries, industry demand, and core skillsets.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Sidebar Tabs */}
              <div className="lg:col-span-4 flex flex-col justify-center space-y-2">
                {careerPaths.map((career) => (
                  <button
                    key={career.id}
                    onClick={() => setActiveCareer(career.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition duration-300 flex items-center justify-between group ${
                      activeCareer === career.id
                        ? 'bg-brand-500 text-white border-transparent shadow-[0_10px_25px_rgba(59,130,246,0.25)]'
                        : 'bg-[var(--surface-card)] border-[var(--surface-border)] text-[var(--color-text-main)]/80 hover:bg-[var(--surface-card-soft)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{career.title}</span>
                    </div>
                    <ChevronRight className={`h-4.5 w-4.5 transition duration-300 ${
                      activeCareer === career.id ? 'translate-x-1 text-white' : 'text-[var(--color-text-main)]/40 group-hover:text-[var(--text-heading)] group-hover:translate-x-0.5'
                    }`} />
                  </button>
                ))}
              </div>

              {/* Pathway details card */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCareerInfo.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[2rem] p-6 md:p-10 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="rounded-full bg-brand-500/10 border border-brand-500/20 px-3.5 py-1 text-xs font-bold text-brand-500">
                          {selectedCareerInfo.growth}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedCareerInfo.salary}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[var(--text-heading)] md:text-3xl mb-4">
                        Become a {selectedCareerInfo.title}
                      </h3>
                      <p className="text-sm md:text-base leading-relaxed text-[var(--color-text-main)]/85 mb-8">
                        {selectedCareerInfo.description}
                      </p>

                      <div className="mb-8">
                        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-heading)] mb-4">
                          Core skills you will master:
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedCareerInfo.skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-main)]"
                            >
                              <Check className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--surface-border)] pt-6 flex flex-wrap items-center justify-between gap-4 mt-auto">
                      <div className="text-xs font-semibold text-[var(--color-text-main)]/60">
                        Ready to start your journey? Explore related learning programs.
                      </div>
                      <Link
                        href={`/courses?category=${selectedCareerInfo.categorySlug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 text-xs font-bold transition shadow-md"
                      >
                        Browse Pathway Courses
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>
        </section>

        {/* CURATED COURSE CATALOG TABS */}
        <section className="py-16 bg-[var(--surface-card-soft)]/20 border-y border-[var(--surface-border)]">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                  <BookOpen className="h-4 w-4" /> Curated catalog
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-5xl mt-3">
                  Find the right course for you
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-main)]/70">
                  Browse our most popular courses by topic category. Updated weekly.
                </p>
              </div>
              
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-soft)] px-5 py-2.5 text-xs font-bold text-[var(--text-heading)] shadow-sm transition self-start"
              >
                Browse Full Catalog
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--surface-border)] pb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs font-bold rounded-full transition ${
                  activeTab === 'all'
                    ? 'bg-brand-500 text-white'
                    : 'text-[var(--color-text-main)]/70 hover:text-[var(--text-heading)] hover:bg-[var(--surface-card)]'
                }`}
              >
                All Programs
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.slug)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition ${
                    activeTab === cat.slug
                      ? 'bg-brand-500 text-white'
                      : 'text-[var(--color-text-main)]/70 hover:text-[var(--text-heading)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-96 rounded-[1.5rem] bg-[var(--surface-card-soft)]/50 border border-[var(--surface-border)] animate-pulse" />
                ))
              ) : filteredCoursesByTab.length > 0 ? (
                filteredCoursesByTab.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-sm font-semibold text-[var(--color-text-main)]/50">
                  No courses found in this category. Explore all programs to see complete listing.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* LMS ADVANTAGE FEATURES */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="theme-surface rounded-[2rem] p-8 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">AI Course Builder</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-main)]/75">
                    Generate instant course blueprints, custom syllabus modules, lessons, and tests tailored to your learning pace.
                  </p>
                </div>

                <div className="theme-surface rounded-[2rem] p-8 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">Verifiable Certificates</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-main)]/75">
                    Earn permanent digital credentials after passing course checkpoints, shareable instantly with employers on LinkedIn.
                  </p>
                </div>

                <div className="theme-surface rounded-[2rem] p-8 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">Sandbox Environments</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-main)]/75">
                    Practice coding and run tests directly in the integrated sandboxes without complex local setup.
                  </p>
                </div>

                <div className="theme-surface rounded-[2rem] p-8 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">Instructor Grading Hub</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-main)]/75">
                    Collaborate with teachers who review your code drafts, provide line-by-line feedback, and approve course completion.
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                  <Zap className="h-4 w-4" /> Next-generation LMS
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-5xl">
                  World-class tech meets structured study.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-main)]/80">
                  At CourseForge, we believe that self-paced study shouldn't feel isolated. We combine the flexibility of online lectures with interactive sandboxes, AI-assisted curriculum optimization, and genuine mentor feedback pipelines.
                </p>

                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-brand-500 shrink-0" />
                    <span className="text-sm font-semibold text-[var(--color-text-main)]/90">94% report positive career change or promotion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-brand-500 shrink-0" />
                    <span className="text-sm font-semibold text-[var(--color-text-main)]/90">Curriculum co-designed with top university professors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-brand-500 shrink-0" />
                    <span className="text-sm font-semibold text-[var(--color-text-main)]/90">Lifetime updates on all enrolled curriculum modules</span>
                  </div>
                </div>

                <div className="mt-10">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition"
                  >
                    Get Started Free
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* LEARNER TESTIMONIALS (COURSERA STYLE) */}
        <section className="py-16 md:py-24 bg-[var(--surface-card-soft)]/20 border-y border-[var(--surface-border)]">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                <MessageSquare className="h-4 w-4" /> Learner outcomes
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-5xl mt-3">
                From learning to earning
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-main)]/70">
                See how CourseForge graduates transformed their lives and advanced their careers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testi, i) => (
                <div
                  key={testi.name}
                  className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[2rem] p-8 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testi.rating }).map((_, index) => (
                        <Star key={index} className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--color-text-main)] italic mb-6">
                      "{testi.quote}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3.5 border-t border-[var(--surface-border)] pt-4">
                    <img
                      src={testi.avatar}
                      alt={testi.name}
                      className="h-10 w-10 rounded-full object-cover border border-[var(--surface-border)]"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)]">{testi.name}</h4>
                      <p className="text-xs text-[var(--color-text-main)]/65">{testi.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[960px] px-4 md:px-10">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                <HelpCircle className="h-4 w-4" /> FAQ
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)] md:text-4xl mt-3">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-[var(--surface-border)] bg-[var(--surface-card)] rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm md:text-base font-bold text-[var(--text-heading)] hover:bg-[var(--surface-card-soft)] transition duration-200"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-[var(--color-text-main)]/50 transition duration-300 ${
                      expandedFaq === index ? 'rotate-180 text-brand-500' : ''
                    }`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="p-5 pt-0 border-t border-[var(--surface-border)]/50 text-xs md:text-sm leading-relaxed text-[var(--color-text-main)]/80">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION (CTA) SECTION */}
        <section className="px-4 py-16 md:px-10 md:py-20">
          <div className="theme-cta mx-auto max-w-[1440px] rounded-[2.5rem] px-6 py-16 text-center shadow-[0_24px_90px_rgba(59,130,246,0.15)] md:px-12 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 via-indigo-600/10 to-transparent pointer-events-none" />
            <div className="mx-auto max-w-3xl relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-6xl">
                Transform your life <br />through education
              </h2>
              <p className="theme-cta-muted mx-auto mt-6 max-w-xl text-sm md:text-base leading-relaxed">
                Join our active cohort of learners and professionals building practical engineering habits. Complete checks, pay securely, and earn credentials.
              </p>
              
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100 active:scale-95"
                >
                  Start Learning Now
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15 px-8 py-4 text-sm font-bold text-white transition active:scale-95"
                >
                  View Learning Pathways
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
