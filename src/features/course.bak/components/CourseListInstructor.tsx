'use client';

import React from 'react';
import { Course } from '../lib/dto';
import CourseCardInstructor from './CourseCardInstructor';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  SearchIcon,
  FilterIcon,
  PlusIcon,
  BookOpenIcon,
  BarChartIcon,
  ArchiveIcon
} from 'lucide-react';

interface CourseListInstructorProps {
  courses: Course[];
  loading?: boolean;
  onCourseEdit?: (courseId: string) => void;
  onCourseView?: (courseId: string) => void;
  onCourseStatusChange?: (courseId: string, newStatus: 'draft' | 'published' | 'archived') => void;
  onAddNewCourse?: () => void;
  filters?: {
    status?: 'draft' | 'published' | 'archived';
    search?: string;
  };
  onFilterChange?: (filters: { status?: 'draft' | 'published' | 'archived'; search?: string }) => void;
}

const CourseListInstructor: React.FC<CourseListInstructorProps> = ({ 
  courses,
  loading = false,
  onCourseEdit,
  onCourseView,
  onCourseStatusChange,
  onAddNewCourse,
  filters = {},
  onFilterChange
}) => {
  const handleStatusChange = (courseId: string, newStatus: 'draft' | 'published' | 'archived') => {
    onCourseStatusChange?.(courseId, newStatus);
  };

  const handleFilterChange = (key: 'status' | 'search', value: string) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [key]: value || undefined
      });
    }
  };

  const filteredCourses = filters.status 
    ? courses.filter(course => course.status === filters.status) 
    : courses;

  const draftCourses = courses.filter(course => course.status === 'draft');
  const publishedCourses = courses.filter(course => course.status === 'published');
  const archivedCourses = courses.filter(course => course.status === 'archived');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-64">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <BookOpenIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No courses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven't created any courses. Get started by creating your first course.
        </p>
        <div className="mt-6">
          <Button onClick={onAddNewCourse}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-8 w-full sm:w-64"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={onAddNewCourse}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <BarChartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{publishedCourses.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg mr-4">
              <ArchiveIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{draftCourses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCardInstructor
            key={course.id}
            course={course}
            onEdit={onCourseEdit}
            onView={onCourseView}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No courses match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default CourseListInstructor;