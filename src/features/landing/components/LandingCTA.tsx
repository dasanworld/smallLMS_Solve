'use client';

import Link from 'next/link';

export const LandingCTA = () => {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          지금 바로 시작하세요
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          가입하고 학습을 시작하세요. 무료입니다.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition"
        >
          무료 회원가입
        </Link>
      </div>
    </section>
  );
};
