'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AssignmentForm } from '@/features/assignment/components/AssignmentForm';

export default function NewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const handleSuccess = () => {
    router.push(`/courses/${courseId}/assignments`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${courseId}/assignments`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">새 과제 만들기</h1>
            <p className="text-slate-500 mt-1">학생들을 위한 새로운 과제를 생성하세요</p>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">과제 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm 
              courseId={courseId}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

