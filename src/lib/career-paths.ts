import { Enrollment } from '@/types';

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  type: string;
  link: string;
}

export interface CommunityInfo {
  name: string;
  platform: 'Discord' | 'Slack' | 'Reddit' | 'Forum';
  description: string;
  url: string;
  memberCount: string;
}

export interface CareerRole {
  title: string;
  salary: string;
  difficulty: string;
}

export interface CareerTrack {
  courseId: string;
  courseTitle: string;
  keywords: string;
  roles: CareerRole[];
  communities: CommunityInfo[];
  jobs: JobRecommendation[];
}

export function buildCareerTracks(enrollments: Enrollment[]): CareerTrack[] {
  return enrollments.map((enrollment) => {
    const title = enrollment.course.title.toLowerCase();

    let keywords = '';
    let roles: CareerRole[] = [];
    let communities: CommunityInfo[] = [];
    let jobs: JobRecommendation[] = [];

    if (title.includes('docker') || title.includes('kubernetes') || title.includes('cloud') || title.includes('aws') || title.includes('devops')) {
      keywords = '"Cloud Engineer" OR "DevOps Engineer" OR "Kubernetes Specialist" OR "AWS Specialist"';
      roles = [
        { title: 'DevOps Engineer', salary: '$120,000 - $160,000', difficulty: 'Intermediate' },
        { title: 'Cloud Infrastructure Architect', salary: '$140,000 - $190,000', difficulty: 'Advanced' },
        { title: 'Site Reliability Engineer (SRE)', salary: '$130,000 - $175,000', difficulty: 'Advanced' },
        { title: 'System Administrator', salary: '$85,000 - $115,000', difficulty: 'Beginner' },
      ];
      communities = [
        { name: 'Kubernetes Slack Workspace', platform: 'Slack', description: 'The official Slack group for Kubernetes developers and operators worldwide.', url: 'https://slack.k8s.io/', memberCount: '150k+ members' },
        { name: 'Docker Forums', platform: 'Forum', description: 'Ask questions, share Dockerfiles, and troubleshoot container setups.', url: 'https://forums.docker.com/', memberCount: '80k+ members' },
        { name: 'r/devops Subreddit', platform: 'Reddit', description: 'Main Reddit hub for continuous integration, pipelines, and cloud systems.', url: 'https://www.reddit.com/r/devops/', memberCount: '420k+ members' },
        { name: 'CNCF Discord Community', platform: 'Discord', description: 'Cloud Native Computing Foundation student and developer chats.', url: 'https://discord.gg/cncf', memberCount: '25k+ members' },
      ];
      jobs = [
        { id: '1', title: 'Junior DevOps Engineer', company: 'CloudScale Solutions', location: 'Remote (US/Canada)', salary: '$95,000/yr', skills: ['Docker', 'Kubernetes', 'CI/CD'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Junior DevOps Engineer Docker')}` },
        { id: '2', title: 'Cloud Infrastructure Specialist', company: 'AlphaTech Group', location: 'San Francisco, CA', salary: '$140,000 - $160,000/yr', skills: ['AWS', 'Terraform', 'Kubernetes'], type: 'Hybrid', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Cloud Infrastructure AWS')}` },
        { id: '3', title: 'Site Reliability Engineer', company: 'FinTech Flow', location: 'London, UK', salary: '£85,000/yr', skills: ['Linux', 'Docker', 'Prometheus'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Site Reliability Engineer')}` },
      ];
    } else if (title.includes('python') || title.includes('data') || title.includes('machine') || title.includes('ml') || title.includes('ai')) {
      keywords = '"Data Scientist" OR "Machine Learning Engineer" OR "AI Developer" OR "Python Engineer"';
      roles = [
        { title: 'Data Scientist', salary: '$110,000 - $150,000', difficulty: 'Intermediate' },
        { title: 'Machine Learning Engineer', salary: '$135,000 - $180,000', difficulty: 'Advanced' },
        { title: 'Data Analyst', salary: '$70,000 - $95,000', difficulty: 'Beginner' },
        { title: 'AI Systems Programmer', salary: '$140,000 - $200,000', difficulty: 'Advanced' },
      ];
      communities = [
        { name: 'Kaggle Discussion Forums', platform: 'Forum', description: 'Join machine learning competitions, share notebooks, and discuss algorithms.', url: 'https://www.kaggle.com/discussion', memberCount: '2M+ members' },
        { name: 'Python Discord', platform: 'Discord', description: 'The largest Python community server for libraries, scripting, and code review.', url: 'https://pythondiscord.com/', memberCount: '350k+ members' },
        { name: 'r/datascience', platform: 'Reddit', description: 'Subreddit for data science professionals, career advice, and research.', url: 'https://www.reddit.com/r/datascience/', memberCount: '900k+ members' },
      ];
      jobs = [
        { id: '4', title: 'Associate Data Scientist', company: 'DataPulse Analytics', location: 'Remote (Worldwide)', salary: '$105,000/yr', skills: ['Python', 'Pandas', 'SQL'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Associate Data Scientist')}` },
        { id: '5', title: 'Machine Learning Engineer', company: 'Cortex AI Labs', location: 'New York, NY', salary: '$165,000/yr', skills: ['PyTorch', 'Python', 'MLOps'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Machine Learning Engineer PyTorch')}` },
      ];
    } else if (title.includes('react') || title.includes('javascript') || title.includes('web') || title.includes('frontend') || title.includes('node') || title.includes('fullstack')) {
      keywords = '"Frontend Engineer" OR "Full Stack Developer" OR "React Developer" OR "JavaScript Engineer"';
      roles = [
        { title: 'React Developer', salary: '$90,000 - $130,000', difficulty: 'Beginner' },
        { title: 'Full Stack Engineer (Node/React)', salary: '$110,000 - $160,000', difficulty: 'Intermediate' },
        { title: 'Frontend Team Lead', salary: '$135,000 - $175,000', difficulty: 'Advanced' },
      ];
      communities = [
        { name: 'Reactiflux Discord', platform: 'Discord', description: 'A massive community of React, React Native, Redux, and web developers.', url: 'https://www.reactiflux.com/', memberCount: '200k+ members' },
        { name: 'DEV Community', platform: 'Forum', description: 'A constructive and inclusive social network for software developers.', url: 'https://dev.to/', memberCount: '1M+ members' },
        { name: 'r/reactjs', platform: 'Reddit', description: 'Reddit hub for react news, demos, tutorials, and ecosystem updates.', url: 'https://www.reddit.com/r/reactjs/', memberCount: '380k+ members' },
      ];
      jobs = [
        { id: '6', title: 'React Frontend Developer', company: 'WebFlow Studio', location: 'Remote (US)', salary: '$110,000/yr', skills: ['React', 'Next.js', 'TailwindCSS'], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('React Frontend Developer')}` },
        { id: '7', title: 'Full Stack JavaScript Engineer', company: 'SaaSify Inc', location: 'Austin, TX', salary: '$125,000 - $145,000/yr', skills: ['Node.js', 'React', 'MongoDB'], type: 'Hybrid', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Full Stack Engineer Node')}` },
      ];
    } else {
      keywords = `"${enrollment.course.title}" OR "${enrollment.course.title} Specialist"`;
      roles = [
        { title: `${enrollment.course.title} Specialist`, salary: '$80,000 - $120,000', difficulty: 'Beginner' },
        { title: 'Lead Technical Engineer', salary: '$130,000 - $170,000', difficulty: 'Advanced' },
      ];
      communities = [
        { name: 'StackOverflow Discussion', platform: 'Forum', description: 'Find answers, discuss design architectures, and solve issues.', url: 'https://stackoverflow.com/', memberCount: '10M+ members' },
        { name: 'r/learnprogramming', platform: 'Reddit', description: 'A community for all learners to share learning resources and strategies.', url: 'https://www.reddit.com/r/learnprogramming/', memberCount: '3.5M+ members' },
      ];
      jobs = [
        { id: enrollment.id, title: 'Specialist Role', company: 'Innovate Corp', location: 'Remote', salary: '$90,000/yr', skills: [enrollment.course.title], type: 'Full-Time', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(enrollment.course.title)}` },
      ];
    }

    return {
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      keywords,
      roles,
      communities,
      jobs,
    };
  });
}
