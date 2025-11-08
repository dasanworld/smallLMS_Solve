# Refactoring Plan

## 분석 요약
- Hono 백엔드와 React Query 프런트엔드 전반에서 스펙 미준수, 중복 인증, 비즈니스 로직 과밀화가 동시에 나타나고 있습니다.
- 특히 `/api` 프리픽스 누락, 개발 환경에서의 Hono 싱글턴 캐싱, 인증 토큰 처리 중복은 즉각적인 수정이 필요한 영역입니다.
- 아래 표는 식별된 코드 스멜을 긴급도(Impact)와 복잡도(Effort) 관점에서 정리한 것입니다.

| # | 스멜 요약 | 위치 | Impact | Effort |
|---|-----------|------|:------:|:------:|
| 1 | `/api` 프리픽스 누락으로 예시 라우트 동작 불일치 | `src/features/example/backend/route.ts:19-51` | 8 | 3 |
| 2 | 개발 환경에서도 고정 싱글턴으로 HMR 미반영 | `src/backend/hono/app.ts:11-31` | 7 | 4 |
| 3 | `getAuthUser`가 요청 범위 Supabase를 우회하고 새 클라이언트 생성 | `src/backend/hono/context.ts:45-69` | 7 | 5 |
| 4 | 코스 라우트별 인증 토큰 파싱이 4회 반복되어 SRP 위배 | `src/features/course/backend/route.ts:85-218` | 7 | 6 |
| 5 | 학습자 대시보드 서비스가 단일 함수(200+loc)에 모든 비즈니스 로직을 집약 | `src/features/dashboard/backend/service.ts:24-210` | 6 | 8 |
| 6 | 회원가입 폼과 서버 스키마가 분리 정의되어 DTO 드리프트 위험 | `src/features/auth/components/RoleSelectionForm.tsx:28-74`, `src/features/auth/backend/schema.ts` | 5 | 4 |
| 7 | React Query 훅에서 에러를 삼키거나 UI 피드백 미제공 | `src/features/course/hooks/useEnrollmentStatusQuery.ts:9-22`, `src/features/auth/hooks/useSignupMutation.ts:5-28` | 5 | 3 |

## 스멜별 상세 조치

### 1. `/api` 프리픽스 누락 (Impact 8 / Effort 3)
- **증상**: `registerExampleRoutes`가 `app.get('/example/:id', …)`로 등록되어 Hono 라우트 규칙(모든 경로 `/api` 프리픽스 필요)을 어깁니다.
- **조치**:
  - 라우트 경로를 `/api/example/:id`로 변경하고, 상수화된 라우트 빌더를 도입해 재발 방지.
  - 예제 기능 전체가 `/api`에 묶여 있는지 자동 검증하는 라우트 스냅샷 테스트 추가.
- **테스트**: `@hono/node-server`로 통합 테스트를 작성해 `/api/example/:id` 호출 시 200/400 케이스를 검증합니다.

### 2. 개발·운영 공용 싱글턴 (Impact 7 / Effort 4)
- **증상**: `createHonoApp`이 항상 글로벌 싱글턴을 반환하여 개발 모드에서 라우트/미들웨어 변경이 반영되지 않습니다.
- **조치**:
  - `process.env.NODE_ENV !== 'production'`일 때는 항상 새 인스턴스를 만들고, 프로덕션에서만 캐싱.
  - 동시에 `app.use` 체인을 함수로 추출하여 테스트 시 독립 인스턴스를 쉽게 만들 수 있도록 구성.
- **테스트**: 개발 모드에서 모듈 재임포트 시 라우트 수가 갱신되는지 스냅샷 테스트, 프로덕션 빌드 경로에서 단일 인스턴스만 생성되는지 단위 테스트.

### 3. 요청 범위 Supabase 우회 (Impact 7 / Effort 5)
- **증상**: `getAuthUser`가 `createServiceClient`를 재호출하여 `withSupabase`가 넣어준 요청 범위 Supabase 인스턴스를 무시하고, Authorization 헤더 파싱도 중복 구현합니다.
- **조치**:
  - `getAuthUser`를 `getSupabase(c)`를 사용하도록 수정하고, 토큰 파싱 로직을 `extractBearerToken(c.req)`와 같은 유틸로 분리.
  - Supabase 관리 권한이 필요한 경우만 별도 클라이언트를 허용하도록 명시적인 파라미터를 받도록 리팩터링.
- **테스트**: Authorization 헤더 유무에 따라 `getAuthUser`가 null/사용자를 반환하는 단위 테스트 + Supabase 목을 통한 토큰 위변조 케이스 검증.

### 4. 인증 토큰 처리 중복 (Impact 7 / Effort 6)
- **증상**: `src/features/course/backend/route.ts` 내 POST/GET/DELETE 라우트마다 Authorization 헤더 확인, Supabase `auth.getUser`, 오류 응답 작성이 반복됩니다.
- **조치**:
  - Hono 미들웨어 `requireAuth()`를 만들고, `c.set('user', ...)` 형태로 사용자 정보를 주입한 뒤 라우트에서는 `const user = getAuthUser(c)` 한 번만 호출.
  - 공통 에러 응답을 `failure(401, …)` 래퍼로 감싸고 `ts-pattern`으로 오류 코드를 맵핑하여 로거 호출을 단순화.
  - 서비스 호출부는 `const deps = buildCourseDeps(c)`와 같이 팩토리화.
- **테스트**: 미들웨어 단위 테스트 + 라우트 통합 테스트로 401/200/409 등 주요 코드 경로를 커버. React Query 훅과 연동되는 e2e(Playwright) 시나리오도 작성 가능.

### 5. 대시보드 서비스 과밀도 (Impact 6 / Effort 8)
- **증상**: `getLearnerDashboardService`가 200+라인에서 쿼리, 매핑, 계산, 정렬, 검증까지 모두 처리하여 SRP를 완전히 벗어났고, N+1과 중복 쿼리(`courses` 테이블을 3회 호출)를 유발합니다.
- **조치**:
  - `repositories/dashboard.ts`(raw 쿼리)와 `services/dashboard.ts`(도메인 조립)로 분리.
  - `Promise.all`을 사용해 독립 쿼리를 병렬화하고, course/assignment 데이터는 Map 캐시로 재사용.
  - 진행률 계산, 과제 필터링, 피드백 매핑을 각각 순수 함수로 추출하고, `ts-pattern`으로 상태 분기를 명시.
- **테스트**: 각 순수 함수를 단위 테스트하고, 서비스 레벨에서는 Supabase 목을 이용해 입력별 응답 스냅샷을 검증합니다.

### 6. 회원가입 스키마 중복 (Impact 5 / Effort 4)
- **증상**: `RoleSelectionForm`이 프런트 전용 Zod 스키마(`roleSelectionFormSchema`)를 정의하고, 서버의 `signupRequestSchema`와 필드/메시지가 쉽게 분기될 수 있습니다.
- **조치**:
  - 서버 스키마를 `src/features/auth/lib/dto.ts`에서 재노출하고, 클라이언트 폼은 동일 스키마를 확장(`schema.extend({ confirmPassword: … })`)하도록 수정.
  - 폼 제출 시 DTO 매핑을 전담하는 `mapSignupFormToRequest` 함수를 만들어 변환 책임을 한 곳에 모읍니다.
- **테스트**: 폼 매퍼 단위 테스트와 `zod` 스냅샷 테스트로 클라이언트/서버 스키마가 동일하게 진화하는지 확인합니다.

### 7. React Query 에러 처리 부재 (Impact 5 / Effort 3)
- **증상**:
  - `useEnrollmentStatusQuery`는 네트워크/권한 오류를 모두 `{ isEnrolled: false }`로 삼켜 사용자에게 잘못된 정보를 줍니다.
  - `useSignupMutation`은 `extractApiErrorMessage`를 import만 하고 사용하지 않아 UI가 항상 동일한 콘솔 에러만 찍습니다.
- **조치**:
  - `EnrollmentStatus` 훅에서 `extractApiErrorMessage`로 에러 메시지를 만들고 `throw new Error(message)` 후 UI에서 상태별 안내 표시.
  - `useSignupMutation`의 `onError`에서 `toast` 혹은 폼 에러 스토어 업데이트를 수행하고, 훅 반환값에 `errorMessage`를 노출.
- **테스트**: React Testing Library로 훅을 감싸 mock API 응답을 주입하고 로딩/에러 시 UI 메시지가 맞는지 스냅샷 검증.

## 테스트 전략 요약
1. **백엔드 라우트**: Hono 핸들러를 `app.request()`로 직접 호출하는 통합 테스트를 도입해 `/api` prefix 및 인증 미들웨어를 검증.
2. **서비스 계층**: Supabase SDK를 목(mock) 처리하는 단위 테스트로 복잡한 데이터 조립 로직(대시보드 등)을 안정화.
3. **프런트 훅/폼**: React Query 훅과 RHF 폼을 RTL로 렌더링하여 에러·성공 플로우를 회귀 테스트.

## 당장 실행할 개선 계획
1. **라우팅 규칙 정비**: 예제 라우트의 `/api` 프리픽스 적용과 Hono 싱글턴 재구성으로 백엔드 기본 동작을 스펙에 맞춥니다.
2. **인증 공통 레이어 구축**: `requireAuth` 미들웨어와 `getAuthUser` 개선을 먼저 수행해 모든 엔드포인트가 동일한 인증 경로를 사용하도록 합니다.
3. **프런트 오류 가시성 확보**: Enrollment/Signup 훅의 에러 전달을 바로 수정해 사용자 피드백 품질을 높이고, 이후 대시보드 서비스 분리 작업을 착수합니다.

이 순서를 따르면 빠르게 실패 지점을 해소하고, 이후 대규모 서비스 리팩토링(대시보드/코스)을 안전하게 진행할 수 있습니다.
