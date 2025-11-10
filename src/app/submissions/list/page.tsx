'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { GlobalNavigation } from '@/components/GlobalNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Submission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  user_id: string;
  user_name: string;
  course_title: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  is_late: boolean;
  score: number | null;
  content: string;
  link: string | null;
  feedback: string | null;
}

export default function SubmissionsListPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 사용자 프로필 조회 (역할 확인)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/auth/profile');
        return response.data;
      } catch (err) {
        console.error('프로필 조회 실패:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // 권한 검증: 강사가 아니면 리다이렉트
  useEffect(() => {
    if (!userLoading && !profileLoading && profile) {
      if (profile.role !== 'instructor') {
        router.push('/');
      }
    }
  }, [profile, userLoading, profileLoading, router]);

  // 제출물 목록 조회
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['instructor-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await apiClient.get<Submission[]>('/api/instructor/submissions');
        return response.data;
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.id && profile?.role === 'instructor',
  });

  // 필터링된 제출물
  const filteredSubmissions = (submissions || []).filter(submission => {
    const matchesSearch =
      submission.assignment_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      submitted: {
        label: '제출됨',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      graded: {
        label: '채점완료',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
      },
      resubmission_required: {
        label: '재제출필요',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
      },
    };
    return configs[status] || configs.submitted;
  };

  // 권한 검증 중 또는 권한 없음 - 아무것도 표시하지 않음
  if (userLoading || profileLoading || !profile || profile.role !== 'instructor') {
    return null;
  }

  return (
    <>
      <GlobalNavigation />
      <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">제출물 평가</h1>
        <p className="text-slate-500">학생들의 제출물을 검토하고 평가합니다</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            제출물을 불러올 수 없습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 필터 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                검색 (과제명, 강의명, 학생명)
              </label>
              <Input
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                상태
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="submitted">제출됨</SelectItem>
                  <SelectItem value="graded">채점완료</SelectItem>
                  <SelectItem value="resubmission_required">재제출필요</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제출물 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? '검색 결과가 없습니다'
                : '평가할 제출물이 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => {
            const statusConfig = getStatusConfig(submission.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 과제 정보 */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {submission.assignment_title}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {submission.course_title}
                        </p>
                      </div>

                      {/* 학생 정보 */}
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-sm text-slate-600">
                          학생: <span className="font-medium">{submission.user_name}</span>
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(submission.submitted_at).toLocaleString('ko-KR')}
                        </span>
                        {submission.is_late && (
                          <Badge variant="destructive" className="text-xs">
                            지각
                          </Badge>
                        )}
                      </div>

                      {/* 상태 배지 */}
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 flex-shrink-0" />
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        {submission.score !== null && (
                          <span className="text-sm font-semibold text-slate-900">
                            {submission.score}점
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 버튼 */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/submissions/${submission.id}/review`)}
                      className="gap-2 flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                      검토
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}
