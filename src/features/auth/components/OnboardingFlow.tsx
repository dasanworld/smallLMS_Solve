// src/features/auth/components/OnboardingFlow.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSelectionForm } from './RoleSelectionForm';

export const OnboardingFlow = () => {
  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>회원가입</CardTitle>
          <CardDescription>계정 정보와 역할을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleSelectionForm />
        </CardContent>
      </Card>
    </div>
  );
};