export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  bio?: string;
  courses?: number;
  students?: number;
  rating?: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'live';
  isPreview: boolean;
  durationSeconds?: number;
  description?: string;
  content?: unknown;
}

export interface LessonDiscussionComment {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export interface CommunityPostComment {
  id: string;
  message: string;
  likesCount: number;
  likedByCurrentUser?: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string | null;
    role: UserRole;
    avatarUrl?: string | null;
  };
}

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  mediaUrl?: string | null;
  likesCount: number;
  likedByCurrentUser?: boolean;
  createdAt: string;
  updatedAt: string;
  courseId?: string | null;
  courseTitle: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string | null;
    role: UserRole;
    avatarUrl?: string | null;
  };
  comments: CommunityPostComment[];
}

export interface CourseAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaymentRecord {
  id: string;
  status: string;
  provider: string;
  amountCents: number;
  paidAt?: string | null;
  createdAt: string;
  order: {
    id: string;
    items: Array<{
      id: string;
      course: {
        id: string;
        title: string;
        thumbnailUrl?: string | null;
      };
    }>;
  };
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    message: string;
    createdAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }>;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  description: string;
  thumbnail: string;
  price: number;
  rating: number;
  reviews: number;
  duration: string;
  level: string;
  category: string;
  categorySlug?: string;
  language?: string;
  lessons: number;
  students: number;
  outcomes: string[];
  modules: Module[];
  instructor: Instructor;
  status?: string;
  progressPercent?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  initials: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: string;
  headline?: string;
  bio?: string;
  pushNotificationsEnabled?: boolean;
}

export interface Enrollment {
  id: string;
  course: Course;
  progressPercent: number;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  coursesCount: number;
  description?: string;
}

export interface Certificate {
  id: string;
  certificateNo: string;
  issuedAt: string;
  downloadUrl?: string | null;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
}

export interface InstructorAnalytics {
  courses: Course[];
  averageProgressPercent: number;
  totalStudents: number;
  publishedCourses: number;
}

export interface PlatformAnalytics {
  users: number;
  courses: number;
  enrollments: number;
  revenueCents: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  totalRevenueCents: number;
  pendingInstructorApprovals: number;
  pendingCourseApprovals: number;
  aiCourseGenerationsToday: number;
  recentUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: string;
    createdAt: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    enrolledAt: string;
    progressPercent: number;
    status: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    course: {
      id: string;
      title: string;
    };
  }>;
  recentPayments: Array<{
    id: string;
    amountCents: number;
    status: string;
    provider: string;
    paidAt?: string | null;
    createdAt: string;
    order?: {
      id: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      items: Array<{
        id: string;
        course: {
          id: string;
          title: string;
        };
      }>;
    } | null;
  }>;
  growthSeries: Array<{
    label: string;
    users: number;
    enrollments: number;
    revenueCents: number;
  }>;
  usersByRole: {
    students: number;
    instructors: number;
    admins: number;
  };
}

export interface AiCourseQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface AiCourseLessonPlan {
  title: string;
  description: string;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE';
  durationSeconds: number;
  isPreview: boolean;
  content?: {
    overview?: string;
    objectives?: string[];
    estimatedMinutes?: number;
    body?: string[];
    studentTakeaway?: string;
    mediaPlan?: {
      imagePrompt?: string;
      videoPrompt?: string;
      storyboard?: string[];
    } | null;
  };
  quiz?: {
    title: string;
    description: string;
    passingScore: number;
    questions: AiCourseQuizQuestion[];
  };
  assignment?: {
    title: string;
    description: string;
    rubric: string[];
    deliverables: string[];
  };
}

export interface AiCourseModulePlan {
  title: string;
  description: string;
  estimatedMinutes: number;
  lessons: AiCourseLessonPlan[];
}

export interface AiCourseBlueprint {
  provider: string;
  title: string;
  summary: string;
  description: string;
  context?: string;
  targetAudience: string;
  difficulty: string;
  language: string;
  estimatedHours: number;
  priceCents: number;
  learningObjectives: string[];
  industryFocus?: string;
  teachingStyle?: string;
  reviewRequired: boolean;
  outcomes: string[];
  approvalChecklist: string[];
  openSourceStack: {
    textPlanning: string;
    imageGeneration: string;
    videoGeneration: string;
  };
  studentPreview: {
    headline: string;
    durationLabel: string;
    moduleCount: number;
    lessonCount: number;
    quizCount: number;
    assignmentCount: number;
    visibilityNote: string;
  };
  assets: {
    heroImage: {
      prompt: string;
      dataUrl: string;
      alt: string;
    };
    moduleVisuals?: Array<{
      title: string;
      prompt: string;
      dataUrl: string;
      alt: string;
    }>;
    trailerStoryboard: {
      prompt: string;
      scenes: string[];
      narration: string[];
      recommendedOpenSourceTools: string[];
    };
  };
  modules: AiCourseModulePlan[];
}

export interface AiCourseGenerationJob {
  id: string;
  title: string;
  prompt: string;
  targetAudience?: string;
  difficulty?: string;
  estimatedHours?: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  qualityScore?: number | null;
  abuseFlagged: boolean;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    status?: string;
  } | null;
  result?: AiCourseBlueprint | null;
}
