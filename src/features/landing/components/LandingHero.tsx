'use client';

import Link from 'next/link';
import Image from 'next/image';

export const LandingHero = () => {
  return (
    <section className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              학습과 교육의 완벽한 플랫폼
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              SmartLMS는 학습자와 강사를 위한 종합적인 학습 관리 시스템입니다.
            </p>
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100"
              >
                지금 시작하기
              </Link>
              <Link
                href="#features"
                className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white/10"
              >
                자세히 보기
              </Link>
            </div>
          </div>
          <Image
            src="https://picsum.photos/500/400?random=1"
            alt="LMS Hero"
            width={500}
            height={400}
            className="rounded-lg"
          />
        </div>
      </div>
    </section>
  );
};
