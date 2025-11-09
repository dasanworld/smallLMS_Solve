'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '../lib/dto';
import CourseStatusBadge from './CourseStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  UsersIcon, 
  BookOpenIcon,
  EditIcon,
  EyeIcon,
  ArchiveIcon,
  FileTextIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface CourseCardInstructorProps {
  course: Course;
  onEdit?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  onStatusChange?: (courseId: string, newStatus: 'draft' | 'published' | 'archived') => void;
}

const CourseCardInstructor: React.FC<CourseCardInstructorProps> = ({ 
  course, 
  onEdit,
  onView,
  onStatusChange
}) => {
  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    if (onStatusChange) {
      onStatusChange(course.id, newStatus);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">{course.title}</CardTitle>
          <CourseStatusBadge status={course.status} />
        </div>
        {course.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {course.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="space-y-2">
          {course.category_name && (
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              {course.category_name}
            </div>
          )}
          
          {course.difficulty_name && (
            <div className="flex items-center text-sm text-muted-foreground">
              <FileTextIcon className="h-4 w-4 mr-2" />
              {course.difficulty_name}
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {course.created_at ? format(new Date(course.created_at), 'MMM dd, yyyy') : 'N/A'}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <UsersIcon className="h-4 w-4 mr-2" />
            {course.enrollment_count} {course.enrollment_count === 1 ? 'student' : 'students'}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(course.id)}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onView?.(course.id)}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex w-full space-x-2 pt-2">
          {course.status === 'draft' && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => handleStatusChange('published')}
            >
              Publish
            </Button>
          )}
          
          {(course.status === 'draft' || course.status === 'published') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusChange('archived')}
            >
              <ArchiveIcon className="h-4 w-4" />
            </Button>
          )}
          
          {course.status === 'archived' && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1"
              onClick={() => handleStatusChange('draft')}
            >
              Reactivate
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCardInstructor;