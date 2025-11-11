# 강사 시스템 아키텍처 및 E2E 테스트 가이드

## 목차
1. [시스템 아키텍처](#시스템-아키텍처)
2. [강사 페이지 구조](#강사-페이지-구조)
3. [API 엔드포인트](#api-엔드포인트)
4. [E2E 테스트](#e2e-테스트)
5. [개발 가이드](#개발-가이드)

---

## 시스템 아키텍처

### 전체 계층 구조

```
┌─────────────────────────────────────────────┐
│         강사 대시보드 시스템                  │
└─────────────────────────────────────────────┘
         │
         ├─ 프론트엔드 (Pages & Components)
         │   ├─ /instructor-dashboard (강사 대시보드)
         │   ├─ /courses (코스 관리)
         │   ├─ /assignments (전체 과제)
         │   ├─ /courses/[id]/assignments (개별 과제)
         │   └─ /submissions/[id]/grade (채점)
         │
         ├─ 상태 관리 (State Management)
         │   ├─ React Query (서버 상태)
         │   ├─ useState (로컬 상태)
         │   └─ Zustand (선택: 전역 상태)
         │
         ├─ API 계층 (HTTP Client)
         │   ├─ axios (HTTP 요청)
         │   └─ apiClient (래퍼)
         │
         └─ 백엔드 (Hono + Supabase)
             ├─ 인증 미들웨어
             ├─ 역할 검증 미들웨어
             ├─ 대시보드 라우터
             ├─ 코스 라우터
             ├─ 과제 라우터
             ├─ 채점 라우터
             └─ 데이터베이스 (Supabase)
```

### 데이터 흐름

```
사용자 액션 → React Component → API 호출 → Hono 라우터 →
Middleware (인증, 역할 검증) → 서비스 → Supabase → 응답 →
React Query 캐시 → UI 업데이트
```

---

## 강사 페이지 구조

### 1. 강사 대시보드 (`/instructor-dashboard`)

**경로**: `/src/app/(protected)/instructor-dashboard/page.tsx`

**기능**:
- 강사 계정 소유 코스 목록
- 채점 대기 중인 제출물 수
- 수강 학생 통계
- 과제 통계
- 최근 제출물 목록

**컴포넌트 구성**:
```
InstructorDashboard
├─ DashboardMetrics (메트릭 카드 4개)
├─ PendingGradingCounter (채점 대기 카운터)
├─ CourseStatusCard[] (코스 목록)
└─ RecentSubmissionsList (최근 제출물)
```

**API**: `GET /api/dashboard/instructor`

**권한**: `instructor` 역할만

### 2. 코스 관리 (`/courses`)

**경로**: `/src/app/(protected)/courses/page.tsx`

**기능**:
- 강사 소유 코스 목록 조회
- 새 코스 생성
- 기존 코스 수정
- 코스 상태 변경 (draft → published → archived)
- 코스 삭제

**상태 관리**:
- **코스 상태**: `draft`, `published`, `archived`
- **쿼리 키**: `courses.my`, `course.[id]`

**API 엔드포인트**:
```
GET    /api/courses/my                - 강사의 코스 목록
POST   /api/courses                   - 새 코스 생성
GET    /api/courses/:id               - 코스 상세 조회
PUT    /api/courses/:id               - 코스 정보 수정
PATCH  /api/courses/:id/status        - 코스 상태 변경
DELETE /api/courses/:id               - 코스 삭제
```

**권한**: `instructor` 역할만

### 3. 전체 과제 관리 (`/assignments`)

**경로**: `/src/app/(protected)/assignments/page.tsx`

**기능**:
- 강사의 모든 코스에서 과제 통합 조회
- 과제를 상태별로 분류 (draft, published, closed)
- 과제별 제출물 현황 확인
- 과제 발행/마감 상태 변경

**섹션**:
1. **초안 과제 (Draft)**: 아직 발행되지 않은 과제
2. **발행 과제 (Published)**: 학생들이 제출 가능한 과제
3. **마감 과제 (Closed)**: 더 이상 제출을 받지 않는 과제

**API**: 다양한 API에서 데이터 조합

**권한**: `instructor` 역할만

### 4. 개별 코스 과제 관리 (`/courses/[courseId]/assignments`)

**경로**: `/src/app/(protected)/courses/[courseId]/assignments/page.tsx`

**기능** (강사 모드):
- 특정 코스의 과제 목록 조회
- 새 과제 생성
- 과제 정보 수정
- 과제 삭제
- 과제별 제출물 보기

**컴포넌트**:
- **InstructorAssignmentPage** (강사용)
  - AssignmentForm (생성/수정 폼)
  - AssignmentList (과제 목록)

**API 엔드포인트**:
```
GET    /api/courses/:courseId/assignments              - 과제 목록
POST   /api/courses/:courseId/assignments              - 과제 생성
PUT    /api/courses/:courseId/assignments/:assignmentId - 과제 수정
DELETE /api/courses/:courseId/assignments/:assignmentId - 과제 삭제
PATCH  /api/courses/:courseId/assignments/:assignmentId/status - 상태 변경
```

**권한**: `instructor` 역할만 (해당 코스 소유자)

### 5. 제출물 목록 (`/courses/[courseId]/assignments/[assignmentId]/submissions`)

**경로**: `/src/app/(protected)/courses/[courseId]/assignments/[assignmentId]/submissions/page.tsx`

**기능**:
- 특정 과제의 모든 학생 제출물 목록
- 제출 상태 확인 (제출됨, 평가대기, 평가완료)
- 개별 제출물 채점 페이지로 이동

**API 엔드포인트**:
```
GET /api/assignments/:assignmentId/submissions - 과제의 모든 제출물
```

**권한**: `instructor` 역할만 (해당 코스 강사)

### 6. 채점 페이지 (`/submissions/[submissionId]/grade`)

**경로**: `/src/app/submissions/[submissionId]/grade/page.tsx`

**기능**:
- 학생 제출물 상세 정보 표시
- 점수 입력 (0~100)
- 피드백 작성
- 상태 결정 (`graded`, `resubmission_required`)

**컴포넌트**:
- **GradeSubmissionForm**
  - SubmissionDetails (제출물 정보)
  - 점수 입력 필드
  - 피드백 textarea
  - 상태 선택 옵션

**API 엔드포인트**:
```
GET  /api/submissions/:submissionId        - 제출물 상세 조회
PUT  /api/submissions/:submissionId/grade  - 채점 결과 저장
```

**권한**: `instructor` 역할만

---

## API 엔드포인트

### 대시보드 API

#### GET /api/dashboard/instructor
강사 대시보드 데이터 조회

**요청**:
```http
GET /api/dashboard/instructor
Authorization: Bearer {token}
```

**응답**:
```json
{
  "courses": [
    {
      "id": "string",
      "title": "string",
      "status": "draft|published|archived",
      "enrollmentCount": number,
      "assignmentCount": number,
      "createdAt": "ISO 8601"
    }
  ],
  "pendingGradingCount": number,
  "recentSubmissions": [
    {
      "id": "string",
      "assignmentId": "string",
      "assignmentTitle": "string",
      "courseId": "string",
      "courseTitle": "string",
      "studentName": "string",
      "submittedAt": "ISO 8601",
      "status": "string",
      "isLate": boolean
    }
  ]
}
```

**권한**: `instructor`

### 코스 API

#### GET /api/courses/my
강사의 코스 목록 조회

**권한**: `instructor`

#### POST /api/courses
새 코스 생성

**요청 본문**:
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "string"
}
```

**권한**: `instructor`

#### PUT /api/courses/:id
코스 정보 수정

**권한**: `instructor` (코스 소유자)

#### PATCH /api/courses/:id/status
코스 상태 변경

**요청 본문**:
```json
{
  "status": "draft|published|archived"
}
```

**권한**: `instructor` (코스 소유자)

#### DELETE /api/courses/:id
코스 삭제 (소프트 삭제)

**권한**: `instructor` (코스 소유자)

### 과제 API

#### GET /api/courses/:courseId/assignments
과제 목록 조회

#### POST /api/courses/:courseId/assignments
새 과제 생성

**권한**: `instructor` (코스 소유자)

#### PUT /api/courses/:courseId/assignments/:id
과제 정보 수정

**권한**: `instructor` (코스 강사)

#### DELETE /api/courses/:courseId/assignments/:id
과제 삭제

**권한**: `instructor` (코스 강사)

#### PATCH /api/courses/:courseId/assignments/:id/status
과제 상태 변경

**요청 본문**:
```json
{
  "status": "draft|published|closed"
}
```

**권한**: `instructor` (코스 강사)

### 채점 API

#### GET /api/submissions/:submissionId
제출물 상세 조회

**권한**: `instructor` (과제 강사)

#### PUT /api/submissions/:submissionId/grade
채점 결과 저장

**요청 본문**:
```json
{
  "score": number,
  "feedback": "string",
  "status": "graded|resubmission_required"
}
```

**권한**: `instructor` (과제 강사)

#### GET /api/assignments/:assignmentId/submissions
과제의 모든 제출물 조회

**권한**: `instructor` (과제 강사)

---

## E2E 테스트

### 테스트 파일 위치

- **테스트 파일**: `e2e/tests/instructor.spec.ts`
- **Fixture**: `e2e/fixtures/auth.ts`
- **설정**: `playwright.config.ts`

### 테스트 범위

#### 1. 강사 대시보드 테스트
```typescript
test.describe('강사 대시보드 (/instructor-dashboard)', () => {
  // 대시보드 표시 테스트
  // 메트릭 표시 테스트
  // 코스 섹션 표시 테스트
  // 최근 제출물 표시 테스트
  // API 테스트
  // 리다이렉트 테스트
})
```

#### 2. 코스 관리 테스트
```typescript
test.describe('강사 코스 관리 (/courses)', () => {
  // 코스 목록 조회 테스트
  // 코스 생성 테스트
  // 코스 수정 테스트
  // 상태 변경 테스트
  // API 테스트
})
```

#### 3. 과제 관리 테스트
```typescript
test.describe('강사 과제 관리', () => {
  // 전체 과제 조회 테스트
  // 개별 과제 조회 테스트
  // 과제 생성 테스트
  // 과제 수정 테스트
})
```

#### 4. 채점 테스트
```typescript
test.describe('강사 채점 (/submissions/[id]/grade)', () => {
  // 채점 페이지 접근 테스트
  // 채점 폼 제출 테스트
})
```

#### 5. 권한 제어 테스트
```typescript
test.describe('역할 기반 접근 제어', () => {
  // 학습자의 강사 페이지 접근 차단
  // 학습자의 강사 API 접근 차단
  // 인증되지 않은 사용자 접근 차단
})
```

#### 6. 통합 워크플로우 테스트
```typescript
test.describe('강사 통합 워크플로우', () => {
  // 코스 생성 → 과제 생성 → 대시보드 확인
})
```

### 실행 방법

```bash
# 전체 E2E 테스트
npm run test:e2e

# 강사 테스트만
npx playwright test instructor.spec.ts

# 특정 테스트만
npx playwright test instructor.spec.ts --grep "강사 대시보드"

# UI 모드
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 리포트 보기
npm run test:e2e:report
```

### Fixture 사용법

```typescript
// 강사 페이지 (인증된 강사 세션)
authTest('test', async ({ instructorPage }) => {
  await instructorPage.goto('/instructor-dashboard');
});

// 강사 사용자 정보 (토큰 포함)
authTest('test', async ({ instructor }) => {
  const response = await page.request.get('/api/dashboard/instructor', {
    headers: { Authorization: `Bearer ${instructor.token}` }
  });
});

// 강사 Page + 사용자 정보
authTest('test', async ({ authenticatedInstructor }) => {
  const { page, user } = authenticatedInstructor;
});
```

---

## 개발 가이드

### 새로운 강사 기능 추가

1. **API 엔드포인트 생성**
   - `src/features/[feature]/backend/route.ts`에 라우트 작성
   - `requireRole('instructor')` 미들웨어 적용
   - Zod 스키마로 요청/응답 검증

2. **컴포넌트 작성**
   - `src/features/[feature]/components/` 디렉토리에 작성
   - `'use client'` 디렉티브 필수
   - React Query로 데이터 페칭

3. **페이지 작성**
   - `src/app/(protected)/[path]/page.tsx`에 작성
   - 역할 검증 로직 포함
   - 에러 상태 처리

4. **E2E 테스트 작성**
   - `e2e/tests/instructor.spec.ts`에 테스트 케이스 추가
   - 긍정 케이스와 부정 케이스 모두 작성
   - API 테스트 포함

### 코딩 규칙

#### 페이지 컴포넌트
```typescript
'use client';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div>
      {/* 컨텐츠 */}
    </div>
  );
}
```

#### API 라우트
```typescript
export const registerFeatureRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/feature', requireRole('instructor'), async (c) => {
    const supabase = getSupabase(c);
    const user = getUser(c);

    const result = await featureService(supabase, user.id);

    return respond(c, result);
  });
};
```

#### React Query 훅
```typescript
export const useFeatureQuery = () => {
  return useQuery({
    queryKey: ['feature'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/feature');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
```

### 테스트 작성 가이드

#### 기본 테스트
```typescript
authTest('should do something', async ({ instructorPage }) => {
  const page = instructorPage;

  await page.goto('/path');

  await expect(page.locator('text=Title')).toBeVisible();
});
```

#### API 테스트
```typescript
authTest('should test API', async ({ instructor }) => {
  const response = await page.request.get('/api/endpoint', {
    headers: { Authorization: `Bearer ${instructor.token}` }
  });

  expect(response.status()).toBe(200);
});
```

#### 권한 테스트
```typescript
authTest('should deny access', async ({ learnerPage }) => {
  await learnerPage.goto('/instructor-dashboard', {
    waitUntil: 'networkidle'
  });

  await expect(learnerPage).toHaveURL('/dashboard');
});
```

### 디버깅 팁

1. **Playwright Inspector 사용**
   ```bash
   npx playwright test --debug instructor.spec.ts
   ```

2. **스크린샷 확인**
   - 실패한 테스트 스크린샷: `test-results/`

3. **콘솔 로그**
   ```typescript
   await page.evaluate(() => console.log('Debug message'));
   ```

4. **네트워크 모니터링**
   ```typescript
   page.on('request', req => console.log(req.url()));
   page.on('response', res => console.log(res.status(), res.url()));
   ```

---

## 문제 해결

### 테스트 실패 원인

| 문제 | 해결 방법 |
|------|---------|
| 로그인 실패 | 테스트 사용자 계정 확인, 환경 변수 확인 |
| 요소 찾을 수 없음 | 대기 시간 증가, 선택자 확인 |
| 타임아웃 | 서버 상태 확인, 대기 시간 조정 |
| API 403 에러 | 권한 검증 미들웨어 확인, 토큰 확인 |
| 리다이렉트 안 됨 | 라우트 미들웨어 확인, 권한 로직 확인 |

---

## 참고 문서

- [Playwright 공식 문서](https://playwright.dev)
- [Hono 공식 문서](https://hono.dev)
- [React Query 공식 문서](https://tanstack.com/query)
- [Supabase 공식 문서](https://supabase.com/docs)

---

**마지막 업데이트**: 2025-11-11
