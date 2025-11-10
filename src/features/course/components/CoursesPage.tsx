'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import { CourseForm } from './CourseForm';
import { CourseCard } from './CourseCard';
import { CourseStatusDialog } from './CourseStatusDialog';
import {
  useInstructorCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useUpdateCourseStatusMutation,
  useDeleteCourseMutation,
} from '../hooks/useCourseMutations';
import { CreateCourseRequest, UpdateCourseRequest, Course } from '../backend/schema';

export const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedCourseForStatus, setSelectedCourseForStatus] = useState<Course | null>(null);

  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useInstructorCoursesQuery();

  useEffect(() => {
    console.log('[CoursesPage] Rendered with courses:', { courses, isLoading: coursesLoading, error: coursesError });
  }, [courses, coursesLoading, coursesError]);
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation(editingCourse?.id || '');
  const statusMutation = useUpdateCourseStatusMutation(selectedCourseForStatus?.id || '');
  const deleteMutation = useDeleteCourseMutation();

  const handleCreateCourse = async (data: CreateCourseRequest) => {
    await createMutation.mutateAsync(data);
    setActiveTab('list');
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setActiveTab('create');
  };

  const handleUpdateCourse = async (data: UpdateCourseRequest) => {
    if (!editingCourse) return;
    await updateMutation.mutateAsync(data);
    setEditingCourse(null);
    setActiveTab('list');
  };

  const handleOpenStatusDialog = (course: Course) => {
    setSelectedCourseForStatus(course);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async (status: 'draft' | 'published' | 'archived') => {
    if (!selectedCourseForStatus) return;
    await statusMutation.mutateAsync({ status });
    setSelectedCourseForStatus(null);
    setStatusDialogOpen(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('이 코스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    await deleteMutation.mutateAsync(courseId);
  };

  const isLoading = coursesLoading || createMutation.isPending || updateMutation.isPending || statusMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">코스 관리</h1>
        <p className="mt-2 text-gray-600">
          강의할 코스를 생성하고 관리합니다
        </p>
      </div>

      {coursesError && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">오류</h3>
            <p className="text-sm text-red-800">
              {coursesError instanceof Error ? coursesError.message : '코스 목록을 불러올 수 없습니다'}
            </p>
            <details className="mt-2 text-xs text-red-700">
              <summary className="cursor-pointer underline">상세 정보</summary>
              <pre className="mt-2 max-h-48 overflow-auto bg-red-100 p-2 rounded text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(coursesError, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'create')} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="list">내 코스 ({courses.length})</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="mr-2 h-4 w-4" />
            {editingCourse ? '코스 수정' : '새 코스 생성'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 w-full">
          {coursesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">코스 목록을 불러오는 중...</span>
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">아직 코스가 없습니다</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    강의할 첫 번째 코스를 생성하세요
                  </p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    새 코스 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteCourse}
                  onStatusChange={handleOpenStatusDialog}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <CourseForm
            onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
            isLoading={isLoading}
            initialData={editingCourse || undefined}
            isEditing={!!editingCourse}
          />
          {editingCourse && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingCourse(null);
                setActiveTab('list');
              }}
              disabled={isLoading}
            >
              취소
            </Button>
          )}
        </TabsContent>
      </Tabs>

      <CourseStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        course={selectedCourseForStatus}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
      />
    </div>
  );
};
