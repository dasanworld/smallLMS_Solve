# API 정책 및 공통 규약

## 1. 인증 (Authentication)

### 인증 미들웨어
- **구현 위치**: `src/backend/middleware/auth.ts`
- **적용 방식**: Hono 미들웨어 `requireAuth()`를 통해 라우트별 인증 가드 적용
- **토큰 처리**:
  * 클라이언트는 `Authorization: Bearer <token>` 헤더로 Supabase 세션 토큰 전송
  * 미들웨어는 `c.req.header('Authorization')`에서 토큰 추출
  * `getSupabase(c).auth.getUser(token)`로 사용자 검증
  * 검증 성공 시 `c.set('user', userData)` 형태로 컨텍스트에 주입
- **에러 응답**: 인증 실패 시 `401 Unauthorized` + `{ code: 'UNAUTHORIZED', message: '...' }`

### 역할 기반 접근 제어 (RBAC)
- **역할 종류**: `learner`, `instructor`, `operator`
- **가드 함수**: `requireRole(['instructor', 'operator'])` 형태로 필요 역할 지정
- **검증 순서**:
  1. `requireAuth()` 미들웨어로 인증 확인
  2. `requireRole()` 미들웨어로 역할 확인
  3. 비즈니스 로직에서 소유권 확인 (예: 코스 owner_id === user.id)
- **에러 응답**: 권한 부족 시 `403 Forbidden` + `{ code: 'INSUFFICIENT_PERMISSIONS', message: '...' }`

### 클라이언트 측 토큰 관리
- **구현 위치**: `src/lib/remote/api-client.ts`
- **Axios 인터셉터**:
  ```typescript
  apiClient.interceptors.request.use(async (config) => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  });
  ```
- **토큰 갱신**: Supabase SDK가 자동으로 토큰 갱신 처리

---

## 2. 에러 처리 (Error Handling)

### 에러 코드 체계
- **형식**: `UPPER_SNAKE_CASE` (예: `COURSE_NOT_FOUND`, `ASSIGNMENT_WEIGHT_EXCEEDED`)
- **카테고리별 코드**:
  * **인증/권한**: `UNAUTHORIZED`, `INSUFFICIENT_PERMISSIONS`, `SESSION_EXPIRED`
  * **리소스**: `COURSE_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `SUBMISSION_NOT_FOUND`
  * **비즈니스 규칙**: `COURSE_NOT_PUBLISHED`, `ASSIGNMENT_CLOSED`, `SUBMISSION_PAST_DUE_DATE`, `ASSIGNMENT_WEIGHT_EXCEEDED`
  * **검증**: `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`, `DUPLICATE_ENTRY`
  * **시스템**: `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR`

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "ASSIGNMENT_WEIGHT_EXCEEDED",
    "message": "과제 가중치 합계가 100%를 초과할 수 없습니다.",
    "details": {
      "currentSum": 1.2,
      "maxAllowed": 1.0
    }
  }
}
```

### 백엔드 에러 처리
- **전역 에러 바운더리**: `src/backend/middleware/error.ts`의 `errorBoundary()` 미들웨어
- **서비스 레이어**: `ts-pattern`으로 에러 타입별 분기 처리
  ```typescript
  import { match } from 'ts-pattern';
  
  const result = await assignmentService.create(data);
  return match(result)
    .with({ success: true }, (r) => success(201, r.data))
    .with({ error: 'WEIGHT_EXCEEDED' }, () => failure(400, 'ASSIGNMENT_WEIGHT_EXCEEDED', '...'))
    .otherwise(() => failure(500, 'INTERNAL_SERVER_ERROR', '...'));
  ```
- **로깅**: 모든 에러는 `logger.error()`로 기록 (컨텍스트 정보 포함)

### 프론트엔드 에러 처리
- **React Query 에러 핸들링**:
  ```typescript
  const mutation = useMutation({
    mutationFn: createAssignment,
    onError: (error) => {
      const message = extractApiErrorMessage(error);
      toast.error(message);
    }
  });
  ```
- **에러 메시지 추출**: `src/lib/remote/api-client.ts`의 `extractApiErrorMessage()` 유틸 사용
- **UI 피드백**: 토스트, 인라인 에러 메시지, 폼 검증 에러 등으로 사용자에게 명확히 전달

---

## 3. 페이지네이션 (Pagination)

### 기본 규칙
- **방식**: Offset-based pagination (limit/offset)
- **기본값**: `limit=20`, `offset=0`
- **최대값**: `limit=100` (성능 보호)
- **적용 대상**: 코스 목록, 제출물 목록, 신고 목록 등 모든 목록형 API

### 요청 파라미터
```typescript
// Query string 예시
GET /api/courses?limit=20&offset=40&sort=created_at&order=desc

// Zod 스키마
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'title', 'enrollment_count']).optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});
```

### 응답 형식
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 40,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

### 구현 가이드
- **Supabase 쿼리**:
  ```typescript
  const { data, count } = await supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order(sort, { ascending: order === 'asc' });
  
  return {
    items: data,
    pagination: {
      total: count,
      limit,
      offset,
      hasNext: offset + limit < count,
      hasPrev: offset > 0
    }
  };
  ```
- **프론트엔드**: React Query의 `useInfiniteQuery` 또는 페이지네이션 컴포넌트 사용

---

## 4. 라우트 규약

### 경로 프리픽스
- **필수 규칙**: 모든 Hono 라우트는 `/api` 프리픽스 포함 필수
- **이유**: Next.js API 라우트가 `/api/[[...hono]]`에 위치하므로
- **예시**:
  ```typescript
  // ✅ 올바른 예시
  app.post('/api/auth/signup', ...)
  app.get('/api/courses/:id', ...)
  
  // ❌ 잘못된 예시
  app.get('/courses/:id', ...) // /api 누락
  ```

### RESTful 규약
- **리소스 명명**: 복수형 명사 사용 (`/courses`, `/assignments`)
- **HTTP 메서드**:
  * `GET`: 조회 (목록/상세)
  * `POST`: 생성
  * `PUT/PATCH`: 수정
  * `DELETE`: 삭제 (소프트 삭제로 구현)
- **상태 코드**:
  * `200 OK`: 성공 (조회/수정)
  * `201 Created`: 생성 성공
  * `204 No Content`: 삭제 성공
  * `400 Bad Request`: 검증 실패
  * `401 Unauthorized`: 인증 실패
  * `403 Forbidden`: 권한 부족
  * `404 Not Found`: 리소스 없음
  * `409 Conflict`: 중복/충돌
  * `500 Internal Server Error`: 서버 오류

### 라우트 등록
- **기능별 분리**: `src/features/[feature]/backend/route.ts`에서 라우터 정의
- **중앙 등록**: `src/backend/hono/app.ts`의 `createHonoApp()`에서 `registerXxxRoutes(app)` 호출
- **HMR 지원**: 개발 환경에서는 싱글턴 캐싱 비활성화하여 라우트 변경 즉시 반영

---

## 5. 응답 형식 표준

### 성공 응답
```typescript
// 단일 리소스
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    ...
  }
}

// 목록 (페이지네이션 포함)
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": { ... }
  }
}

// 생성/수정 후 리다이렉트
{
  "success": true,
  "data": {
    "id": "uuid",
    "redirectTo": "/courses/uuid"
  }
}
```

### 실패 응답
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지",
    "details": { ... } // 선택적
  }
}
```

### 헬퍼 함수
- **위치**: `src/backend/http/response.ts`
- **사용법**:
  ```typescript
  import { success, failure, respond } from '@/backend/http/response';
  
  // 성공
  return success(200, { id: '...', title: '...' });
  
  // 실패
  return failure(400, 'INVALID_INPUT', '필수 필드가 누락되었습니다.');
  
  // 조건부
  return respond(result.success, result.data, result.error);
  ```

---

## 6. 트랜잭션 정책

### 필수 트랜잭션 케이스
1. **과제 가중치 검증**: 과제 생성/수정 시 코스 내 전체 가중치 합계 확인
2. **수강 신청**: `enrollments` INSERT + `courses.enrollment_count` UPDATE
3. **제출물 채점**: `submissions` UPDATE + 관련 통계 갱신

### 구현 방식
- **Supabase**: RPC 함수 또는 서비스 레이어에서 여러 쿼리를 순차 실행 후 에러 시 롤백
- **예시**:
  ```typescript
  const { data, error } = await supabase.rpc('create_assignment_with_validation', {
    course_id: '...',
    points_weight: 0.3,
    ...
  });
  
  if (error) {
    logger.error('Transaction failed', error);
    return failure(400, 'ASSIGNMENT_WEIGHT_EXCEEDED', '...');
  }
  ```

---

## 7. 개발 환경 설정

### Hono 싱글턴 관리
- **프로덕션**: 싱글턴 캐싱으로 성능 최적화
- **개발**: 매 요청마다 재생성하여 HMR 지원
- **구현**:
  ```typescript
  let cachedApp: Hono | null = null;
  
  export function createHonoApp() {
    if (process.env.NODE_ENV === 'production' && cachedApp) {
      return cachedApp;
    }
    
    const app = new Hono<AppEnv>();
    // ... 미들웨어 및 라우트 등록
    
    if (process.env.NODE_ENV === 'production') {
      cachedApp = app;
    }
    
    return app;
  }
  ```

### 로깅
- **개발**: 콘솔 출력 (colorized)
- **프로덕션**: 구조화된 JSON 로그 (추후 로그 수집 도구 연동 가능)
- **레벨**: `debug`, `info`, `warn`, `error`
- **사용법**: `logger.info('User enrolled', { userId, courseId })`

---

## 8. 테스트 전략

### 백엔드 테스트
- **라우트 통합 테스트**: `app.request()`로 Hono 앱 직접 호출
- **서비스 단위 테스트**: Supabase SDK 목(mock) 처리
- **미들웨어 테스트**: 인증/권한 가드 독립 검증

### 프론트엔드 테스트
- **React Query 훅**: React Testing Library로 목 API 응답 주입
- **폼 검증**: React Hook Form 통합 테스트
- **에러 처리**: 네트워크 에러 시나리오 검증

### E2E 테스트
- **도구**: Playwright (추후 도입)
- **시나리오**: 회원가입 → 코스 수강 → 과제 제출 → 채점 전체 플로우

---

## 9. 보안 정책

### 입력 검증
- **모든 API 입력**: Zod 스키마로 검증 필수
- **SQL 인젝션**: Supabase SDK 사용으로 자동 방지
- **XSS**: React의 자동 이스케이프 + DOMPurify (필요 시)

### 민감 정보 보호
- **환경 변수**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 측에만 노출
- **로그**: 비밀번호, 토큰 등 민감 정보 로깅 금지
- **에러 메시지**: 스택 트레이스는 개발 환경에서만 노출

### CORS
- **설정**: Next.js API 라우트에서 허용 도메인 지정
- **개발**: `localhost:3000` 허용
- **프로덕션**: 실제 도메인만 허용

---

## 10. 성능 최적화

### 쿼리 최적화
- **인덱스**: 자주 필터링/정렬되는 컬럼에 인덱스 생성 (database.md 참조)
- **N+1 방지**: `Promise.all`로 병렬 쿼리, 필요 시 JOIN 사용
- **필드 선택**: `select('id, title, ...')` 형태로 필요한 필드만 조회

### 캐싱
- **React Query**: `staleTime`, `cacheTime` 설정으로 불필요한 재요청 방지
- **서버 캐싱**: 메타데이터(categories, difficulties)는 메모리 캐싱 고려

### 모니터링
- **응답 시간**: 주요 API 엔드포인트 응답 시간 측정
- **에러율**: 5xx 에러 발생 빈도 추적
- **데이터베이스**: 슬로우 쿼리 로그 분석

---

이 문서는 프로젝트 전반에 걸쳐 일관된 API 설계와 구현을 보장하기 위한 가이드라인입니다. 새로운 기능 개발 시 이 정책을 준수하고, 필요 시 팀 논의를 통해 정책을 업데이트하세요.

