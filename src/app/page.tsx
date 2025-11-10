'use client';

import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { LandingHero } from '@/features/landing/components/LandingHero';
import { LandingFeatures } from '@/features/landing/components/LandingFeatures';
import { LandingHowItWorks } from '@/features/landing/components/LandingHowItWorks';
import { LandingCTA } from '@/features/landing/components/LandingCTA';
import { LandingFooter } from '@/features/landing/components/LandingFooter';

export default function Home() {
  return (
    <main>
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
