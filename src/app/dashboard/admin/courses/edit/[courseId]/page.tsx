'use client';

import { useParams } from 'next/navigation';
import { CourseEditor } from '@/components/CourseEditor';
import { useProtectedPage } from '@/lib/use-protected-page';

export default function AdminCourseEditPage() {
  useProtectedPage(['ADMIN']);
  const params = useParams<{ courseId: string }>();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;

  if (!courseId) {
    return null;
  }

  return <CourseEditor courseId={courseId} />;
}
