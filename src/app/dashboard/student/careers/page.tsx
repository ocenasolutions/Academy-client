'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, Search, ArrowUpRight, GraduationCap, Compass, ExternalLink, Globe, Sparkles, MessageSquare, BookOpen, Clock, Heart } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getMyEnrollments } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Enrollment } from '@/types';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  type: string;
  link: string;
}

interface CommunityInfo {
  name: string;
  platform: 'Discord' | 'Slack' | 'Reddit' | 'Forum';
  description: string;
  url: string;
  memberCount: string;
}

interface CareerTrack {
  courseId: string;
  courseTitle: string;
  keywords: string;
  roles: { title: string; salary: string; difficulty: string }[];
  communities: CommunityInfo[];
  jobs: JobRecommendation[];
}

export default function StudentCareers() {
  const { addToast } = useToast();
  const { loading: authLoading } = useProtectedPage(['STUDENT']);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    getMyEnrollments()
      .then((nextEnrollments) => {
        setEnrollments(nextEnrollments);
        if (nextEnrollments.length > 0) {
          // Default to the first course or 'all'
          setSelectedCourseId('all');
        }
      })
      .catch((err) => {
        addToast(err instanceof Error ? err.message : 'Failed to fetch enrollments', 'error');
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  // Generate dynamic job tracks, communities, and linkedin searches based on the student's courses
  const careerTracks = useMemo<CareerTrack[]>(() => {
    return enrollments.map((enrollment) => {
      const title = enrollment.course.title.toLowerCase();
      
      let keywords = '';
      let roles: { title: string; salary: string; difficulty: string }[] = [];
      let communities: CommunityInfo[] = [];
      let jobs: JobRecommendation[] = [];

      if (title.includes('docker') || title.includes('kubernetes') || title.includes('cloud') || title.includes('aws') || title.includes('devops')) {
        keywords = `"Cloud Engineer" OR "DevOps Engineer" OR "Kubernetes Specialist" OR "AWS Specialist"`;
        roles = [
          { title: 'DevOps Engineer', salary: '$120,000 - $160,000', difficulty: 'Intermediate' },
          { title: 'Cloud Infrastructure Architect', salary: '$140,000 - $190,000', difficulty: 'Advanced' },
          { title: 'Site Reliability Engineer (SRE)', salary: '$130,000 - $175,000', difficulty: 'Advanced' },
          { title: 'System Administrator', salary: '$85,000 - $115,000', difficulty: 'Beginner' }
        ];
        communities = [
          { name: 'Kubernetes Slack Workspace', platform: 'Slack', description: 'The official Slack group for Kubernetes developers and operators worldwide.', url: 'https://slack.k8s.io/', memberCount: '150k+ members' },
          { name: 'Docker Forums', platform: 'Forum', description: 'Ask questions, share Dockerfiles, and troubleshoot container setups.', url: 'https://forums.docker.com/', memberCount: '80k+ members' },
          { name: 'r/devops Subreddit', platform: 'Reddit', description: 'Main Reddit hub for continuous integration, pipelines, and cloud systems.', url: 'https://www.reddit.com/r/devops/', memberCount: '420k+ members' },
          { name: 'CNCF Discord Community', platform: 'Discord', description: 'Cloud Native Computing Foundation student and developer chats.', url: 'https://discord.gg/cncf', memberCount: '25k+ members' }
        ];
        jobs = [
          { id: '1', title: 'Junior DevOps Engineer', company: 'CloudScale Solutions', location: 'Remote (US/Canada)', salary: '$95,000/yr', skills: ['Docker', 'Kubernetes', 'CI/CD'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Junior DevOps Engineer Docker')}` },
          { id: '2', title: 'Cloud Infrastructure Specialist', company: 'AlphaTech Group', location: 'San Francisco, CA', salary: '$140,000 - $160,000/yr', skills: ['AWS', 'Terraform', 'Kubernetes'], type: 'Hybrid', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Cloud Infrastructure AWS')}` },
          { id: '3', title: 'Site Reliability Engineer', company: 'FinTech Flow', location: 'London, UK', salary: '£85,000/yr', skills: ['Linux', 'Docker', 'Prometheus'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Site Reliability Engineer')}` }
        ];
      } else if (title.includes('python') || title.includes('data') || title.includes('machine') || title.includes('ml') || title.includes('ai')) {
        keywords = `"Data Scientist" OR "Machine Learning Engineer" OR "AI Developer" OR "Python Engineer"`;
        roles = [
          { title: 'Data Scientist', salary: '$110,000 - $150,000', difficulty: 'Intermediate' },
          { title: 'Machine Learning Engineer', salary: '$135,000 - $180,000', difficulty: 'Advanced' },
          { title: 'Data Analyst', salary: '$70,000 - $95,000', difficulty: 'Beginner' },
          { title: 'AI Systems Programmer', salary: '$140,000 - $200,000', difficulty: 'Advanced' }
        ];
        communities = [
          { name: 'Kaggle Discussion Forums', platform: 'Forum', description: 'Join machine learning competitions, share notebooks, and discuss algorithms.', url: 'https://www.kaggle.com/discussion', memberCount: '2M+ members' },
          { name: 'Python Discord', platform: 'Discord', description: 'The largest Python community server for libraries, scripting, and code review.', url: 'https://pythondiscord.com/', memberCount: '350k+ members' },
          { name: 'r/datascience', platform: 'Reddit', description: 'Subreddit for data science professionals, career advice, and research.', url: 'https://www.reddit.com/r/datascience/', memberCount: '900k+ members' }
        ];
        jobs = [
          { id: '4', title: 'Associate Data Scientist', company: 'DataPulse Analytics', location: 'Remote (Worldwide)', salary: '$105,000/yr', skills: ['Python', 'Pandas', 'SQL'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Associate Data Scientist')}` },
          { id: '5', title: 'Machine Learning Engineer', company: 'Cortex AI Labs', location: 'New York, NY', salary: '$165,000/yr', skills: ['PyTorch', 'Python', 'MLOps'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Machine Learning Engineer PyTorch')}` }
        ];
      } else if (title.includes('react') || title.includes('javascript') || title.includes('web') || title.includes('frontend') || title.includes('node') || title.includes('fullstack')) {
        keywords = `"Frontend Engineer" OR "Full Stack Developer" OR "React Developer" OR "JavaScript Engineer"`;
        roles = [
          { title: 'React Developer', salary: '$90,000 - $130,000', difficulty: 'Beginner' },
          { title: 'Full Stack Engineer (Node/React)', salary: '$110,000 - $160,000', difficulty: 'Intermediate' },
          { title: 'Frontend Team Lead', salary: '$135,000 - $175,000', difficulty: 'Advanced' }
        ];
        communities = [
          { name: 'Reactiflux Discord', platform: 'Discord', description: 'A massive community of React, React Native, Redux, and web developers.', url: 'https://www.reactiflux.com/', memberCount: '200k+ members' },
          { name: 'DEV Community', platform: 'Forum', description: 'A constructive and inclusive social network for software developers.', url: 'https://dev.to/', memberCount: '1M+ members' },
          { name: 'r/reactjs', platform: 'Reddit', description: 'Reddit hub for react news, demos, tutorials, and ecosystem updates.', url: 'https://www.reddit.com/r/reactjs/', memberCount: '380k+ members' }
        ];
        jobs = [
          { id: '6', title: 'React Frontend Developer', company: 'WebFlow Studio', location: 'Remote (US)', salary: '$110,000/yr', skills: ['React', 'Next.js', 'TailwindCSS'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('React Frontend Developer')}` },
          { id: '7', title: 'Full Stack JavaScript Engineer', company: 'SaaSify Inc', location: 'Austin, TX', salary: '$125,000 - $145,000/yr', skills: ['Node.js', 'React', 'MongoDB'], type: 'Hybrid', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Full Stack Engineer Node')}` }
        ];
      } else {
        // Fallback career track
        keywords = `"${enrollment.course.title}" OR "${enrollment.course.title} Specialist"`;
        roles = [
          { title: `${enrollment.course.title} Specialist`, salary: '$80,000 - $120,000', difficulty: 'Beginner' },
          { title: `Lead Technical Engineer`, salary: '$130,000 - $170,000', difficulty: 'Advanced' }
        ];
        communities = [
          { name: 'StackOverflow Discussion', platform: 'Forum', description: 'Find answers, discuss design architectures, and solve issues.', url: 'https://stackoverflow.com/', memberCount: '10M+ members' },
          { name: 'r/learnprogramming', platform: 'Reddit', description: 'A community for all learners to share learning resources and strategies.', url: 'https://www.reddit.com/r/learnprogramming/', memberCount: '3.5M+ members' }
        ];
        jobs = [
          { id: enrollment.id, title: `Specialist Role`, company: 'Innovate Corp', location: 'Remote', salary: '$90,000/yr', skills: [enrollment.course.title], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(enrollment.course.title)}` }
        ];
      }

      return {
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        keywords,
        roles,
        communities,
        jobs
      };
    });
  }, [enrollments]);

  // Compile all recommended roles, jobs, communities based on filter
  const activeTrack = useMemo(() => {
    if (selectedCourseId === 'all') {
      return {
        courseTitle: 'All Enrolled Paths',
        keywords: careerTracks.map(t => t.keywords).join(' OR '),
        roles: careerTracks.flatMap(t => t.roles).filter((v, i, a) => a.findIndex(t2 => t2.title === v.title) === i),
        communities: careerTracks.flatMap(t => t.communities).filter((v, i, a) => a.findIndex(t2 => t2.name === v.name) === i),
        jobs: careerTracks.flatMap(t => t.jobs).filter((v, i, a) => a.findIndex(t2 => t2.id === v.id) === i)
      };
    }
    return careerTracks.find(t => t.courseId === selectedCourseId) || null;
  }, [careerTracks, selectedCourseId]);

  // Further filter job listings based on text search
  const filteredJobs = useMemo(() => {
    if (!activeTrack) return [];
    if (!searchTerm.trim()) return activeTrack.jobs;
    const term = searchTerm.toLowerCase();
    return activeTrack.jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.skills.some((s) => s.toLowerCase().includes(term))
    );
  }, [activeTrack, searchTerm]);

  if (loading || authLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-500 font-medium">Analyzing career paths and job postings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If student is not enrolled in any courses
  if (enrollments.length === 0) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-10">
          <section className="text-center py-16 bg-white border border-slate-200 rounded-[32px] px-6 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Placements & Job Portals</h1>
            <p className="mt-3 text-slate-600 max-w-lg mx-auto leading-relaxed">
              Unlock direct career opportunities, LinkedIn job postings, and technical communities. Complete or start a course to get customized recommendations!
            </p>
            <div className="mt-8">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:bg-indigo-700 transition"
              >
                Explore Course Catalog
              </Link>
            </div>
          </section>

          {/* Fallback Tracks */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-indigo-600" />
              Explore High-Demand Tech Tracks
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TrackOverviewCard 
                title="Cloud & DevOps Engineer" 
                salary="$115,000 - $160,000" 
                skills={['Docker', 'Kubernetes', 'AWS', 'Linux']} 
                bgGradient="from-blue-500/10 to-indigo-500/10 border-blue-100" 
                tagColor="bg-blue-50 text-blue-700"
                keywords="DevOps Cloud Engineer Docker Kubernetes"
              />
              <TrackOverviewCard 
                title="Data Scientist / AI Engineer" 
                salary="$120,000 - $185,000" 
                skills={['Python', 'Machine Learning', 'PyTorch', 'SQL']} 
                bgGradient="from-amber-500/10 to-orange-500/10 border-amber-100"
                tagColor="bg-amber-50 text-amber-700"
                keywords="Data Scientist Machine Learning Python PyTorch"
              />
              <TrackOverviewCard 
                title="Full-Stack Web Architect" 
                salary="$95,000 - $150,000" 
                skills={['React', 'Node.js', 'Next.js', 'PostgreSQL']} 
                bgGradient="from-purple-500/10 to-pink-500/10 border-purple-100"
                tagColor="bg-purple-50 text-purple-700"
                keywords="React Frontend Full Stack Node Developer"
              />
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        {/* Page Header */}
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" /> Career Integration Hub
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-[2.6rem]">
                Placements & Communities
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                Use your CourseForge skillsets to directly look up jobs on LinkedIn, get job recommendations, and join popular communities built around your courses.
              </p>
            </div>

            {/* LinkedIn Redirect Button */}
            {activeTrack && (
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(activeTrack.keywords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(79,70,229,0.25)] hover:bg-indigo-700 transition-all hover:scale-[1.02] shrink-0"
              >
                <Briefcase className="w-4 h-4" />
                Find All LinkedIn Jobs
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* Filter Course Selector */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Compass className="w-4 h-4 text-indigo-500" />
            Filter by Course Focus:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCourseId('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                selectedCourseId === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              All Paths ({enrollments.length})
            </button>
            {enrollments.map((enr) => (
              <button
                key={enr.course.id}
                onClick={() => setSelectedCourseId(enr.course.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all border flex items-center gap-2 ${
                  selectedCourseId === enr.course.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${enr.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {enr.course.title}
              </button>
            ))}
          </div>
        </section>

        {/* Main Content Layout */}
        {activeTrack && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Jobs Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Recommended Job Openings
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Simulated openings tailored to your active courses. Click to search on LinkedIn.</p>
                </div>

                {/* Job Search Input */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search company or skill..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
                    No matching jobs found in this track. Try filtering by another course.
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase">
                            {job.type}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2.5 flex-wrap">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span className="text-emerald-600">{job.salary}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                      >
                        Apply on LinkedIn
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Careers Track Details */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-indigo-600">
                  Popular Career Roles
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeTrack.roles.map((role, idx) => (
                    <div key={idx} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-1">
                      <div className="font-bold text-slate-800 text-sm">{role.title}</div>
                      <div className="text-xs text-emerald-600 font-semibold">{role.salary} average</div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Focus Level: {role.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Communities & Placements Sidebar Panel */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Technical Communities
                </h2>
                <p className="text-xs text-slate-500 mt-1">Connect with industry peers, ask questions, and build your network.</p>
              </div>

              <div className="space-y-4">
                {activeTrack.communities.map((comm, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        comm.platform === 'Discord' ? 'bg-indigo-100 text-indigo-700' :
                        comm.platform === 'Slack' ? 'bg-amber-100 text-amber-700' :
                        comm.platform === 'Reddit' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {comm.platform}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{comm.memberCount}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{comm.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{comm.description}</p>
                    </div>
                    <a
                      href={comm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
                    >
                      Join Community
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                ))}
              </div>

              {/* LinkedIn Search helper card */}
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Need a custom search?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Search LinkedIn for specialized titles using our recommended search query keyword syntax:
                  </p>
                </div>
                <div className="bg-black/40 rounded-xl p-3 font-mono text-[10px] text-indigo-300 break-all select-all leading-normal">
                  {activeTrack.keywords}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  💡 Tip: Copy the text block above and paste it directly into the LinkedIn Jobs search input to find targeted matches!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function TrackOverviewCard({ title, salary, skills, bgGradient, tagColor, keywords }: {
  title: string;
  salary: string;
  skills: string[];
  bgGradient: string;
  tagColor: string;
  keywords: string;
}) {
  return (
    <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all`}>
      <div className="space-y-3">
        <div className={`h-2 w-12 rounded-full ${tagColor.split(' ')[0]}`} />
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">Average Starting: <span className="text-emerald-600 font-semibold">{salary}</span></p>
        </div>
        <div className="flex flex-wrap gap-1">
          {skills.map(skill => (
            <span key={skill} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <a
        href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
      >
        Search Jobs
        <ExternalLink className="w-3 h-3 text-slate-400" />
      </a>
    </div>
  );
}
