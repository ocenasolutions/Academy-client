import {
  Category,
  CourseAnnouncement,
  Certificate,
  CommunityPost,
  Course,
  Enrollment,
  InstructorAnalytics,
  LessonDiscussionComment,
  AiCourseGenerationJob,
  PaymentRecord,
  PlatformAnalytics,
  SupportTicket,
  User,
  UserRole,
} from '@/types';
import { clearSession, readSession, writeSession } from './auth';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, '');

type Envelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export interface CheckoutResponse {
  orderId: string;
  provider: string;
  checkoutSessionUrl: string | null;
  razorpayKeyId: string | null;
  razorpayOrderId: string | null;
  currency: string;
  fallback: boolean;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

type ServerCourse = any;
type ServerEnrollment = any;
type ServerCertificate = any;

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

function formatDuration(totalSeconds: number) {
  if (!totalSeconds) {
    return 'Self-paced';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function mapLesson(lesson: any) {
  return {
    id: lesson.id,
    title: lesson.title,
    duration: formatDuration(lesson.durationSeconds ?? 0),
    durationSeconds: lesson.durationSeconds ?? 0,
    type: String(lesson.type ?? 'VIDEO').toLowerCase() as Course['modules'][number]['lessons'][number]['type'],
    isPreview: Boolean(lesson.isPreview),
    description: lesson.description || undefined,
    content: lesson.content ?? undefined,
    videoUrl: lesson.videoUrl || undefined,
  };
}

function mapCourse(serverCourse: ServerCourse): Course {
  let totalLessonCount = 0;
  const modules = (serverCourse.modules ?? []).map((module: any) => {
    const lessons = Array.isArray(module.lessons) ? module.lessons.map(mapLesson) : [];
    const moduleLessonCount = module._count?.lessons ?? lessons.length;
    totalLessonCount += moduleLessonCount;
    const moduleSeconds = lessons.reduce((sum: number, lesson: any) => sum + (lesson.durationSeconds ?? 0), 0);
    // PERF: accept sparse course payloads that only return module lesson counts.
    return {
      id: module.id,
      title: module.title,
      duration: formatDuration(moduleSeconds),
      lessons,
    };
  });

  const allLessons = modules.flatMap((module: any) => module.lessons);
  const totalSeconds = allLessons.reduce((sum: number, lesson: any) => sum + (lesson.durationSeconds ?? 0), 0);
  const outcomes = allLessons.slice(0, 4).map((lesson: any) => lesson.title);
  const instructor = serverCourse.instructor
    ? {
        id: serverCourse.instructor.id,
        name: `${serverCourse.instructor.firstName} ${serverCourse.instructor.lastName}`.trim(),
        avatar: serverCourse.instructor.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
        headline: serverCourse.instructor.headline || 'Instructor',
        bio: serverCourse.instructor.bio || undefined,
      }
    : {
        id: 'unknown',
        name: 'Unknown Instructor',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200',
        headline: 'Instructor',
      };

  const rating = Array.isArray(serverCourse.reviews) && serverCourse.reviews.length > 0
    ? serverCourse.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / serverCourse.reviews.length
    : 0;

  return {
    id: serverCourse.id,
    slug: serverCourse.slug,
    title: serverCourse.title,
    summary: serverCourse.summary,
    description: serverCourse.description || serverCourse.summary || 'Course details coming soon.',
    thumbnail: serverCourse.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    price: (serverCourse.priceCents ?? 0) / 100,
    rating,
    reviews: serverCourse._count?.reviews ?? serverCourse.reviews?.length ?? 0,
    duration: formatDuration(totalSeconds),
    level: serverCourse.level || 'All Levels',
    category: serverCourse.category?.name || 'General',
    categorySlug: serverCourse.category?.slug,
    language: serverCourse.language || 'en',
    lessons: totalLessonCount || allLessons.length,
    students: serverCourse._count?.enrollments ?? 0,
    outcomes: outcomes.length ? outcomes : [serverCourse.summary || 'Learn through a structured curriculum.'],
    modules,
    instructor,
    status: serverCourse.status,
  };
}

function mapUser(serverUser: any): User {
  const firstName = serverUser.firstName || '';
  const lastName = serverUser.lastName || '';
  return {
    id: serverUser.id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || serverUser.email,
    initials: initials(firstName, lastName),
    email: serverUser.email,
    avatar: serverUser.avatarUrl,
    role: serverUser.role,
    status: serverUser.status,
    headline: serverUser.headline,
    bio: serverUser.bio,
    pushNotificationsEnabled: serverUser.pushNotificationsEnabled,
  };
}

function mapEnrollment(serverEnrollment: ServerEnrollment): Enrollment {
  const course = mapCourse(serverEnrollment.course);
  return {
    id: serverEnrollment.id,
    course: {
      ...course,
      progressPercent: serverEnrollment.progressPercent,
    },
    progressPercent: serverEnrollment.progressPercent ?? 0,
    status: serverEnrollment.status,
    enrolledAt: serverEnrollment.enrolledAt,
    completedAt: serverEnrollment.completedAt,
  };
}

function mapCertificate(serverCertificate: ServerCertificate): Certificate {
  return {
    id: serverCertificate.id,
    certificateNo: serverCertificate.certificateNo,
    issuedAt: serverCertificate.issuedAt,
    downloadUrl: serverCertificate.downloadUrl,
    courseId: serverCertificate.courseId,
    courseTitle: serverCertificate.course?.title || 'Course',
    courseThumbnail: serverCertificate.course?.thumbnailUrl,
  };
}

function mapCommunityPost(serverPost: any): CommunityPost {
  return {
    id: serverPost.id,
    title: serverPost.title,
    body: serverPost.body,
    mediaUrl: serverPost.mediaUrl ?? null,
    likesCount: serverPost.likesCount ?? 0,
    likedByCurrentUser: Boolean(serverPost.likedByCurrentUser),
    createdAt: serverPost.createdAt,
    updatedAt: serverPost.updatedAt,
    courseId: serverPost.courseId ?? null,
    courseTitle: serverPost.courseTitle ?? serverPost.course?.title ?? 'General Discussion',
    author: {
      id: serverPost.author?.id || serverPost.authorId || '',
      firstName: serverPost.author?.firstName || 'Anonymous',
      lastName: serverPost.author?.lastName || 'User',
      username: serverPost.author?.username || null,
      role: serverPost.author?.role || 'STUDENT',
      avatarUrl: serverPost.author?.avatarUrl || null,
    },
    comments: Array.isArray(serverPost.comments)
      ? serverPost.comments.map((comment: any) => ({
          id: comment.id,
          message: comment.message,
          likesCount: comment.likesCount ?? 0,
          likedByCurrentUser: Boolean(comment.likedByCurrentUser),
          createdAt: comment.createdAt,
          author: {
            id: comment.author?.id || comment.authorId || '',
            firstName: comment.author?.firstName || 'Anonymous',
            lastName: comment.author?.lastName || 'User',
            username: comment.author?.username || null,
            role: comment.author?.role || 'STUDENT',
            avatarUrl: comment.author?.avatarUrl || null,
          },
        }))
      : [],
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function refreshAccessToken() {
  const session = readSession();
  if (!session?.refreshToken) {
    return false;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  const payload = await parseJson<Envelope<{ accessToken: string; refreshToken: string }>>(response);
  if (!payload?.data) {
    clearSession();
    return false;
  }

  writeSession({
    ...session,
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
  });

  return true;
}

async function request<T>(path: string, init: RequestInit = {}, options: { auth?: boolean; retry?: boolean } = {}) {
  const session = readSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const method = init.method ? init.method.toUpperCase() : 'GET';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !init.body) {
    init.body = JSON.stringify({});
  }

  if (options.auth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_BASE}/${path.replace(/^\//, '')}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && options.auth && options.retry !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, init, { ...options, retry: false });
    }
  }

  const payload = await parseJson<Envelope<T> & { details?: any; message?: string }>(response);
  if (!response.ok) {
    const message =
      (payload as any)?.details?.message ||
      (payload as any)?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return payload?.data as T;
}

export async function login(email: string, password: string) {
  return request<
    | { accessToken: string; refreshToken: string }
    | { requiresOtp: true; challengeId: string; expiresAt: string; email: string; debugOtp?: string }
  >('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyAdminOtp(challengeId: string, otp: string) {
  return request<{ accessToken: string; refreshToken: string }>('auth/verify-admin-otp', {
    method: 'POST',
    body: JSON.stringify({ challengeId, otp }),
  });
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: Extract<UserRole, 'STUDENT' | 'INSTRUCTOR'>;
}) {
  return request<{ accessToken: string; refreshToken: string }>('auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return request('auth/logout', { method: 'POST' }, { auth: true });
}

export async function getCurrentUser() {
  const user = await request<any>('auth/me', {}, { auth: true });
  return mapUser(user);
}

export async function getCourses(params?: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const courses = await request<any[]>(`courses${search.toString() ? `?${search}` : ''}`);
  return courses.map(mapCourse);
}

export async function getCourse(id: string) {
  const course = await request<any>(`courses/${id}`);
  return mapCourse(course);
}

export async function getCategories() {
  const categories = await request<any[]>('categories');
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    coursesCount: category._count?.courses ?? 0,
    description: category.description,
  })) as Category[];
}

export async function getMyEnrollments() {
  const enrollments = await request<any[]>('enrollments/me', {}, { auth: true });
  return enrollments.map(mapEnrollment);
}

export async function getEnrollmentByCourse(courseId: string) {
  const enrollment = await request<any>(`enrollments/course/${courseId}`, {}, { auth: true });
  return mapEnrollment(enrollment);
}

export async function updateLessonProgress(enrollmentId: string, lessonId: string, body: { isCompleted?: boolean; watchedSeconds?: number }) {
  return request(`learning/enrollments/${enrollmentId}/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getLessonActivity(enrollmentId: string, lessonId: string) {
  return request<any>(`learning/enrollments/${enrollmentId}/lessons/${lessonId}/activity`, {}, { auth: true });
}

export async function submitQuizAttempt(enrollmentId: string, lessonId: string, body: { answers: unknown[]; score?: number }) {
  return request<any>(`learning/enrollments/${enrollmentId}/lessons/${lessonId}/quiz-attempts`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function submitAssignment(enrollmentId: string, lessonId: string, body: { content?: string; submissionUrl?: string }) {
  return request<any>(`learning/enrollments/${enrollmentId}/lessons/${lessonId}/assignment-submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function addLessonDiscussionComment(enrollmentId: string, lessonId: string, message: string) {
  return request<LessonDiscussionComment>(`learning/enrollments/${enrollmentId}/lessons/${lessonId}/discussion`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }, { auth: true });
}

export async function askAiHelper(body: { message: string; questionContext: string; history?: any[] }) {
  return request<{ reply: string }>('learning/ai-helper', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function gradeAssignmentSubmission(submissionId: string, body: { score: number; feedback?: string }) {
  return request<any>(`learning/assignment-submissions/${submissionId}/grade`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getMyCertificates() {
  const certificates = await request<any[]>('certificates/me', {}, { auth: true });
  return certificates.map(mapCertificate);
}

export async function getCommunityPosts(courseId?: string) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  const posts = await request<any[]>(`community/posts${query}`, {}, { auth: true });
  return posts.map(mapCommunityPost);
}

export async function toggleCommunityPostLike(postId: string) {
  return request<{ id: string; likesCount: number }>(`community/posts/${postId}/like`, {
    method: 'POST',
  }, { auth: true });
}

export async function addCommunityPostComment(postId: string, message: string) {
  return request<any>(`community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }, { auth: true });
}

export async function createCommunityPost(title: string, body: string, courseId?: string, mediaUrl?: string) {
  const post = await request<any>(`community/posts`, {
    method: 'POST',
    body: JSON.stringify({ title, body, courseId, mediaUrl }),
  }, { auth: true });
  return mapCommunityPost(post);
}

export async function toggleCommunityCommentLike(commentId: string) {
  return request<{ id: string; likesCount: number }>(`community/comments/${commentId}/like`, {
    method: 'POST',
  }, { auth: true });
}

export async function getInstructorAnalytics() {
  const analytics = await request<any>('analytics/instructor', {}, { auth: true });
  return {
    ...analytics,
    courses: analytics.courses.map(mapCourse),
  } as InstructorAnalytics;
}

export async function getPlatformAnalytics() {
  return request<PlatformAnalytics>('analytics/platform', {}, { auth: true });
}

export async function getUsers(role?: UserRole) {
  const users = await request<any[]>(`users${role ? `?role=${role}` : ''}`, {}, { auth: true });
  return users.map(mapUser);
}

export async function updateUser(id: string, body: Partial<Pick<User, 'firstName' | 'lastName' | 'headline' | 'bio' | 'avatar' | 'pushNotificationsEnabled'> & { password?: string }>) {
  const user = await request<any>(`users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      firstName: body.firstName,
      lastName: body.lastName,
      headline: body.headline,
      bio: body.bio,
      avatarUrl: body.avatar,
      password: body.password,
      pushNotificationsEnabled: body.pushNotificationsEnabled,
    }),
  }, { auth: true });
  return mapUser(user);
}

export async function getMyNotifications() {
  return request<{ notifications: any[]; announcements: CourseAnnouncement[] }>('users/me/notifications', {}, { auth: true });
}

export async function getMySupportTickets() {
  return request<SupportTicket[]>('users/me/tickets', {}, { auth: true });
}

export async function createSupportTicket(body: { subject: string; description: string; category: string }) {
  return request<SupportTicket>('users/me/tickets', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function createCheckout(courseIds: string[], couponCode?: string) {
  return request<CheckoutResponse>('payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ courseIds, couponCode }),
  }, { auth: true });
}

export async function completeOrder(orderId: string) {
  return request<{ success: boolean }>(`payments/orders/${orderId}/complete`, {
    method: 'POST',
  }, { auth: true });
}

export async function verifyRazorpayPayment(
  orderId: string,
  body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) {
  return request<{ success: boolean }>(`payments/orders/${orderId}/razorpay/verify`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getMyPayments() {
  return request<PaymentRecord[]>('payments/me', {}, { auth: true });
}

export async function getReviewQueue() {
  return request<any[]>('admin/review-queue', {}, { auth: true });
}

export async function getPendingInstructors() {
  return request<any[]>('admin/pending-instructors', {}, { auth: true });
}

export async function getEnrollmentDetails(courseId: string) {
  const enrollment = await request<any>(`enrollments/course/${courseId}`, {}, { auth: true });
  return {
    id: enrollment.id,
    progressPercent: enrollment.progressPercent ?? 0,
    status: enrollment.status,
    lessonProgress: enrollment.lessonProgress ?? [],
    course: mapCourse(enrollment.course),
  };
}

export async function getCourseAnnouncements(courseId: string) {
  return request<CourseAnnouncement[]>(`courses/${courseId}/announcements`);
}

export async function createCourseAnnouncement(courseId: string, body: { title: string; body: string }) {
  return request<CourseAnnouncement>(`courses/${courseId}/announcements`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function createCourseReview(courseId: string, body: { rating: number; comment?: string }) {
  return request<any>(`courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getInstructorWorkspace() {
  return request<any[]>('courses/instructor/me/workspace', {}, { auth: true });
}

export async function updateCourseCurriculum(courseId: string, body: { modules: unknown[] }) {
  return request<any>(`courses/${courseId}/curriculum`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function updateCourse(id: string, body: Record<string, unknown>) {
  // PERF: send full course basics edits through the general course update route instead of the narrow admin moderation endpoint.
  return request<any>(`courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function updateCourseStatus(id: string, status: string) {
  // PERF: keep status changes on the dedicated route so the editor does not overload the admin moderation patch shape.
  return request<any>(`courses/${id}/status/${encodeURIComponent(status)}`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function generateAiCourseDraft(body: Record<string, unknown>) {
  return request<AiCourseGenerationJob>('ai-course-builder/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getMyAiCourseGenerationJobs() {
  return request<AiCourseGenerationJob[]>('ai-course-builder/jobs', {}, { auth: true });
}

export async function applyAiCourseGenerationJob(id: string, body?: { submitForReview?: boolean }) {
  return request<any>(`ai-course-builder/jobs/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  }, { auth: true });
}

export async function getAdminUsers(params?: { role?: UserRole; status?: string }) {
  const search = new URLSearchParams();
  if (params?.role) search.set('role', params.role);
  if (params?.status) search.set('status', params.status);
  return request<any[]>(`admin/users${search.toString() ? `?${search}` : ''}`, {}, { auth: true });
}

export async function getAdminUserDetail(id: string) {
  return request<any>(`admin/users/${id}`, {}, { auth: true });
}

export async function updateAdminUser(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function resetAdminUserPassword(id: string) {
  return request<{ success: boolean; temporaryPassword: string }>(`admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function getAdminInstructors(status?: string) {
  return request<any[]>(`admin/instructors${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, { auth: true });
}

export async function approveInstructor(id: string) {
  return request<any>(`admin/instructors/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function rejectInstructor(id: string) {
  return request<any>(`admin/instructors/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function suspendInstructor(id: string) {
  return request<any>(`admin/instructors/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function verifyInstructorDocuments(id: string, note?: string) {
  return request<any>(`admin/instructors/${id}/verify-documents`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }, { auth: true });
}

export async function getAdminCourses(params?: { status?: string; featured?: boolean }) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (typeof params?.featured === 'boolean') search.set('featured', String(params.featured));
  return request<any[]>(`admin/courses${search.toString() ? `?${search}` : ''}`, {}, { auth: true });
}

export async function getAdminCourseDetail(id: string) {
  return request<any>(`admin/courses/${id}`, {}, { auth: true });
}

export async function updateAdminCourse(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function approveCourse(id: string) {
  return request<any>(`admin/courses/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function rejectCourse(id: string, note?: string) {
  return request<any>(`admin/courses/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }, { auth: true });
}

export async function getAdminCategories() {
  return request<any[]>('admin/categories', {}, { auth: true });
}

export async function createAdminCategory(body: Record<string, unknown>) {
  return request<any>('admin/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function updateAdminCategory(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function deleteAdminCategory(id: string) {
  return request<any>(`admin/categories/${id}`, {
    method: 'DELETE',
  }, { auth: true });
}

export async function getAdminEnrollments(status?: string) {
  return request<any[]>(`admin/enrollments${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, { auth: true });
}

export async function createAdminEnrollment(body: { userId: string; courseId: string }) {
  return request<any>('admin/enrollments', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function completeAdminEnrollment(id: string) {
  return request<any>(`admin/enrollments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function deleteAdminEnrollment(id: string) {
  return request<any>(`admin/enrollments/${id}`, {
    method: 'DELETE',
  }, { auth: true });
}

export async function getAdminPayments(status?: string, provider?: string) {
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (provider) search.set('provider', provider);
  return request<any[]>(`admin/payments${search.toString() ? `?${search}` : ''}`, {}, { auth: true });
}

export async function refundAdminPayment(id: string) {
  return request<any>(`admin/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function getAdminPayouts(status?: string) {
  return request<any[]>(`admin/payouts${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, { auth: true });
}

export async function approveAdminPayout(id: string) {
  return request<any>(`admin/payouts/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function markAdminPayoutPaid(id: string) {
  return request<any>(`admin/payouts/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function getAdminCoupons() {
  return request<any[]>('admin/coupons', {}, { auth: true });
}

export async function createAdminCoupon(body: Record<string, unknown>) {
  return request<any>('admin/coupons', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function updateAdminCoupon(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getAdminReviews() {
  return request<any[]>('admin/reviews', {}, { auth: true });
}

export async function updateAdminReview(id: string, body: { status: string }) {
  return request<any>(`admin/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getAdminCertificates() {
  return request<any[]>('admin/certificates', {}, { auth: true });
}

export async function verifyAdminCertificate(certificateNo: string) {
  return request<any>(`admin/certificates/verify?certificateNo=${encodeURIComponent(certificateNo)}`, {}, { auth: true });
}

export async function revokeAdminCertificate(id: string) {
  return request<any>(`admin/certificates/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function getAdminAiGenerations() {
  return request<any[]>('admin/ai-generations', {}, { auth: true });
}

export async function retryAdminAiGeneration(id: string) {
  return request<any>(`admin/ai-generations/${id}/retry`, {
    method: 'POST',
    body: JSON.stringify({}),
  }, { auth: true });
}

export async function getAdminReports(status?: string) {
  return request<any[]>(`admin/reports${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, { auth: true });
}

export async function updateAdminReport(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function enforceAdminReportAction(id: string, body: { action: string; resolutionNote?: string }) {
  return request<any>(`admin/reports/${id}/enforce`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getAdminTickets(status?: string) {
  return request<any[]>(`admin/tickets${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, { auth: true });
}

export async function updateAdminTicket(id: string, body: Record<string, unknown>) {
  return request<any>(`admin/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getAdminNotifications() {
  return request<any[]>('admin/notifications', {}, { auth: true });
}

export async function createAdminNotification(body: Record<string, unknown>) {
  return request<any>('admin/notifications', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { auth: true });
}

export async function getAdminSettings() {
  return request<any[]>('admin/settings', {}, { auth: true });
}

export async function updateAdminSetting(key: string, value: unknown) {
  return request<any>(`admin/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  }, { auth: true });
}

export async function getAdminAuditLogs() {
  return request<any[]>('admin/audit-logs', {}, { auth: true });
}
