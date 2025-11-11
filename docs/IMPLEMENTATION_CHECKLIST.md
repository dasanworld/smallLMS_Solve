# 학습자 코스 시스템 구현 체크리스트

## ✅ 완료된 항목

### 1. 프론트엔드 구현

- [x] **페이지 분리**
  - [x] `/courses` → 강사 전용 (기존 유지)
  - [x] `/explore-courses` → 학습자 전용 (기존 페이지)

- [x] **학습자 컴포넌트**
  - [x] `LearnerCoursesCatalog.tsx` 완전 재작성
    - [x] 공개 코스 목록 표시
    - [x] 코스 카드 UI (카테고리, 난이도, 강사명)
    - [x] 찜하기 기능
    - [x] 수강신청 버튼
    - [x] 페이지네이션
    - [x] 로딩/에러 상태

- [x] **학습자 훅**
  - [x] `useLearnerCourseQueries.ts` 생성
    - [x] `useAvailableCoursesQuery()` - 공개 코스 목록
    - [x] `useEnrolledCoursesQuery()` - 수강신청한 코스
    - [x] `useEnrollCourseMutation()` - 수강신청
    - [x] `useUnenrollCourseMutation()` - 수강신청 취소

- [x] **학습자 스키마**
  - [x] `learner-schema.ts` 생성
    - [x] `LearnerCourse` 타입
    - [x] `AvailableCoursesResponse` 타입
    - [x] `EnrollmentRequest/Response` 타입

---

### 2. 백엔드 구현

- [x] **학습자 API 라우트**
  - [x] `learner-route.ts` 생성
    - [x] GET `/api/learner/courses/available` - 공개 코스 목록
    - [x] GET `/api/learner/courses/enrolled` - 수강신청한 코스
    - [x] POST `/api/learner/courses/{courseId}/enroll` - 수강신청
    - [x] DELETE `/api/learner/courses/{courseId}/enroll` - 수강신청 취소

- [x] **학습자 비즈니스 로직**
  - [x] `learner-service.ts` 생성
    - [x] `getAvailableCoursesService()` 구현
    - [x] `getEnrolledCoursesService()` 구현
    - [x] `enrollCourseService()` 구현
    - [x] `unenrollCourseService()` 구현

- [x] **Hono 앱 통합**
  - [x] `app.ts`에 학습자 라우트 등록
  - [x] 빌드 성공 (타입 에러 없음)

---

### 3. 데이터베이스

- [x] **마이그레이션 파일 생성**
  - [x] `0014_add_is_active_to_metadata.sql`
    - [x] categories 테이블에 `is_active` 컬럼 추가
    - [x] categories 테이블에 `updated_at` 컬럼 추가
    - [x] difficulties 테이블에 `is_active` 컬럼 추가
    - [x] difficulties 테이블에 `updated_at` 컬럼 추가

  - [x] `0015_optimize_learner_queries.sql`
    - [x] 복합 인덱스: `idx_courses_published_active`
    - [x] 복합 인덱스: `idx_enrollments_user_status`
    - [x] 복합 인덱스: `idx_enrollments_course_status`
    - [x] 성능 인덱스들

---

### 4. 테스트

- [x] **API 테스트 스크립트**
  - [x] `scripts/test-learner-api.sh` 생성
    - [x] 공개 코스 목록 조회 테스트
    - [x] 페이지네이션 테스트
    - [x] 수강신청 테스트
    - [x] 수강신청 취소 테스트
    - [x] 인증 테스트

- [x] **E2E 테스트 작성**
  - [x] `tests/e2e/learner-courses.spec.ts` 생성
    - [x] 공개 코스 목록 조회 테스트
    - [x] 코스 카드 필수 정보 테스트
    - [x] 코스 수강신청 테스트
    - [x] 페이지네이션 테스트
    - [x] 찜하기 기능 테스트
    - [x] API 엔드포인트 테스트

---

### 5. 문서화

- [x] **마이그레이션 가이드**
  - [x] `docs/MIGRATION_GUIDE.md` 작성

- [x] **구현 가이드**
  - [x] `docs/LEARNER_COURSES_IMPLEMENTATION.md` 작성

- [x] **체크리스트 (이 파일)**
  - [x] `docs/IMPLEMENTATION_CHECKLIST.md` 작성

---

## ⬜ 수행해야 할 단계 (순서대로)

### 1단계: 데이터베이스 마이그레이션 (🔴 필수)

**시간**: ~5분

```bash
# Supabase CLI 사용 (권장)
supabase db push

# 또는 Supabase 웹UI
# 1. https://app.supabase.com 접속
# 2. SQL Editor에서 마이그레이션 파일 실행
```

**마이그레이션 파일:**
- `supabase/migrations/0014_add_is_active_to_metadata.sql`
- `supabase/migrations/0015_optimize_learner_queries.sql`

**확인:**
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM categories LIMIT 1;
-- ✅ is_active, updated_at 컬럼이 있는지 확인
```

---

### 2단계: API 테스트 (🟢 추천)

**시간**: ~10분

```bash
# 공개 코스 목록 조회 테스트
./scripts/test-learner-api.sh

# 또는 curl로 수동 테스트
curl "http://localhost:3000/api/learner/courses/available?page=1&pageSize=10"
```

**확인 사항:**
- ✅ 200 OK 응답
- ✅ 코스 목록 반환
- ✅ 페이지네이션 메타데이터

---

### 3단계: E2E 테스트 실행 (🟢 추천)

**시간**: ~15분

```bash
# 전체 E2E 테스트 실행
npm run test:e2e -- learner-courses.spec.ts

# 또는 라이브 UI 모드
npm run test:e2e -- --ui
```

**테스트 항목:**
- ✅ 공개 코스 목록 조회
- ✅ 코스 카드 정보 표시
- ✅ 수강신청 기능
- ✅ 페이지네이션
- ✅ 찜하기 기능

---

### 4단계: 성능 모니터링 (🟡 선택)

**시간**: ~10분

```bash
# 데이터베이스 성능 확인
# Supabase 대시보드 → Database → Monitor

# 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM courses
WHERE status = 'published' AND deleted_at IS NULL
ORDER BY published_at DESC LIMIT 10;

# 예상 결과: "Index Scan using idx_courses_published_active"
```

---

### 5단계: 프로덕션 배포 (🔴 필수)

**시간**: ~15분

```bash
# 1. 빌드 확인
npm run build

# 2. 변경사항 커밋
git add .
git commit -m "feat: Implement learner course system with complete separation"

# 3. 배포
# (프로젝트의 배포 프로세스에 따름)
```

---

## 📊 구현 상태 요약

| 항목 | 상태 | 완료도 | 비고 |
|------|------|--------|------|
| **프론트엔드** | ✅ 완료 | 100% | 페이지 분리 완료 |
| **백엔드** | ✅ 완료 | 100% | 4개 API 엔드포인트 |
| **데이터베이스** | ⬜ 준비됨 | 0% | 마이그레이션 대기 |
| **테스트** | ✅ 준비됨 | 100% | 테스트 코드 작성 완료 |
| **문서** | ✅ 완료 | 100% | 3개 가이드 문서 |
| **전체** | ⏳ 진행 중 | 85% | 마이그레이션 후 완료 |

---

## 🚀 다음 단계

1. **즉시 (필수)**
   - [ ] 데이터베이스 마이그레이션 적용
   - [ ] API 테스트 실행

2. **금일 중**
   - [ ] E2E 테스트 실행
   - [ ] 성능 확인

3. **내일**
   - [ ] 프로덕션 배포
   - [ ] 라이브 모니터링

---

## 📚 참고 문서

- [학습자 코스 구현 가이드](./LEARNER_COURSES_IMPLEMENTATION.md)
- [마이그레이션 적용 가이드](./MIGRATION_GUIDE.md)
- [API 명세](./LEARNER_COURSES_IMPLEMENTATION.md#api-명세)

---

## 🎯 성공 기준

- ✅ `/explore-courses` 페이지에서 공개 코스 목록 표시됨
- ✅ 로그인한 학습자가 코스 수강신청 가능
- ✅ `/courses`는 강사만 접근 가능
- ✅ API 응답 시간 < 100ms
- ✅ 데이터베이스 마이그레이션 성공

---

**작성일**: 2024년 11월
**상태**: 구현 완료, 마이그레이션 대기 ⏳
