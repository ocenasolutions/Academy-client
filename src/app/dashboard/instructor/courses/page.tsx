'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Star,
  Clock3,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  ArrowRight,
  GraduationCap,
  Trophy,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  PlusCircle,
  MessageSquare,
  Sparkle
} from 'lucide-react';

import { DashboardLayout } from '@/components/DashboardLayout';
import { getCourses } from '@/lib/api';
import { Course } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatINRFromRupees } from '@/lib/currency';

function formatPrice(price: number) {
  if (price === 0) return 'Free';
  return formatINRFromRupees(price);
}

const FAQS = [
  {
    question: 'How do I publish a new course?',
    answer: 'Instructors can request or build draft courses using the Admin Panel or collaborate with platform administrators to list new curriculums in the catalog.',
  },
  {
    question: 'How do I add announcements to my course?',
    answer: 'Navigate to your specific course details page from the catalog or overview, click on the Announcements tab, and publish updates that notify all enrolled students.',
  },
  {
    question: 'How do course reviews and moderation work?',
    answer: 'Students can leave reviews once they finish 100% of a course. All reviews go through a brief admin moderation queue to prevent spam before going public.',
  }
];

export default function InstructorCoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  // UI states
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<string | null>(null);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getCourses()
      .then((coursesData) => {
        setCourses(coursesData || []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Category filter
      if (selectedCategory !== 'all' && course.categorySlug !== selectedCategory && course.category.toLowerCase() !== selectedCategory) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'all' && course.level.toLowerCase() !== selectedLevel.toLowerCase()) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          (course.summary && course.summary.toLowerCase().includes(query)) ||
          course.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  return (
    <DashboardLayout role="instructor">
      <div className="space-y-10 pb-16 font-sans">
        
        {/* PREMIUM BANNER CARD */}
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--surface-border)] bg-gradient-to-br from-indigo-500/10 via-[var(--surface-card)] to-[var(--surface-card-soft)] p-8 md:p-12 shadow-2xl">
          <div className="absolute right-[-10%] top-[-30%] h-96 w-96 rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute left-[-5%] bottom-[-20%] h-80 w-80 rounded-full bg-brand-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-5 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                <Sparkle className="w-3.5 h-3.5" />
                Teaching Catalog Explorer
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-[var(--text-heading)] leading-tight tracking-tight">
                Manage and Expand Our Academic Catalog
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-[var(--color-text-main)]/80 max-w-xl">
                Explore listed courses in our platform, view curriculum outcomes, and check review ratings to see how students are responding to lessons.
              </p>

              {/* Stats Counters */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[var(--text-heading)]">{courses.length}+</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-main)]/50 font-bold">Total Courses</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[var(--text-heading)]">4.8 Average</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-main)]/50 font-bold">Rating Index</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[var(--text-heading)]">Global</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-main)]/50 font-bold">Student Reach</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium illustration or side widget */}
            <div className="w-full md:w-[320px] rounded-3xl bg-[var(--surface-card-strong)] border border-[var(--surface-border)] p-6 shadow-xl space-y-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500">
                  <Lightbulb className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-heading)]">Instructional Design Tip</h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-text-main)]/70">
                To maximize student satisfaction, ensure your lessons include hands-on quizzes. Data shows courses with quizzes have <b>35% higher</b> completion rates.
              </p>
              <div className="h-px bg-[var(--surface-border)]" />
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-main)]/80">
                <span>Instructor Role</span>
                <span className="text-indigo-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Active Lecturer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="flex flex-col gap-5 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[24px] p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-2xl px-4 py-3 focus-within:border-indigo-500 transition-all w-full">
              <Search className="h-4 w-4 text-[var(--color-text-main)]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by keyword..."
                className="w-full bg-transparent pl-3 text-sm text-[var(--text-heading)] outline-none placeholder:text-[var(--color-text-main)]/40"
              />
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-[200px] flex items-center bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-2xl px-4 py-3 focus-within:border-indigo-500 transition-all">
              <Filter className="h-4 w-4 text-[var(--color-text-main)]/40 mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--text-heading)] outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="tech">Tech (Development)</option>
                <option value="business">Business / Finance</option>
                <option value="marketing">Marketing</option>
                <option value="cloud">Cloud Engineering</option>
              </select>
            </div>

            {/* Level Dropdown */}
            <div className="w-full md:w-[180px] flex items-center bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-2xl px-4 py-3 focus-within:border-indigo-500 transition-all">
              <GraduationCap className="h-4 w-4 text-[var(--color-text-main)]/40 mr-2 shrink-0" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--text-heading)] outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* COURSES LIST SECTION */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-[24px] bg-[var(--surface-card)] border border-[var(--surface-border)] animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[24px] p-12 text-center shadow-inner">
            <BookOpen className="w-12 h-12 text-[var(--color-text-main)]/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-heading)]">No courses listed</h3>
            <p className="text-xs text-[var(--color-text-main)]/60 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any courses matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const isMine = user?.id === course.instructor?.id || course.instructor?.name === user?.name;
              const isExpanded = expandedSyllabusId === course.id;

              return (
                <div 
                  key={course.id}
                  className="group flex flex-col bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-350 hover:translate-y-[-4px]"
                >
                  {/* Course Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--surface-card-soft)] border-b border-[var(--surface-border)]">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Level Badge */}
                    <div className="absolute left-4 top-4 flex gap-2">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md ${
                        course.level.toLowerCase() === 'advanced' ? 'bg-rose-500/90 text-white' :
                        course.level.toLowerCase() === 'intermediate' ? 'bg-indigo-500/90 text-white' :
                        'bg-emerald-500/90 text-white'
                      }`}>
                        {course.level}
                      </span>
                    </div>

                    {/* Instructor Ownership Badge */}
                    {isMine && (
                      <div className="absolute right-4 top-4">
                        <span className="flex items-center gap-1 text-[9px] font-extrabold bg-indigo-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                          <CheckCircle2 className="w-3 h-3" />
                          My Lecture
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-main)]/50">
                        <span>{course.category}</span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-lg text-[var(--text-heading)] group-hover:text-indigo-500 transition-colors duration-200 line-clamp-1">
                        {course.title}
                      </h3>
                      
                      <p className="text-xs leading-relaxed text-[var(--color-text-main)]/70 line-clamp-2">
                        {course.summary || course.description}
                      </p>

                      {/* Course Metadata Stats */}
                      <div className="flex items-center justify-between pt-2 text-[11px] font-bold text-[var(--color-text-main)]/60 border-t border-[var(--surface-border)]/50">
                        <span className="flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5 text-indigo-500/70" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500/70" />
                          {course.lessons || 0} Lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-500/70" />
                          {course.students || 0} Students
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {/* Collapse/Expand Syllabus Drawer */}
                      <button
                        type="button"
                        onClick={() => setExpandedSyllabusId(isExpanded ? null : course.id)}
                        className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-[var(--surface-card-soft)] border border-[var(--surface-border)] text-[var(--color-text-main)]/70 hover:text-[var(--text-heading)] transition"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Course Syllabus</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>View Course Syllabus</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {/* syllabus content drawer */}
                      {isExpanded && (
                        <div className="bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-2xl p-4 space-y-2.5 text-xs animate-fadeIn">
                          <div className="font-extrabold text-[var(--text-heading)] border-b border-[var(--surface-border)]/50 pb-1.5">
                            Syllabus Outcomes
                          </div>
                          {course.outcomes && course.outcomes.length > 0 ? (
                            <ul className="space-y-1.5">
                              {course.outcomes.map((outcome, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[var(--color-text-main)]/80">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-[var(--color-text-main)]/50 italic">
                              No outcomes listed for this course.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Main Action buttons */}
                      <div className="flex items-center gap-3 pt-1">
                        <Link
                          href={`/courses/${course.id}`}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition shadow-md active:scale-[0.98] bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/10`}
                        >
                          <span>Review Catalog Page</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TEACHING FAQ ACCORDION SECTION */}
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[32px] p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-[var(--text-heading)]">Instructor Guidelines & FAQs</h2>
              <p className="text-xs text-[var(--color-text-main)]/60 mt-0.5">Quick guides to managing your courses on CourseForge.</p>
            </div>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="border border-[var(--surface-border)] rounded-2xl overflow-hidden transition-all bg-[var(--surface-card-soft)]/40 hover:bg-[var(--surface-card-soft)]/75"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-[var(--text-heading)] outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--color-text-main)]/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs leading-relaxed text-[var(--color-text-main)]/80 border-t border-[var(--surface-border)]/50 pt-3 bg-[var(--surface-card)]/30 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
