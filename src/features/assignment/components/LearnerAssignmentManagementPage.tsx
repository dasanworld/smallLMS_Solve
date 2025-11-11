'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLearnerAssignmentsQuery, AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import {
  getAssignmentGroupStatus,
  AssignmentGroupStatus,
  getGroupLabel,
} from '../lib/assignment-helper';
import AssignmentFilterBar from './AssignmentFilterBar';
import AssignmentList from './AssignmentList';
import AssignmentDetailModal from './AssignmentDetailModal';

export default function LearnerAssignmentManagementPage() {
  const { data, isLoading, error } = useLearnerAssignmentsQuery();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<AssignmentGroupStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // 모든 코스 목록 추출
  const courses = useMemo(() => {
    if (!data?.assignments) return [];
    const courseSet = new Map<string, string>();
    data.assignments.forEach((a) => {
      if (a.course) {
        courseSet.set(a.course.id, a.course.title);
      }
    });
    return Array.from(courseSet.entries()).map(([id, title]) => ({ id, title }));
  }, [data?.assignments]);

  // 필터링된 과제들
  const filteredAssignments = useMemo(() => {
    if (!data?.assignments) return [];

    return data.assignments.filter((assignment) => {
      // 코스 필터
      if (selectedCourseId && assignment.courseId !== selectedCourseId) {
        return false;
      }

      // 상태 필터
      const groupStatus = getAssignmentGroupStatus(assignment.submission, assignment.status);
      if (groupStatus !== selectedTab) {
        return false;
      }

      // 검색어 필터
      if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [data?.assignments, selectedCourseId, selectedTab, searchQuery]);

  // 탭별 통계
  const stats = useMemo(() => {
    if (!data?.assignments) return { pending: 0, submitted: 0, graded: 0 };

    return {
      pending: data.assignments.filter(
        (a) => getAssignmentGroupStatus(a.submission, a.status) === 'pending'
      ).length,
      submitted: data.assignments.filter(
        (a) => getAssignmentGroupStatus(a.submission, a.status) === 'submitted'
      ).length,
      graded: data.assignments.filter(
        (a) => getAssignmentGroupStatus(a.submission, a.status) === 'graded'
      ).length,
    };
  }, [data?.assignments]);

  // 현재 선택된 과제
  const selectedAssignment = useMemo(() => {
    return data?.assignments.find((a) => a.id === selectedAssignmentId);
  }, [data?.assignments, selectedAssignmentId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">오류 발생</h2>
          <p className="mt-2 text-red-600">과제를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">과제 관리</h1>
        <p className="mt-2 text-gray-600">수강 중인 과제를 한 곳에서 관리하세요</p>
      </div>

      {/* 필터 바 */}
      <AssignmentFilterBar
        courses={courses}
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 탭 및 과제 목록 */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as AssignmentGroupStatus)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            {getGroupLabel('pending')}
            {stats.pending > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-800">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="relative">
            {getGroupLabel('submitted')}
            {stats.submitted > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                {stats.submitted}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="graded" className="relative">
            {getGroupLabel('graded')}
            {stats.graded > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
                {stats.graded}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 진행 중 탭 */}
        <TabsContent value="pending" className="mt-6">
          <AssignmentList
            assignments={filteredAssignments}
            onSelectAssignment={setSelectedAssignmentId}
            emptyMessage="진행 중인 과제가 없습니다"
          />
        </TabsContent>

        {/* 제출 대기 탭 */}
        <TabsContent value="submitted" className="mt-6">
          <AssignmentList
            assignments={filteredAssignments}
            onSelectAssignment={setSelectedAssignmentId}
            emptyMessage="제출 대기 중인 과제가 없습니다"
          />
        </TabsContent>

        {/* 채점 완료 탭 */}
        <TabsContent value="graded" className="mt-6">
          <AssignmentList
            assignments={filteredAssignments}
            onSelectAssignment={setSelectedAssignmentId}
            emptyMessage="채점 완료된 과제가 없습니다"
          />
        </TabsContent>
      </Tabs>

      {/* 과제 상세 모달 */}
      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          isOpen={!!selectedAssignmentId}
          onClose={() => setSelectedAssignmentId(null)}
          onSubmissionSuccess={() => {
            // 제출 성공 후 모달 닫고 리스트 새로고침
            setSelectedAssignmentId(null);
          }}
        />
      )}
    </div>
  );
}
