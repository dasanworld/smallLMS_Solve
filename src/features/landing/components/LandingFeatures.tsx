'use client';

import { BookOpen, BarChart3, Users, CheckSquare } from 'lucide-react';

const features = [
  {
    title: '과정 탐색',
    description: '다양한 분야의 과정을 검색하고 탐색할 수 있습니다.',
    icon: BookOpen,
  },
  {
    title: '과제 제출 & 피드백',
    description: '과제를 제출하고 강사로부터 피드백을 받습니다.',
    icon: CheckSquare,
  },
  {
    title: '성적 확인',
    description: '과제별 성적과 과정별 총점을 확인합니다.',
    icon: BarChart3,
  },
  {
    title: '강사 관리',
    description: '강사는 과정과 과제를 관리할 수 있습니다.',
    icon: Users,
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          주요 기능
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <feature.icon className="w-8 h-8 text-slate-900 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
