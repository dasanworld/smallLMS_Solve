'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Loader2, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { AssignmentForm } from './AssignmentForm';
import {
  useCourseAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
} from '../hooks/useAssignmentMutations';
import { CreateAssignmentRequest, UpdateAssignmentRequest, type AssignmentResponse } from '../backend/schema';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface InstructorAssignmentPageProps {
  courseId: string;
  courseName: string;
}

export const InstructorAssignmentPage = ({
  courseId,
  courseName,
}: InstructorAssignmentPageProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingAssignment, setEditingAssignment] = useState<AssignmentResponse | null>(null);

  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError } = useCourseAssignmentsQuery(courseId);
  const createMutation = useCreateAssignmentMutation(courseId);
  const updateMutation = useUpdateAssignmentMutation(courseId, editingAssignment?.id || '');
  const deleteMutation = useDeleteAssignmentMutation(courseId);

  useEffect(() => {
    console.log('[InstructorAssignmentPage] Rendered with assignments:', {
      assignments: assignmentsData,
      isLoading: assignmentsLoading,
      error: assignmentsError,
    });
  }, [assignmentsData, assignmentsLoading, assignmentsError]);

  const handleCreateAssignment = async (data: CreateAssignmentRequest) => {
    await createMutation.mutateAsync(data);
    setActiveTab('list');
  };

  const handleEditAssignment = (assignment: AssignmentResponse) => {
    setEditingAssignment(assignment);
    setActiveTab('create');
  };

  const handleUpdateAssignment = async (data: UpdateAssignmentRequest) => {
    if (!editingAssignment) return;
    await updateMutation.mutateAsync(data);
    setEditingAssignment(null);
    setActiveTab('list');
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('이 과제를 삭제하시겠습니까?')) {
      return;
    }
    await deleteMutation.mutateAsync(assignmentId);
  };

  const isLoading = assignmentsLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const assignments = assignmentsData?.assignments || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">개별 과제 관리</h1>
        <p className="mt-2 text-gray-600">
          <span className="font-semibold text-blue-600">{courseName}</span> 코스의 과제를 생성하고 관리합니다
        </p>
      </div>

      {assignmentsError && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">오류</h3>
            <p className="text-sm text-red-800">
              {assignmentsError instanceof Error ? assignmentsError.message : '과제 목록을 불러올 수 없습니다'}
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'create')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">과제 목록 ({assignments.length})</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="mr-2 h-4 w-4" />
            {editingAssignment ? '과제 수정' : '새 과제 생성'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {assignmentsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">과제 목록을 불러오는 중...</span>
              </CardContent>
            </Card>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">아직 과제가 없습니다</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    학생들을 위해 첫 번째 과제를 생성하세요
                  </p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    새 과제 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-2">{assignment.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {assignment.description}
                        </CardDescription>
                      </div>
                      <Badge className="flex-shrink-0">
                        {assignment.pointsWeight}점
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-900">마감일</p>
                        <p>{format(parseISO(assignment.dueDate), 'PPpp', { locale: ko })}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">상태</p>
                        <p className="capitalize">{assignment.status}</p>
                      </div>
                    </div>

                    {assignment.instructions && (
                      <div>
                        <p className="font-semibold text-sm text-gray-900">지시사항</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{assignment.instructions}</p>
                      </div>
                    )}

                    <div className="flex gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                        disabled={isLoading}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(
                          `/courses/${courseId}/assignments/${assignment.id}/submissions`
                        )}
                        disabled={isLoading}
                      >
                        제출물 보기
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <AssignmentForm
            courseId={courseId}
            onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
            isLoading={isLoading}
            initialData={editingAssignment || undefined}
            isEditing={!!editingAssignment}
          />
          {editingAssignment && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingAssignment(null);
                setActiveTab('list');
              }}
              disabled={isLoading}
            >
              취소
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
