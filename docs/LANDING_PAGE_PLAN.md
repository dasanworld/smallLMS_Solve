# 비로그인 정책 랜딩페이지 구현 계획 (Landing Page Plan)

## 개요

비로그인 사용자를 위한 랜딩페이지를 구현하여 프로젝트의 가치 제안, 기능 설명, 그리고 회원가입 유도를 제공합니다.

**현황**: 기본 랜딩페이지는 구현되어 있으나, 프로젝트 특화 콘텐츠 및 설정 가이드 중심으로 되어있음. LMS 프로젝트에 맞는 랜딩페이지로 재구성 필요.

---

## 1. 현재 상태 분석

### 1.1 기존 구현 상태

| 항목 | 현황 | 비고 |
|------|------|------|
| 공개 경로 (/) | ✅ 완성 | 모든 사용자 접근 가능 |
| 비로그인 UI | ✅ 완성 | 로그인/회원가입 버튼 |
| 로그인 사용자 UI | ✅ 완성 | 역할별 대시보드 링크 |
| 인증 상태 관리 | ✅ 완성 | useCurrentUser 훅 |
| 로그아웃 기능 | ✅ 완성 | 로그아웃 버튼 |
| LMS 특화 콘텐츠 | ❌ 미완성 | 프로젝트 설정 가이드 중심 |
| 모바일 반응형 | ✅ 완성 | md: 브레이크포인트 적용 |

### 1.2 문제점 및 개선 필요 사항

1. **콘텐츠 문제**
   - 현재: SuperNext 템플릿 설정 가이드 중심
   - 필요: LMS 프로젝트의 가치 제안 및 기능 소개

2. **비로그인 사용자 경험**
   - 현재: 프로젝트 소개 + 로그인/회원가입 버튼만 제공
   - 필요: LMS의 주요 기능, 역할별 소개, 사용 시나리오 제시

3. **비주얼/디자인**
   - 현재: 기술 스택 중심의 회색 톤
   - 필요: 사용자 중심의 더 매력적인 비주얼

4. **CTA (Call To Action)**
   - 현재: 단순 링크만 제공
   - 필요: 명확한 행동 유도 (회원가입 강조)

---

## 2. 구현 목표

### 2.1 기능 목표

1. **비로그인 사용자를 위한 명확한 가치 제안**
   - LMS 플랫폼의 목적과 주요 기능 설명
   - 학습자/강사 역할별 소개

2. **회원가입 유도**
   - 프로젝트의 차별화된 기능 강조
   - 회원가입의 이유와 이점 제시

3. **로그인 사용자를 위한 빠른 대시보드 접근**
   - 역할별 대시보드 직접 링크
   - 사용자 프로필 정보 표시

4. **반응형 디자인**
   - 모바일, 태블릿, 데스크톱 모두 최적화

### 2.2 사용자 경험 목표

- **비로그인**: "LMS가 무엇인가?" → "나는 어떻게 사용할까?" → "가입해볼까?"
- **로그인**: 대시보드로 빠르게 접근

---

## 3. 모듈 설계

### 3.1 페이지 구조

```
src/app/page.tsx (메인 랜딩페이지)
├── Header (네비게이션)
│   ├── 로고/타이틀
│   └── authActions (로그인/회원가입 또는 대시보드 링크)
│
├── Hero Section (메인 배너)
│   ├── 제목
│   ├── 부제목
│   └── CTA 버튼
│
├── Feature Section (주요 기능)
│   ├── 학습자 기능 카드
│   ├── 강사 기능 카드
│   └── 플랫폼 기능 카드
│
├── How It Works (사용 방법)
│   ├── 단계별 설명
│   └── 다이어그램
│
├── CTA Section (회원가입 유도)
│   ├── 강조 텍스트
│   └── 회원가입 버튼
│
└── Footer
    ├── 링크
    └── 저작권
```

### 3.2 컴포넌트 모듈화

#### 3.2.1 기존 (재사용 가능)

| 모듈 | 경로 | 용도 |
|------|------|------|
| `useCurrentUser` | `src/features/auth/hooks/useCurrentUser.ts` | 인증 상태 관리 |
| `getSupabaseBrowserClient` | `src/lib/supabase/browser-client.ts` | Supabase 클라이언트 |

#### 3.2.2 신규 (구현 필요)

| 모듈 | 경로 | 책임 |
|------|------|------|
| `LandingHeader` | `src/features/landing/components/LandingHeader.tsx` | 헤더/네비게이션 |
| `LandingHero` | `src/features/landing/components/LandingHero.tsx` | 메인 배너 |
| `LandingFeatures` | `src/features/landing/components/LandingFeatures.tsx` | 기능 소개 |
| `LandingHowItWorks` | `src/features/landing/components/LandingHowItWorks.tsx` | 사용 방법 |
| `LandingCTA` | `src/features/landing/components/LandingCTA.tsx` | 회원가입 유도 |
| `LandingFooter` | `src/features/landing/components/LandingFooter.tsx` | 푸터 |

### 3.3 타입 정의

```typescript
// src/features/landing/types/landing.ts
export type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
};

export type HowItWorksStep = {
  order: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};
```

### 3.4 상수 정의

```typescript
// src/features/landing/constants/content.ts
export const LANDING_CONTENT = {
  hero: {
    title: 'LMS 플랫폼에 오신 것을 환영합니다',
    subtitle: '학습과 교육을 위한 완벽한 솔루션',
    ctaText: '시작하기',
  },
  features: [
    {
      title: '학습자를 위한 기능',
      description: '과정 탐색, 과제 제출, 성적 확인',
      icon: 'BookOpen',
      color: 'blue',
    },
    // ...
  ],
  // ...
};
```

---

## 4. 상세 구현 계획

### 4.1 LandingHeader 컴포넌트

**파일**: `src/features/landing/components/LandingHeader.tsx`

**책임**:
- 로고/타이틀 표시
- 인증 상태에 따른 동적 네비게이션 렌더링
- 반응형 헤더 레이아웃

**구현 내용**:
```typescript
'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LogOut } from 'lucide-react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export const LandingHeader = () => {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace('/');
  }, [refresh, router]);

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="text-2xl font-bold text-slate-900">
          SmartLMS
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-slate-500">로딩 중...</span>
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                대시보드
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
```

**테스트 시나리오 (QA Sheet)**:
1. ✅ 비로그인: 로그인/회원가입 버튼 표시
2. ✅ 로그인: 대시보드/로그아웃 버튼 표시
3. ✅ 로딩 중: "로딩 중..." 메시지 표시
4. ✅ 로그아웃 클릭: 로그아웃 후 홈 페이지로 리다이렉트
5. ✅ 모바일 반응형: 버튼이 한 줄에 표시되거나 햄버거 메뉴로 축약

---

### 4.2 LandingHero 컴포넌트

**파일**: `src/features/landing/components/LandingHero.tsx`

**책임**:
- 메인 배너 콘텐츠 렌더링
- CTA 버튼 제공
- 배경 이미지/그래디언트

**구현 내용**:
```typescript
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
```

**테스트 시나리오**:
1. ✅ 제목과 부제목 표시
2. ✅ CTA 버튼이 회원가입 페이지로 링크
3. ✅ 배경 그래디언트 정상 표시
4. ✅ 이미지가 올바르게 렌더링
5. ✅ 모바일: 1열 레이아웃, 데스크톱: 2열 레이아웃

---

### 4.3 LandingFeatures 컴포넌트

**파일**: `src/features/landing/components/LandingFeatures.tsx`

**책임**:
- 주요 기능을 카드 형식으로 표시
- 학습자/강사 역할별 기능 소개

**구현 내용**:
```typescript
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
```

**테스트 시나리오**:
1. ✅ 모든 기능 카드가 표시됨
2. ✅ 아이콘이 올바르게 렌더링
3. ✅ 호버 효과 (그림자 증가)
4. ✅ 모바일: 1열, 태블릿: 2열, 데스크톱: 4열

---

### 4.4 LandingHowItWorks 컴포넌트

**파일**: `src/features/landing/components/LandingHowItWorks.tsx`

**책임**:
- 사용 방법을 단계별로 설명
- 역할별 사용 시나리오 제시

**구현 내용**:
```typescript
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
                <div className="hidden lg:block absolute top-6 left-12 w-8 h-0.5 bg-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

**테스트 시나리오**:
1. ✅ 4개의 단계가 모두 표시됨
2. ✅ 숫자 순서가 올바름
3. ✅ 연결선이 데스크톱에서만 표시
4. ✅ 모바일 반응형 레이아웃

---

### 4.5 LandingCTA 컴포넌트

**파일**: `src/features/landing/components/LandingCTA.tsx`

**책임**:
- 강한 회원가입 유도
- 명확한 행동 유도 메시지

**구현 내용**:
```typescript
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
```

**테스트 시나리오**:
1. ✅ 제목, 부제목, 버튼이 모두 표시됨
2. ✅ 버튼 클릭 시 회원가입 페이지로 이동
3. ✅ 호버 효과 작동
4. ✅ 센터 정렬

---

### 4.6 LandingFooter 컴포넌트

**파일**: `src/features/landing/components/LandingFooter.tsx`

**책임**:
- 바닥글 정보 표시
- 관련 링크 제공

**구현 내용**:
```typescript
'use client';

import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-white mb-4">SmartLMS</h3>
            <p>학습과 교육을 위한 완벽한 솔루션</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">리소스</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white">문서</Link></li>
              <li><Link href="#" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">법률</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white">이용약관</Link></li>
              <li><Link href="#" className="hover:text-white">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center">
          <p>&copy; 2024 SmartLMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
```

**테스트 시나리오**:
1. ✅ 모든 섹션이 표시됨
2. ✅ 링크가 모두 작동
3. ✅ 저작권 정보 표시
4. ✅ 모바일 반응형

---

## 5. 메인 페이지 통합

### 5.1 수정된 src/app/page.tsx

```typescript
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
```

---

## 6. 디렉토리 구조

```
src/
├── features/
│   └── landing/
│       ├── components/
│       │   ├── LandingHeader.tsx
│       │   ├── LandingHero.tsx
│       │   ├── LandingFeatures.tsx
│       │   ├── LandingHowItWorks.tsx
│       │   ├── LandingCTA.tsx
│       │   └── LandingFooter.tsx
│       ├── constants/
│       │   └── content.ts
│       └── types/
│           └── landing.ts
```

---

## 7. 데이터 흐름 (Dataflow)

```mermaid
graph TD
    A[비로그인 사용자] -->|방문| B[landing page /]
    C[로그인 사용자] -->|방문| B

    B -->|인증 상태 확인| D{useCurrentUser}

    D -->|비로그인| E[LandingHeader<br/>로그인/회원가입 버튼]
    D -->|로그인| F[LandingHeader<br/>대시보드/로그아웃]

    E --> G[LandingHero]
    F --> G

    G --> H[LandingFeatures<br/>기능 소개]
    H --> I[LandingHowItWorks<br/>사용 방법]
    I --> J[LandingCTA<br/>회원가입 유도]
    J --> K[LandingFooter]

    E -->|회원가입 클릭| L[/signup]
    E -->|로그인 클릭| M[/login]
    J -->|회원가입 클릭| L
    F -->|대시보드 클릭| N{역할 확인}
    N -->|learner| O[/dashboard]
    N -->|instructor| P[/instructor-dashboard]
```

---

## 8. 구현 체크리스트

### Phase 1: 컴포넌트 개발 (기본 구현)

- [ ] LandingHeader 컴포넌트 생성
- [ ] LandingHero 컴포넌트 생성
- [ ] LandingFeatures 컴포넌트 생성
- [ ] LandingHowItWorks 컴포넌트 생성
- [ ] LandingCTA 컴포넌트 생성
- [ ] LandingFooter 컴포넌트 생성

### Phase 2: 페이지 통합

- [ ] src/app/page.tsx 리팩토링
- [ ] 모든 컴포넌트 import 추가
- [ ] 페이지 레이아웃 통합

### Phase 3: 스타일링 & 반응형

- [ ] Tailwind CSS 클래스 검증
- [ ] 모바일 반응형 테스트
- [ ] 브라우저 호환성 확인

### Phase 4: 기능 테스트

- [ ] 비로그인 → 로그인/회원가입 링크 확인
- [ ] 로그인 → 대시보드 링크 확인
- [ ] 로그아웃 기능 확인
- [ ] 모든 링크 작동 확인

### Phase 5: 콘텐츠 최적화

- [ ] 텍스트 콘텐츠 검토 및 수정
- [ ] 이미지 최적화 (picsum.photos)
- [ ] SEO 메타데이터 추가

---

## 9. 구현 우선순위

**High Priority** (즉시 필요)
1. LandingHeader (인증 상태 표시)
2. LandingHero (메인 CTA)
3. LandingCTA (회원가입 유도)

**Medium Priority** (추가 가치)
1. LandingFeatures (기능 설명)
2. LandingHowItWorks (사용 시나리오)

**Low Priority** (마무리)
1. LandingFooter (바닥글)
2. 콘텐츠 최적화

---

## 10. 기술 스택

| 기술 | 용도 | 버전 |
|------|------|------|
| Next.js | 프레임워크 | 14+ |
| React | UI 라이브러리 | 18+ |
| TypeScript | 타입 안정성 | latest |
| Tailwind CSS | 스타일링 | 3+ |
| lucide-react | 아이콘 | latest |
| Supabase | 인증 | latest |
| React Query | 상태 관리 | 5+ |

---

## 11. 성공 기준

✅ **기능 성공 기준**
- 모든 사용자가 홈 페이지에 접근 가능
- 비로그인 사용자는 로그인/회원가입 버튼 표시
- 로그인 사용자는 대시보드 링크 표시
- 모든 내부 링크가 올바르게 작동

✅ **UX 성공 기준**
- 모바일/태블릿/데스크톱 모두 최적화
- 페이지 로딩 속도 < 2초
- 명확한 행동 유도 (회원가입)

✅ **코드 품질 기준**
- TypeScript 타입 안정성 100%
- 모든 컴포넌트는 클라이언트 컴포넌트 (`'use client'`)
- 코드베이스 가이드라인 준수 (CLAUDE.md)

---

## 12. 참고 문서

- [REDIRECT_POLICY.md](./REDIRECT_POLICY.md) - 리다이렉트 정책
- [userflow.md](./userflow.md) - 사용자 흐름
- [CLAUDE.md](../CLAUDE.md) - 코드베이스 가이드라인
