'use client';

import { useParams } from 'next/navigation';
import { CourseDetailComponent } from '@/features/course/components/CourseDetail';

/**
 * 코스 상세 페이지
 * - 코스 정보 표시
 * - 과제 목록 표시
 * - 강사/학습자 권한에 따른 다양한 기능 제공
 */
export default function CourseDetailPage() {
  const { courseId } = useParams();

  if (!courseId) {
    return <div>코스 ID를 찾을 수 없습니다.</div>;
  }

  return <CourseDetailComponent courseId={courseId as string} />;
}
