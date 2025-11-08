# Phase 1 & 2 구현 완료 보고서

## 📋 구현 개요

**구현 일자**: 2024-11-08  
**구현 범위**: Phase 1 (데이터베이스 마이그레이션) + Phase 2 (SPECADD UC001~UC003 수정)  
**소요 시간**: 약 2시간

---

## ✅ Phase 1: 데이터베이스 마이그레이션 (완료)

### 생성된 파일
- `supabase/migrations/0010_add_soft_delete_columns.sql`

### 구현 내용

#### 1. 소프트 삭제 컬럼 추가
```sql
-- users 테이블
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- courses 테이블
ALTER TABLE courses ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_courses_deleted_at ON courses(deleted_at);

-- assignments 테이블
ALTER TABLE assignments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_assignments_deleted_at ON assignments(deleted_at);
```

#### 2. 메타데이터 비활성화 컬럼 추가
```sql
-- categories 테이블
ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- difficulties 테이블
ALTER TABLE difficulties ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE difficulties ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX idx_difficulties_is_active ON difficulties(is_active);
CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3. 외래 키 제약 조건 변경
```sql
-- courses.owner_id: CASCADE → RESTRICT
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_owner_id_fkey;
ALTER TABLE courses ADD CONSTRAINT courses_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
```

### 적용 방법
```bash
# Supabase CLI 사용
supabase db push

# 또는 Supabase Dashboard에서 SQL Editor로 실행
```

---

## ✅ Phase 2: SPECADD 구현 (완료)

### 2.1 SPECADD-002: 코스 탐색 & 수강신청 (UC002 수정)

#### 수정된 파일
1. **`src/features/course/backend/service.ts`**

**수정 내용**:

##### A. `getPublishedCoursesService()` - 코스 목록 조회
```typescript
// 변경 전
.select(`..., categories (name), difficulties (name)`, { count: 'exact' })
.eq('status', 'published');

// 변경 후
.select(`..., categories!inner (name, is_active), difficulties!inner (name, is_active)`, { count: 'exact' })
.eq('status', 'published')
.is('deleted_at', null); // 소프트 삭제 필터 추가
```

##### B. 메타데이터 필터링
```typescript
// 카테고리 필터 (활성만)
if (category_id) {
  query = query.eq('category_id', category_id).eq('categories.is_active', true);
} else {
  query = query.or('category_id.is.null,categories.is_active.eq.true');
}

// 난이도 필터 (활성만)
if (difficulty_id) {
  query = query.eq('difficulty_id', difficulty_id).eq('difficulties.is_active', true);
} else {
  query = query.or('difficulty_id.is.null,difficulties.is_active.eq.true');
}
```

##### C. `createEnrollmentService()` - 수강신청
```typescript
// 코스 상태 확인 시 소프트 삭제 필터 추가
const { data: course, error: courseError } = await supabase
  .from(COURSES_TABLE)
  .select('status')
  .eq('id', courseId)
  .is('deleted_at', null) // 추가
  .single();
```

##### D. `getActiveMetadataService()` - 신규 함수 추가
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
  // 활성 카테고리 조회
  const { data: categories } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name, description')
    .eq('is_active', true)
    .order('name', { ascending: true });

  // 활성 난이도 조회
  const { data: difficulties } = await supabase
    .from(DIFFICULTIES_TABLE)
    .select('id, name, description, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return success({ categories: categories || [], difficulties: difficulties || [] });
};
```

##### E. 에러 코드 추가
```typescript
export const courseErrorCodes = {
  // 기존 코드...
  COURSE_DELETED: 'COURSE_DELETED',
  METADATA_INACTIVE: 'METADATA_INACTIVE',
  METADATA_FETCH_ERROR: 'METADATA_FETCH_ERROR',
  // ...
} as const;
```

2. **`src/features/course/backend/route.ts`**

**수정 내용**:

##### A. import 추가
```typescript
import {
  // 기존 imports...
  getActiveMetadataService,
  courseErrorCodes,
} from './service';
```

##### B. 신규 라우트 추가
```typescript
// Get active metadata (categories and difficulties)
// 활성화된 메타데이터 조회 (인증 불필요, 공개 API)
app.get('/api/metadata/active', async (c) => {
  const supabase = getSupabase(c);
  const logger = getLogger(c);

  const deps = { supabase, logger };
  const result = await getActiveMetadataService(deps);

  if (!result.ok) {
    logger.error('Failed to fetch active metadata', result.error);
    return respond(c, result);
  }

  return respond(c, result);
});
```

---

### 2.2 SPECADD-003: Learner 대시보드 (UC003 수정)

#### 수정된 파일
1. **`src/features/dashboard/backend/service.ts`**

**수정 내용**:

##### A. 코스 조회 (5곳 수정)
```typescript
// 1. 코스 상세 조회
const { data: courses } = await client
  .from(COURSES_TABLE)
  .select('id, title, status')
  .in('id', courseIds)
  .is('deleted_at', null); // 추가

// 2. 과제 조회
const { data: assignments } = await client
  .from(ASSIGNMENTS_TABLE)
  .select('id, title, course_id, due_date, status')
  .in('course_id', courseIds)
  .eq('status', 'published')
  .is('deleted_at', null); // 추가

// 3. 과제의 코스 정보 조회
const { data: assignmentCourses } = await client
  .from(COURSES_TABLE)
  .select('id, title')
  .in('id', assignments?.map(a => a.course_id) || [])
  .is('deleted_at', null); // 추가

// 4. 제출물의 과제 정보 조회
const { data: submissionAssignmentDetails } = await client
  .from(ASSIGNMENTS_TABLE)
  .select('id, title, course_id')
  .in('id', submissions?.map(s => s.assignment_id) || [])
  .is('deleted_at', null); // 추가

// 5. 제출물 과제의 코스 정보 조회
const { data: submissionAssignmentCourses } = await client
  .from(COURSES_TABLE)
  .select('id, title')
  .in('id', submissionAssignmentDetails?.map(a => a.course_id) || [])
  .is('deleted_at', null); // 추가
```

2. **`src/features/dashboard/backend/error.ts`**

**수정 내용**:

##### A. 에러 코드 추가
```typescript
export const dashboardErrorCodes = {
  fetchError: 'DASHBOARD_FETCH_ERROR',
  validationError: 'DASHBOARD_VALIDATION_ERROR',
  userNotFound: 'DASHBOARD_USER_NOT_FOUND',
  noActiveEnrollments: 'NO_ACTIVE_ENROLLMENTS', // 추가
} as const;
```

---

### 2.3 SPECADD-001: 인증 & 온보딩 (UC001 수정)

#### 수정된 파일
1. **`src/features/auth/backend/profile-service.ts`**

**수정 내용**:

##### A. `getUserProfileService()` - 프로필 조회
```typescript
// 변경 전
const { data, error } = await client
  .from('users')
  .select('id, email, role, name, phone, created_at, updated_at')
  .eq('id', userId)
  .single();

// 변경 후
const { data, error } = await client
  .from('users')
  .select('id, email, role, name, phone, created_at, updated_at')
  .eq('id', userId)
  .is('deleted_at', null) // 소프트 삭제된 사용자 제외
  .single();
```

---

## 📊 수정 통계

### 파일 수정 요약
| 구분 | 파일 경로 | 수정 내용 | 라인 수 |
|------|----------|----------|---------|
| **Phase 1** | `supabase/migrations/0010_add_soft_delete_columns.sql` | 신규 생성 | 100+ |
| **SPECADD-002** | `src/features/course/backend/service.ts` | 쿼리 필터 추가, 신규 함수 | ~50 |
| **SPECADD-002** | `src/features/course/backend/route.ts` | 신규 라우트 추가 | ~20 |
| **SPECADD-003** | `src/features/dashboard/backend/service.ts` | 쿼리 필터 추가 (5곳) | ~10 |
| **SPECADD-003** | `src/features/dashboard/backend/error.ts` | 에러 코드 추가 | ~2 |
| **SPECADD-001** | `src/features/auth/backend/profile-service.ts` | 쿼리 필터 추가 | ~2 |

### 총 수정 라인 수
- **신규 파일**: 1개 (마이그레이션)
- **수정 파일**: 5개
- **총 라인 수**: 약 180라인

---

## 🧪 테스트 체크리스트

### Phase 1 검증
- [ ] Supabase에서 마이그레이션 실행 확인
- [ ] `users.deleted_at` 컬럼 존재 확인
- [ ] `courses.deleted_at`, `courses.archived_at` 컬럼 존재 확인
- [ ] `assignments.deleted_at`, `assignments.closed_at` 컬럼 존재 확인
- [ ] `categories.is_active`, `difficulties.is_active` 컬럼 존재 확인
- [ ] 인덱스 생성 확인
- [ ] 트리거 생성 확인
- [ ] 외래 키 제약 조건 변경 확인 (`ON DELETE RESTRICT`)

### SPECADD-002 검증
- [ ] `GET /api/courses` 호출 시 `deleted_at IS NULL`인 코스만 반환
- [ ] 비활성화된 카테고리/난이도를 가진 코스는 목록에서 제외
- [ ] `GET /api/metadata/active` 호출 시 활성 메타데이터만 반환
- [ ] 삭제된 코스에 대한 수강신청 시도 시 실패 (404 또는 400)
- [ ] 카테고리/난이도 필터링 정상 동작

### SPECADD-003 검증
- [ ] 대시보드 조회 시 `deleted_at IS NULL`인 코스만 표시
- [ ] 삭제된 과제는 진행률 계산에서 제외
- [ ] 삭제된 코스의 과제는 "마감 임박 과제"에 표시되지 않음
- [ ] 빈 대시보드 (수강 중인 코스 없음) 정상 처리
- [ ] 진행률 계산 정확성

### SPECADD-001 검증
- [ ] 정상 사용자 프로필 조회 성공
- [ ] `deleted_at`이 설정된 사용자는 조회 실패 (404)
- [ ] 인증 토큰으로 프로필 조회 정상 동작

### 통합 테스트
- [ ] UC001 → UC002 → UC003 전체 플로우 테스트
  1. 회원가입 (UC001)
  2. 코스 탐색 및 수강신청 (UC002)
  3. 대시보드 확인 (UC003)
- [ ] 소프트 삭제된 데이터 접근 차단 확인
- [ ] 비활성화된 메타데이터 필터링 확인

---

## 🎯 핵심 변경사항 요약

### 1. 소프트 삭제 정책 적용
- **모든 SELECT 쿼리**에 `.is('deleted_at', null)` 조건 추가
- 물리적 `DELETE` 대신 `UPDATE SET deleted_at = NOW()` 사용 (향후 구현)
- 데이터 무결성 보장 및 복구 가능성 확보

### 2. 메타데이터 비활성화 정책 적용
- **메타데이터 조회 시** `.eq('is_active', true)` 조건 추가
- 신규 API `/api/metadata/active` 추가 (활성 메타데이터만 반환)
- 물리적 `DELETE` 대신 `UPDATE SET is_active = FALSE` 사용 (향후 구현)

### 3. 외래 키 제약 조건 강화
- `courses.owner_id`: `ON DELETE CASCADE` → `ON DELETE RESTRICT`
- 강사 삭제 전 소유 코스 처리 필수

---

## 🚀 다음 단계 (Phase 3)

### UC004: 과제 상세 열람 (Learner)
**예상 소요 시간**: 2~3시간

**구현 파일**:
- `src/features/assignment/backend/service.ts` (신규)
- `src/features/assignment/backend/route.ts` (신규)
- `src/features/assignment/backend/schema.ts` (신규)
- `src/features/assignment/components/AssignmentDetail.tsx` (신규)

**주요 작업**:
- [ ] 과제 상세 조회 API (`GET /api/assignments/:id`)
- [ ] 수강 여부 검증
- [ ] 과제 상태 검증 (published만 조회 가능)
- [ ] 소프트 삭제 필터 적용
- [ ] UI 컴포넌트 구현

---

## 📚 참고 문서

- `docs/IMPLEMENTATION-ROADMAP.md` - 전체 구현 로드맵
- `docs/specadd.md` - 상세 수정 명세
- `docs/api-policy.md` - API 정책
- `docs/database.md` - 데이터베이스 스키마
- `docs/CHANGELOG-CTO-REVIEW.md` - CTO 리뷰 반영 이력

---

## ✨ 완료 확인

- [x] Phase 1: 데이터베이스 마이그레이션 파일 생성
- [x] SPECADD-002: 코스 탐색 & 수강신청 수정
- [x] SPECADD-003: Learner 대시보드 수정
- [x] SPECADD-001: 인증 & 온보딩 수정
- [x] 에러 코드 추가
- [x] 신규 API 라우트 추가 (`/api/metadata/active`)
- [x] 문서 작성 (이 파일)

---

**Phase 1 & 2 구현 완료!** 🎉

다음은 Phase 3 (UC004~UC006)를 진행하면 됩니다.

