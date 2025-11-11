## 소형 LMS (Small LMS) – Monorepo 가이드

이 저장소는 Next.js App Router와 Hono(Edge-friendly HTTP 프레임워크), Supabase를 결합한 학습 관리 시스템(LMS)입니다. 프런트엔드는 전부 Client Component로 구성하고, 서버 상태는 React Query로 관리합니다. 백엔드는 Next.js의 Route Handler에서 Hono 앱을 위임해, 일관된 미들웨어/응답 포맷/에러 처리 흐름을 유지합니다.


## 핵심 기능

- 인증/권한: Supabase Auth 연동, 역할 기반 접근(학습자/강사)
- 코스/과제/제출/채점 전형적인 LMS 도메인 지원
- 일관된 API 응답 포맷(success/failure/respond)과 오류 표준화
- Client Component + React Query 기반 데이터 페칭/캐싱
- Shadcn UI + TailwindCSS로 생산적인 UI 개발


## 기술 스택

- 앱 프레임워크: Next.js (App Router)
- 백엔드 HTTP: Hono (+ Next Route Handler 위임)
- 인증/DB: Supabase (Postgres)
- 상태 관리: @tanstack/react-query, zustand
- UI: shadcn-ui, tailwindcss, lucide-react
- 유틸/검증: zod, date-fns, ts-pattern


## 디렉터리 구조

```text
src
├─ app                          # Next.js App Router
│  └─ api/[[...hono]]/route.ts  # Hono 앱을 Next Route Handler로 위임
├─ backend
│  ├─ hono                      # Hono 앱 엔트리(app.ts), 컨텍스트(context.ts)
│  ├─ http                      # 공통 응답 포맷(success/failure/respond)
│  ├─ middleware                # 에러/컨텍스트/Supabase 미들웨어
│  ├─ config                    # 환경변수 파싱 및 캐싱
│  └─ supabase                  # Supabase 서버 클라이언트 래퍼
├─ components/ui                # shadcn-ui 컴포넌트
├─ constants                    # 공통 상수
├─ hooks                        # 공용 훅
├─ lib                          # 공용 유틸
├─ remote                       # 프런트엔드 HTTP 클라이언트(api-client)
└─ features
   └─ [feature]
      ├─ components/*           # 기능별 UI 컴포넌트
      ├─ backend/route.ts       # 기능 라우터(Hono)
      ├─ backend/service.ts     # 비즈니스 로직/Supabase 접근
      ├─ backend/schema.ts      # 요청/응답 zod 스키마
      ├─ backend/error.ts       # 에러 코드 정의
      └─ lib/*                  # DTO 재노출 등 클라이언트 공유

supabase/migrations             # SQL 마이그레이션
```


## 아키텍처 개요

- Next.js의 `src/app/api/[[...hono]]/route.ts`에서 Hono 앱을 모든 HTTP 메서드로 위임합니다.
- `src/backend/hono/app.ts`는 다음 미들웨어 순서로 연결합니다.
  1. `errorBoundary()` – 공통 에러 로깅 및 5xx 정규화
  2. `withAppContext()` – zod 기반 env 파싱, 콘솔 logger, 설정 주입
  3. `withSupabase()` – service-role 키 기반 Supabase 서버 클라이언트 주입
  4. feature 라우터 등록(`registerXxxRoutes(app)`)
- 개발(HMR)에서는 앱을 매번 재생성, 프로덕션에서는 싱글턴 캐시합니다.
- 모든 API 경로는 반드시 `/api` 프리픽스를 포함해야 합니다. 예: `/api/auth/profile`

간단한 흐름(요청 → 응답):
```text
Next Route Handler → Hono(app) → [errorBoundary → withAppContext → withSupabase] → feature router → success/failure → respond()
```


## 환경 변수

필수 항목(예시):

- `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`(폴백 필수)
- `SUPABASE_SERVICE_ROLE_KEY` (서버에서만 사용)
- 기타 프로젝트별 키들

주의:
- `SUPABASE_URL` 미설정 시 반드시 `NEXT_PUBLIC_SUPABASE_URL`로 폴백해 500을 방지해야 합니다.
- 상대 경로가 포함된 응답(`redirectTo` 등)은 `z.string()`으로 검증합니다(`z.string().url()` 사용 금지).


## 실행 방법

1) 의존성 설치
```bash
npm install
```

2) 개발 서버
```bash
npm run dev
# http://localhost:3000
```

3) 프로덕션 빌드/실행
```bash
npm run build
npm run start
```


## 프런트엔드 개발 가이드

- 모든 컴포넌트는 Client Component로 작성합니다. 파일 상단에 `"use client"`를 선언하세요.
- 서버 상태는 `@tanstack/react-query`로만 관리합니다.
- 공통 HTTP 호출은 `@/lib/remote/api-client`를 통해 라우팅하세요(직접 fetch/axios 남발 금지).
- 상태 컴포넌트/폼은 `zustand`, `react-hook-form`을 권장합니다.
- shadcn-ui 추가 예:
```bash
npm run shadcn:add button
# 또는
npx shadcn@latest add card
```


## 백엔드(HTTP) 개발 가이드

- 모든 라우트는 Hono에 `/api` 프리픽스로 등록합니다.
- 라우트 레지스트라 함수는 `Hono<AppEnv>` 타입을 사용하세요.
- 응답은 항상 `success`/`failure`/`respond(c, result)` 패턴을 사용합니다.
- Supabase 접근은 컨텍스트에서 주입받은 인스턴스를 사용하세요.
  - 금지: 임의의 서비스 클라이언트 생성, `c.env` 직접 수정
  - 권장: `getSupabase(c)`(컨텍스트)로 접근
- zod로 요청/응답을 검증하고, 유연한 ISO8601 검증이 필요할 땐 `Date.parse()` 기반 refine를 사용하세요.

간단 예(라우트 작성 스케치):
```ts
// src/features/example/backend/route.ts
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, success, failure } from '@/backend/http/response';

export function registerExampleRoutes(app: Hono<AppEnv>) {
  app.get('/api/example', async (c) => {
    try {
      return respond(c, success(200, { message: 'ok' }));
    } catch (e) {
      return respond(c, failure(500, 'UNKNOWN_ERROR', 'Internal error'));
    }
  });
}
```


## 데이터베이스/마이그레이션

- 모든 스키마 변경은 `supabase/migrations/*.sql`에 추가합니다.
- 원칙
  - 파일명은 증가하는 접두사 번호(`0001_...`)로 유니크하게
  - `CREATE TABLE IF NOT EXISTS`를 사용해 멱등성 보장
  - `BEGIN … EXCEPTION … END`로 오류 처리
  - 각 테이블에 `updated_at`과 이를 갱신하는 트리거 추가
  - RLS는 사용하지 않음(명시적으로 비활성)
  - 자주 조회되는 컬럼에는 적절한 인덱스


## 인증/권한

- 프런트엔드 요청은 axios 인터셉터(또는 api-client)에서 Supabase 세션 토큰을 자동으로 Bearer 헤더에 주입하세요.
- API는 Hono 미들웨어에서 토큰을 검증하고, 요청 컨텍스트에 사용자 정보를 주입합니다.
- 로그아웃은 클라이언트 `supabase.auth.signOut()`를 먼저 호출해 세션을 정리합니다.


## 코드 컨벤션 하이라이트

- TypeScript 필수, 명확한 타입(특히 공개 API) 선언
- 가드 절/초기 리턴, 과도한 try/catch 지양
- 설명적인 변수/함수명 사용(약어 지양)
- zod 기반 스키마 검증(입/출력 모두)
- React Hooks 규칙 엄수(조건/루프/중첩 호출 금지)


## 스크립트

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 실행
# (선택) 테스트 관련 스크립트가 있는 경우 여기에 추가
```


## 문의

이 문서는 현재 저장소의 구조/규칙에 맞춘 요약 가이드입니다. 기능 추가나 구조 변경 시, 위 가이드(특히 Hono 라우팅 원칙과 Supabase 사용 원칙)를 우선적으로 준수해 주세요. 필요한 경우 README를 함께 업데이트해 주세요.

이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 사용해 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

## Getting Started

개발 서버를 실행합니다.<br/>
환경에 따른 명령어를 사용해주세요.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하여 페이지를 편집할 수 있습니다. 파일을 수정하면 자동으로 페이지가 업데이트됩니다.

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```
