"use client";

// src/app/signup/page.tsx

import { OnboardingFlow } from '@/features/auth/components/OnboardingFlow';

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

const SignupPage = ({ params }: SignupPageProps) => {
  void params;
  return <OnboardingFlow />;
};

export default SignupPage;
