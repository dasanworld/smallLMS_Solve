'use client';

export const LandingHowItWorks = () => {
  const steps = [
    {
      order: 1,
      title: '회원가입',
      description: '이메일과 역할(학습자/강사)을 선택하여 가입합니다.',
    },
    {
      order: 2,
      title: '프로필 설정',
      description: '이름, 연락처 등 기본 정보를 입력합니다.',
    },
    {
      order: 3,
      title: '역할별 대시보드',
      description: '학습자는 과정을 탐색하고, 강사는 과정을 관리합니다.',
    },
    {
      order: 4,
      title: '학습 시작',
      description: '과제를 제출하고 성적을 확인합니다.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          이렇게 사용하세요
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.order} className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white font-bold mb-4">
                {step.order}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
              {step.order < steps.length && (
                <div className="hidden lg:block absolute top-6 left-12 w-full h-0.5 bg-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
