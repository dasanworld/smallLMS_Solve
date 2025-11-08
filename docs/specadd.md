# SPECADD: UC001~UC003 소프트 삭제 및 메타데이터 정책 반영

## 문서 목적
CTO 리뷰 반영으로 인해 UC001~UC003의 기존 구현에 **소프트 삭제(Soft Delete)** 및 **메타데이터 비활성화 정책**을 추가합니다. 이 문서는 UC004~UC012 구현 전에 선행되어야 할 수정사항을 명세합니다.

---

## 선행 조건 (Prerequisites)

### 1. 데이터베이스 마이그레이션 완료 필수
다음 마이그레이션이 **반드시 먼저** 실행되어야 합니다:

```sql
-- 파일: supabase/migrations/0010_add_soft_delete_columns.sql

-- 1. users 테이블에 deleted_at 추가
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- 2. courses 테이블에 deleted_at, archived_at 추가
ALTER TABLE courses ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_courses_deleted_at ON courses(deleted_at);

-- 3. assignments 테이블에 deleted_at, closed_at 추가
ALTER TABLE assignments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_assignments_deleted_at ON assignments(deleted_at);

-- 4. categories 테이블에 is_active 추가
ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- 5. difficulties 테이블에 is_active 추가
ALTER TABLE difficulties ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE difficulties ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX idx_difficulties_is_active ON difficulties(is_active);

-- 6. courses 외래 키 제약 조건 변경 (CASCADE → RESTRICT)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_owner_id_fkey;
ALTER TABLE courses ADD CONSTRAINT courses_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

-- 7. 트리거 추가 (updated_at 자동 갱신)
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## SPECADD-001: 인증 및 온보딩 (UC001 수정)

### 영향받는 파일
- `src/features/auth/backend/service.ts`
- `src/features/auth/backend/profile-service.ts`

### 수정 사항

#### 1. 사용자 프로필 조회 시 소프트 삭제 필터 추가

**파일**: `src/features/auth/backend/profile-service.ts`

**현재 코드**:
```typescript
export const getUserProfileService = async (
  deps: ProfileServiceDependencies,
  userId: string
): Promise<HandlerResult<UserProfile, ProfileServiceError, unknown>> => {
  const { supabase, logger } = deps;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, name, phone, created_at, updated_at')
    .eq('id', userId)
    .single();

  // ... 나머지 로직
};
```

**수정 후**:
```typescript
export const getUserProfileService = async (
  deps: ProfileServiceDependencies,
  userId: string
): Promise<HandlerResult<UserProfile, ProfileServiceError, unknown>> => {
  const { supabase, logger } = deps;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, name, phone, created_at, updated_at')
    .eq('id', userId)
    .is('deleted_at', null)  // ← 소프트 삭제 필터 추가
    .single();

  // ... 나머지 로직
};
```

#### 2. 회원가입 로직은 수정 불필요
- `createUserProfile` 함수는 `INSERT` 작업이므로 수정 불필요
- `deleted_at`은 기본값 `NULL`로 자동 설정됨

### 테스트 케이스
- [ ] 정상 사용자 프로필 조회 성공
- [ ] `deleted_at`이 설정된 사용자는 조회 실패 (404 또는 UNAUTHORIZED)

---

## SPECADD-002: 코스 탐색 및 수강신청 (UC002 수정)

### 영향받는 파일
- `src/features/course/backend/service.ts`
- `src/features/course/backend/route.ts` (신규 엔드포인트 추가)

### 수정 사항

#### 1. 코스 목록 조회 시 소프트 삭제 및 메타데이터 필터 추가

**파일**: `src/features/course/backend/service.ts`

**함수**: `getPublishedCoursesService`

**현재 코드** (대략 50~80라인):
```typescript
export const getPublishedCoursesService = async (
  deps: CourseServiceDependencies,
  options: GetPublishedCoursesOptions = {}
): Promise<HandlerResult<...>> => {
  const { supabase, logger } = deps;
  const { search, category_id, difficulty_id, sort = 'newest', page = 1, limit = 10 } = options;

  try {
    let query = supabase
      .from(COURSES_TABLE)
      .select(`
        *,
        categories (id, name, description),
        difficulties (id, name, description)
      `, { count: 'exact' })
      .eq('status', 'published');

    // 검색 조건 추가
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    if (difficulty_id) {
      query = query.eq('difficulty_id', difficulty_id);
    }

    // ... 나머지 로직
  } catch (error) {
    // ... 에러 처리
  }
};
```

**수정 후**:
```typescript
export const getPublishedCoursesService = async (
  deps: CourseServiceDependencies,
  options: GetPublishedCoursesOptions = {}
): Promise<HandlerResult<...>> => {
  const { supabase, logger } = deps;
  const { search, category_id, difficulty_id, sort = 'newest', page = 1, limit = 10 } = options;

  try {
    let query = supabase
      .from(COURSES_TABLE)
      .select(`
        *,
        categories!inner (id, name, description),
        difficulties!inner (id, name, description)
      `, { count: 'exact' })
      .eq('status', 'published')
      .is('deleted_at', null);  // ← 코스 소프트 삭제 필터 추가

    // 검색 조건 추가
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category_id) {
      query = query
        .eq('category_id', category_id)
        .eq('categories.is_active', true);  // ← 활성 카테고리만
    }
    if (difficulty_id) {
      query = query
        .eq('difficulty_id', difficulty_id)
        .eq('difficulties.is_active', true);  // ← 활성 난이도만
    }

    // 메타데이터가 비활성화된 코스 필터링
    // (category_id나 difficulty_id가 지정되지 않은 경우에도 적용)
    if (!category_id) {
      query = query.or('category_id.is.null,categories.is_active.eq.true');
    }
    if (!difficulty_id) {
      query = query.or('difficulty_id.is.null,difficulties.is_active.eq.true');
    }

    // ... 나머지 로직 (정렬, 페이지네이션 등)
  } catch (error) {
    // ... 에러 처리
  }
};
```

#### 2. 코스 상세 조회 시 소프트 삭제 필터 추가

**파일**: `src/features/course/backend/service.ts`

**함수**: `getCourseByIdService` (존재한다면)

**수정 내용**:
```typescript
const { data: course, error } = await supabase
  .from(COURSES_TABLE)
  .select(`
    *,
    categories (id, name, description),
    difficulties (id, name, description)
  `)
  .eq('id', courseId)
  .is('deleted_at', null)  // ← 추가
  .single();
```

#### 3. 활성 메타데이터 조회 API 신규 추가

**파일**: `src/features/course/backend/service.ts` (신규 함수 추가)

```typescript
/**
 * 활성화된 카테고리와 난이도 목록을 조회합니다.
 * 코스 생성/수정 UI에서 사용됩니다.
 */
export const getActiveMetadataService = async (
  deps: CourseServiceDependencies
): Promise<HandlerResult<{
  categories: Array<{ id: number; name: string; description: string | null }>;
  difficulties: Array<{ id: number; name: string; description: string | null; sort_order: number }>;
}, string, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 활성 카테고리 조회
    const { data: categories, error: categoriesError } = await supabase
      .from(CATEGORIES_TABLE)
      .select('id, name, description')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (categoriesError) {
      logger.error('Failed to fetch active categories', categoriesError);
      return failure(500, 'METADATA_FETCH_ERROR', 'Failed to fetch categories');
    }

    // 활성 난이도 조회
    const { data: difficulties, error: difficultiesError } = await supabase
      .from(DIFFICULTIES_TABLE)
      .select('id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (difficultiesError) {
      logger.error('Failed to fetch active difficulties', difficultiesError);
      return failure(500, 'METADATA_FETCH_ERROR', 'Failed to fetch difficulties');
    }

    return success(200, {
      categories: categories || [],
      difficulties: difficulties || [],
    });
  } catch (error) {
    logger.error('Unexpected error fetching metadata', error);
    return failure(500, 'INTERNAL_SERVER_ERROR', 'Unexpected error');
  }
};
```

**파일**: `src/features/course/backend/route.ts` (신규 라우트 추가)

```typescript
import { getActiveMetadataService } from './service';

// 기존 라우트들...

// 활성 메타데이터 조회 (인증 불필요, 공개 API)
app.get('/api/metadata/active', async (c) => {
  const supabase = getSupabase(c);
  const logger = getLogger(c);

  const result = await getActiveMetadataService({ supabase, logger });

  if (!result.success) {
    return c.json(result, result.statusCode || 500);
  }

  return c.json(result, 200);
});
```

#### 4. 수강신청 로직은 수정 불필요
- `createEnrollmentService` 함수는 `INSERT` 작업이므로 수정 불필요
- 단, 수강신청 전 코스 상태 검증 시 `deleted_at` 확인 필요 (이미 `status='published'` 검증에서 간접적으로 처리됨)

### 테스트 케이스
- [ ] 공개된 코스 목록 조회 시 `deleted_at`이 NULL인 코스만 반환
- [ ] 비활성화된 카테고리/난이도를 가진 코스는 목록에서 제외
- [ ] `/api/metadata/active` 호출 시 활성 메타데이터만 반환
- [ ] 삭제된 코스에 대한 수강신청 시도 시 실패

---

## SPECADD-003: Learner 대시보드 (UC003 수정)

### 영향받는 파일
- `src/features/dashboard/backend/service.ts`

### 수정 사항

#### 1. 대시보드 데이터 조회 시 소프트 삭제 필터 추가

**파일**: `src/features/dashboard/backend/service.ts`

**함수**: `getLearnerDashboardService`

**현재 코드** (대략 44~100라인):
```typescript
export const getLearnerDashboardService = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<LearnerDashboardResponse, DashboardServiceError, unknown>> => {
  // 1. Get enrolled active courses
  const { data: enrollments, error: enrollmentsError } = await client
    .from(ENROLLMENTS_TABLE)
    .select(`
      id,
      enrolled_at,
      courses (
        id,
        title,
        description,
        status
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  // ... 나머지 로직
  
  // 2. For each course, get assignments
  const { data: assignments, error: assignmentsError } = await client
    .from(ASSIGNMENTS_TABLE)
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'published');

  // ... 나머지 로직
};
```

**수정 후**:
```typescript
export const getLearnerDashboardService = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<LearnerDashboardResponse, DashboardServiceError, unknown>> => {
  // 1. Get enrolled active courses (소프트 삭제 필터 추가)
  const { data: enrollments, error: enrollmentsError } = await client
    .from(ENROLLMENTS_TABLE)
    .select(`
      id,
      enrolled_at,
      courses!inner (
        id,
        title,
        description,
        status
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('courses.deleted_at', null);  // ← 코스 소프트 삭제 필터 추가

  if (enrollmentsError) {
    // ... 에러 처리
  }

  // enrollments가 null이거나 빈 배열인 경우 처리
  if (!enrollments || enrollments.length === 0) {
    return success(200, {
      enrolledCourses: [],
      upcomingAssignments: [],
      recentFeedback: [],
    });
  }

  // 2. For each course, get assignments (소프트 삭제 필터 추가)
  const courseIds = enrollments
    .map((e) => e.courses)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => c.id);

  const { data: assignments, error: assignmentsError } = await client
    .from(ASSIGNMENTS_TABLE)
    .select('*')
    .in('course_id', courseIds)
    .eq('status', 'published')
    .is('deleted_at', null);  // ← 과제 소프트 삭제 필터 추가

  // ... 나머지 로직

  // 3. Get submissions for graded assignments (제출물 조회)
  const { data: submissions, error: submissionsError } = await client
    .from(SUBMISSIONS_TABLE)
    .select('assignment_id, status, score, feedback, graded_at')
    .eq('user_id', userId)
    .in('assignment_id', assignmentIds);

  // ... 나머지 로직 (진행률 계산, 마감 임박 과제, 최근 피드백)
};
```

#### 2. 진행률 계산 로직 수정 불필요
- `calculateCourseProgress` 함수는 이미 필터링된 데이터를 기반으로 계산하므로 수정 불필요

### 테스트 케이스
- [ ] 수강 중인 코스 중 `deleted_at`이 설정된 코스는 대시보드에서 제외
- [ ] 삭제된 과제는 진행률 계산에서 제외
- [ ] 삭제된 코스의 과제는 "마감 임박 과제"에 표시되지 않음
- [ ] 빈 대시보드 (수강 중인 코스 없음) 정상 처리

---

## 구현 순서 (Implementation Order)

### Phase 1: 데이터베이스 준비 (필수 선행)
1. [ ] 마이그레이션 파일 작성 (`0010_add_soft_delete_columns.sql`)
2. [ ] Supabase에 마이그레이션 적용
3. [ ] 데이터베이스 스키마 검증 (컬럼, 인덱스, 제약 조건 확인)

### Phase 2: SPECADD 구현 (순서대로)
1. [ ] **SPECADD-002 먼저 구현** (코스 탐색 - 영향도 가장 큼)
   - [ ] `getPublishedCoursesService` 수정
   - [ ] `getCourseByIdService` 수정 (존재 시)
   - [ ] `getActiveMetadataService` 신규 추가
   - [ ] `/api/metadata/active` 라우트 추가
   - [ ] 테스트

2. [ ] **SPECADD-003 구현** (대시보드)
   - [ ] `getLearnerDashboardService` 수정
   - [ ] 테스트

3. [ ] **SPECADD-001 구현** (인증 - 영향도 가장 적음)
   - [ ] `getUserProfileService` 수정
   - [ ] 테스트

### Phase 3: 통합 테스트
1. [ ] UC001 → UC002 → UC003 전체 플로우 테스트
2. [ ] 소프트 삭제된 데이터 접근 차단 확인
3. [ ] 비활성화된 메타데이터 필터링 확인

### Phase 4: UC004~UC012 구현 시작
- SPECADD 완료 후 UC004부터 순차적으로 구현
- 모든 신규 기능은 처음부터 소프트 삭제/메타데이터 정책 준수

---

## 에러 코드 추가

각 기능의 `error.ts` 파일에 다음 에러 코드를 추가합니다:

### `src/features/course/backend/error.ts`
```typescript
export const courseErrorCodes = {
  // 기존 에러 코드들...
  COURSE_DELETED: 'COURSE_DELETED',
  METADATA_INACTIVE: 'METADATA_INACTIVE',
  METADATA_FETCH_ERROR: 'METADATA_FETCH_ERROR',
} as const;
```

### `src/features/dashboard/backend/error.ts`
```typescript
export const dashboardErrorCodes = {
  // 기존 에러 코드들...
  NO_ACTIVE_ENROLLMENTS: 'NO_ACTIVE_ENROLLMENTS',
} as const;
```

---

## 프론트엔드 수정 사항 (선택적)

### 메타데이터 선택 UI 업데이트

**파일**: `src/features/course/components/CourseFilters.tsx` (예시)

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const CourseFilters = () => {
  // 활성 메타데이터 조회
  const { data: metadata } = useQuery({
    queryKey: ['metadata', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/api/metadata/active');
      return response.data.data;
    },
  });

  return (
    <div>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          {metadata?.categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 난이도 선택도 동일하게 */}
    </div>
  );
};
```

---

## 검증 체크리스트

### 데이터베이스 검증
- [ ] `users.deleted_at` 컬럼 존재 및 인덱스 확인
- [ ] `courses.deleted_at`, `courses.archived_at` 컬럼 존재 및 인덱스 확인
- [ ] `assignments.deleted_at`, `assignments.closed_at` 컬럼 존재 및 인덱스 확인
- [ ] `categories.is_active`, `difficulties.is_active` 컬럼 존재 및 인덱스 확인
- [ ] `courses.owner_id` 외래 키가 `ON DELETE RESTRICT`로 변경됨 확인

### 백엔드 검증
- [ ] 모든 코스 조회 쿼리에 `deleted_at IS NULL` 필터 적용
- [ ] 모든 과제 조회 쿼리에 `deleted_at IS NULL` 필터 적용
- [ ] 메타데이터 조회 시 `is_active = TRUE` 필터 적용
- [ ] `/api/metadata/active` 엔드포인트 정상 동작

### 프론트엔드 검증 (선택적)
- [ ] 카테고리/난이도 선택 UI에서 활성 메타데이터만 표시
- [ ] 삭제된 코스 접근 시 적절한 에러 메시지 표시

---

## 참고 문서

- **CTO 리뷰 반영 이력**: `docs/CHANGELOG-CTO-REVIEW.md`
- **API 정책**: `docs/api-policy.md`
- **데이터베이스 설계**: `docs/database.md`
- **사용자 플로우**: `docs/userflow.md`
- **리팩토링 계획**: `refactoring-plan.md`

---

## 주의사항

### ⚠️ CRITICAL
1. **데이터베이스 마이그레이션을 먼저 실행**하지 않으면 모든 쿼리가 실패합니다.
2. **외래 키 제약 조건 변경** (`ON DELETE CASCADE` → `RESTRICT`)은 기존 데이터에 영향을 주지 않지만, 향후 사용자 삭제 시 에러가 발생할 수 있습니다. 이는 의도된 동작입니다.
3. **메타데이터 비활성화**는 물리적 삭제가 아니므로, 기존 코스/과제는 비활성화된 메타데이터를 계속 참조할 수 있습니다.

### 💡 TIP
- 개발 환경에서 먼저 테스트한 후 프로덕션에 적용하세요.
- 마이그레이션 전 데이터베이스 백업을 권장합니다.
- 각 SPECADD 구현 후 즉시 테스트하여 문제를 조기에 발견하세요.

---

**이 문서를 완료한 후 UC004~UC012를 순차적으로 구현하면, 모든 기능이 CTO 리뷰 요구사항을 충족하게 됩니다.**

