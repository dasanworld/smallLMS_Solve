'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  FileText,
  Eye,
  Edit,
  Archive,
  ExternalLink
} from 'lucide-react';

export interface CourseStatusCardProps {
  course: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    enrollmentCount: number;
    assignmentCount: number;
    createdAt?: string;
  };
}

export function CourseStatusCard({ course }: CourseStatusCardProps) {
  const router = useRouter();

  const statusColors = {
    draft: 'bg-gray-500',
    published: 'bg-green-500',
    archived: 'bg-red-500',
  };

  const statusLabels = {
    draft: '초안',
    published: '공개',
    archived: '보관됨',
  };

  const handleViewCourse = () => {
    router.push(`/courses/${course.id}`);
  };

  const handleEditCourse = () => {
    router.push(`/courses/${course.id}/edit`);
  };

  const handleArchiveCourse = () => {
    // TODO: Implement archive course functionality
    console.log('Archive course:', course.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{course.title}</h3>
              <Badge variant="outline" className={`${statusColors[course.status]} text-white`}>
                {statusLabels[course.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount}명 학생</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{course.assignmentCount}개 과제</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" onClick={handleViewCourse}>
          <Eye className="h-4 w-4 mr-1" />
          보기
        </Button>
        <Button variant="outline" size="sm" onClick={handleEditCourse}>
          <Edit className="h-4 w-4 mr-1" />
          수정
        </Button>
        {course.status !== 'archived' && (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleArchiveCourse}>
            <Archive className="h-4 w-4 mr-1" />
            보관
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}