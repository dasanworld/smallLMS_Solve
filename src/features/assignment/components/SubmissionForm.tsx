'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import { apiClient } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SubmissionFormProps {
  assignment: AssignmentWithSubmission;
  onSuccess: () => void;
}

export default function SubmissionForm({ assignment, onSuccess }: SubmissionFormProps) {
  const [submitType, setSubmitType] = useState<'text' | 'link'>('text');
  const [content, setContent] = useState(assignment.submission?.content || '');
  const [link, setLink] = useState(assignment.submission?.link || '');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload =
        submitType === 'text'
          ? { content: content || undefined }
          : { link: link || undefined };

      const response = await apiClient.post(
        `/api/courses/${assignment.courseId}/assignments/${assignment.id}/submit`,
        payload
      );

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-assignments'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || '제출에 실패했습니다.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검증
    if (submitType === 'text' && !content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (submitType === 'link' && !link.trim()) {
      setError('링크를 입력해주세요.');
      return;
    }

    // URL 유효성 검증
    if (submitType === 'link') {
      try {
        new URL(link);
      } catch {
        setError('유효한 URL을 입력해주세요. (예: https://example.com)');
        return;
      }
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제출 타입 선택 */}
      <Tabs value={submitType} onValueChange={(v) => setSubmitType(v as 'text' | 'link')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">텍스트</TabsTrigger>
          <TabsTrigger value="link">링크</TabsTrigger>
        </TabsList>

        {/* 텍스트 제출 */}
        <TabsContent value="text" className="mt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">내용</label>
            <Textarea
              placeholder="과제 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-64"
              disabled={mutation.isPending}
            />
            <p className="text-xs text-gray-500">최대 10,000자까지 입력 가능합니다.</p>
          </div>
        </TabsContent>

        {/* 링크 제출 */}
        <TabsContent value="link" className="mt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">링크</label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={mutation.isPending}
            />
            <p className="text-xs text-gray-500">
              과제 파일 또는 참고 링크를 입력하세요. (예: Google Docs, GitHub 링크 등)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 기존 제출 정보 표시 */}
      {assignment.submission && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">기존 제출 정보</p>
              <p className="mt-1 text-xs">
                제출: {new Date(assignment.submission.submittedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full"
        size="lg"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            제출 중...
          </>
        ) : (
          assignment.submission ? '재제출' : '제출'
        )}
      </Button>
    </form>
  );
}
