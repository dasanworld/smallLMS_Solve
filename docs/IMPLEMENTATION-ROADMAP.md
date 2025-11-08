# LMS 프로젝트 구현 로드맵

## 📋 전체 개요

이 문서는 CTO 리뷰 반영 후 전체 LMS 프로젝트의 구현 순서를 정리합니다.

---

## 🎯 구현 단계

### Phase 0: 문서 검토 ✅ (완료)
- [x] CTO 리뷰 반영 (`docs/CHANGELOG-CTO-REVIEW.md`)
- [x] API 정책 문서 작성 (`docs/api-policy.md`)
- [x] 데이터베이스 스키마 업데이트 (`docs/database.md`)
- [x] 사용자 플로우 업데이트 (`docs/userflow.md`)
- [x] 기능별 명세 업데이트 (`docs/004~012/spec.md`)

---

### Phase 1: 데이터베이스 마이그레이션 (필수 선행) 🔴
**예상 소요 시간**: 30분

#### 작업 내용
```bash
# 마이그레이션 파일 생성
supabase/migrations/0010_add_soft_delete_columns.sql
```

#### 체크리스트
- [ ] 마이그레이션 파일 작성 완료
- [ ] Supabase에 마이그레이션 적용
- [ ] 데이터베이스 스키마 검증
  - [ ] `users.deleted_at` 컬럼 및 인덱스
  - [ ] `courses.deleted_at`, `courses.archived_at` 컬럼 및 인덱스
  - [ ] `assignments.deleted_at`, `assignments.closed_at` 컬럼 및 인덱스
  - [ ] `categories.is_active`, `difficulties.is_active` 컬럼 및 인덱스
  - [ ] `courses.owner_id` 외래 키 제약 조건 변경 확인

#### 참고 문서
- `docs/specadd.md` - 마이그레이션 SQL 전체 코드
- `docs/database.md` - 최종 스키마 명세

---

### Phase 2: SPECADD 구현 (UC001~UC003 수정) 🟡
**예상 소요 시간**: 2~3시간

#### 2.1 SPECADD-002: 코스 탐색 & 수강신청 (UC002 수정)
**우선순위**: 최고 (영향도 가장 큼)

**수정 파일**:
- `src/features/course/backend/service.ts`
  - `getPublishedCoursesService()` 수정
  - `getCourseByIdService()` 수정 (존재 시)
  - `getActiveMetadataService()` 신규 추가
- `src/features/course/backend/route.ts`
  - `GET /api/metadata/active` 라우트 추가

**체크리스트**:
- [ ] 코스 조회 쿼리에 `deleted_at IS NULL` 추가
- [ ] 메타데이터 조회에 `is_active = TRUE` 필터 추가
- [ ] 활성 메타데이터 조회 API 구현
- [ ] 테스트 완료

#### 2.2 SPECADD-003: Learner 대시보드 (UC003 수정)
**우선순위**: 높음

**수정 파일**:
- `src/features/dashboard/backend/service.ts`
  - `getLearnerDashboardService()` 수정

**체크리스트**:
- [ ] enrollments 조회에 `courses.deleted_at IS NULL` 추가
- [ ] assignments 조회에 `deleted_at IS NULL` 추가
- [ ] 빈 대시보드 케이스 처리
- [ ] 테스트 완료

#### 2.3 SPECADD-001: 인증 & 온보딩 (UC001 수정)
**우선순위**: 중간 (영향도 가장 적음)

**수정 파일**:
- `src/features/auth/backend/profile-service.ts`
  - `getUserProfileService()` 수정

**체크리스트**:
- [ ] 사용자 프로필 조회에 `deleted_at IS NULL` 추가
- [ ] 테스트 완료

#### 통합 테스트
- [ ] UC001 → UC002 → UC003 전체 플로우 테스트
- [ ] 소프트 삭제된 데이터 접근 차단 확인
- [ ] 비활성화된 메타데이터 필터링 확인

#### 참고 문서
- `docs/specadd.md` - 상세 수정 명세

---

### Phase 3: UC004~UC006 구현 (Learner 기능) 🟢
**예상 소요 시간**: 6~8시간

#### UC004: 과제 상세 열람 (Learner)
**참고 문서**: `docs/004/spec.md`

**구현 파일**:
- `src/features/assignment/backend/service.ts` (신규)
- `src/features/assignment/backend/route.ts` (신규)
- `src/features/assignment/backend/schema.ts` (신규)
- `src/features/assignment/components/AssignmentDetail.tsx` (신규)

**체크리스트**:
- [ ] 과제 상세 조회 API (`GET /api/assignments/:id`)
- [ ] 수강 여부 검증
- [ ] 과제 상태 검증 (published만 조회 가능)
- [ ] 소프트 삭제 필터 적용
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

#### UC005: 과제 제출/재제출 (Learner)
**참고 문서**: `docs/005/spec.md`

**구현 파일**:
- `src/features/assignment/backend/service.ts` (submission 관련 추가)
- `src/features/assignment/backend/route.ts` (제출 라우트 추가)
- `src/features/assignment/components/SubmissionForm.tsx` (신규)

**체크리스트**:
- [ ] 과제 제출 API (`POST /api/assignments/:id/submit`)
- [ ] 마감일 검증 (지각 허용 정책)
- [ ] 재제출 검증 (resubmission_required 상태만)
- [ ] 입력 검증 (text 필수, link URL 형식)
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

#### UC006: 성적 & 피드백 열람 (Learner)
**참고 문서**: `docs/006/spec.md`

**구현 파일**:
- `src/features/grade/backend/service.ts` (신규)
- `src/features/grade/backend/route.ts` (신규)
- `src/features/grade/components/GradeList.tsx` (신규)

**체크리스트**:
- [ ] 성적 조회 API (`GET /api/grades`)
- [ ] 본인 제출물만 조회 (user_id 필터)
- [ ] 코스별 총점 계산 (과제 점수 × 비중)
- [ ] 페이지네이션 지원
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

---

### Phase 4: UC007~UC009 구현 (Instructor 기능 - 기본) 🟢
**예상 소요 시간**: 8~10시간

#### UC007: Instructor 대시보드
**참고 문서**: `docs/007/spec.md`

**구현 파일**:
- `src/features/instructor/backend/service.ts` (신규)
- `src/features/instructor/backend/route.ts` (신규)
- `src/features/instructor/components/InstructorDashboard.tsx` (신규)

**체크리스트**:
- [ ] 강사 대시보드 API (`GET /api/instructor/dashboard`)
- [ ] 내 코스 목록 (소유자 필터)
- [ ] 채점 대기 수 계산
- [ ] 최근 제출물 조회
- [ ] 소프트 삭제 필터 적용
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

#### UC008: 코스 관리 (Instructor)
**참고 문서**: `docs/008/spec.md`

**구현 파일**:
- `src/features/course/backend/service.ts` (instructor 관련 추가)
- `src/features/course/backend/route.ts` (CRUD 라우트 추가)
- `src/features/course/components/CourseForm.tsx` (신규)

**체크리스트**:
- [ ] 코스 생성 API (`POST /api/courses`)
- [ ] 코스 수정 API (`PUT /api/courses/:id`)
- [ ] 코스 상태 전환 API (`PATCH /api/courses/:id/status`)
  - [ ] draft → published (published_at 기록)
  - [ ] published → archived (archived_at 기록, 과제 자동 closed)
- [ ] 코스 삭제 API (`DELETE /api/courses/:id` - 소프트 삭제)
- [ ] 소유자 검증
- [ ] 활성 메타데이터만 선택 가능
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

#### UC009: 과제 관리 (Instructor)
**참고 문서**: `docs/009/spec.md`

**구현 파일**:
- `src/features/assignment/backend/service.ts` (instructor 관련 추가)
- `src/features/assignment/backend/route.ts` (CRUD 라우트 추가)
- `src/features/assignment/components/AssignmentForm.tsx` (신규)

**체크리스트**:
- [ ] 과제 생성 API (`POST /api/assignments`)
  - [ ] **트랜잭션 내 가중치 검증** (CRITICAL)
- [ ] 과제 수정 API (`PUT /api/assignments/:id`)
  - [ ] **트랜잭션 내 가중치 검증** (CRITICAL)
- [ ] 과제 상태 전환 API (`PATCH /api/assignments/:id/status`)
  - [ ] draft → published (published_at 기록)
  - [ ] published → closed (closed_at 기록)
- [ ] 과제 삭제 API (`DELETE /api/assignments/:id` - 소프트 삭제)
- [ ] 소유자 검증 (코스 owner_id)
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

---

### Phase 5: UC010~UC011 구현 (Instructor 기능 - 고급) 🟢
**예상 소요 시간**: 6~8시간

#### UC010: 제출물 채점 & 피드백 (Instructor)
**참고 문서**: `docs/010/spec.md`

**구현 파일**:
- `src/features/assignment/backend/service.ts` (grading 관련 추가)
- `src/features/assignment/backend/route.ts` (채점 라우트 추가)
- `src/features/assignment/components/GradingForm.tsx` (신규)

**체크리스트**:
- [ ] 제출물 목록 조회 API (`GET /api/assignments/:id/submissions`)
  - [ ] 필터링 (미채점/지각/재제출요청)
- [ ] 제출물 채점 API (`POST /api/submissions/:id/grade`)
  - [ ] 점수 검증 (0~100)
  - [ ] 피드백 필수
  - [ ] 트랜잭션 내 처리
- [ ] 재제출 요청 API (`POST /api/submissions/:id/request-resubmission`)
  - [ ] 상태를 `resubmission_required`로 변경
- [ ] 소유자 검증
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

#### UC011: Assignment 게시/마감 (Instructor)
**참고 문서**: `docs/011/spec.md`

**구현 파일**:
- `src/features/assignment/backend/service.ts` (상태 전환 로직 강화)
- 스케줄러 설정 (선택적)

**체크리스트**:
- [ ] 과제 게시 로직 검증 (필수 필드 완성 확인)
- [ ] 수동 마감 API (`PATCH /api/assignments/:id/close`)
- [ ] 자동 마감 스케줄러 (선택적)
  - [ ] Cron Job 설정 (매일 자정 UTC)
  - [ ] 마감일 지난 published 과제를 closed로 변경
- [ ] 테스트 완료

---

### Phase 6: UC012 구현 (Operator 기능) 🔵
**예상 소요 시간**: 4~6시간

#### UC012: 운영 (Operator)
**참고 문서**: `docs/012/spec.md`

**구현 파일**:
- `src/features/operator/backend/service.ts` (신규)
- `src/features/operator/backend/route.ts` (신규)
- `src/features/operator/components/OperatorPanel.tsx` (신규)

**체크리스트**:
- [ ] 신고 관리 API
  - [ ] 신고 목록 조회 (`GET /api/operator/reports`)
  - [ ] 신고 상태 변경 (`PATCH /api/operator/reports/:id`)
  - [ ] 조치 실행 (경고, 무효화, 제한)
- [ ] 메타데이터 관리 API
  - [ ] 메타데이터 생성 (`POST /api/operator/metadata`)
  - [ ] 메타데이터 수정 (`PUT /api/operator/metadata/:id`)
  - [ ] 메타데이터 비활성화 (`PATCH /api/operator/metadata/:id/deactivate`)
    - [ ] **물리적 DELETE 금지, UPDATE 사용** (CRITICAL)
- [ ] 사용자/코스 삭제 승인 워크플로우 (선택적)
- [ ] 운영자 권한 가드 (`requireRole(['operator'])`)
- [ ] UI 컴포넌트 구현
- [ ] 테스트 완료

---

### Phase 7: 통합 테스트 및 최적화 🟣
**예상 소요 시간**: 4~6시간

#### 통합 테스트
- [ ] 전체 사용자 플로우 테스트
  - [ ] Learner: 회원가입 → 코스 탐색 → 수강신청 → 과제 제출 → 성적 확인
  - [ ] Instructor: 회원가입 → 코스 생성 → 과제 생성 → 제출물 채점
  - [ ] Operator: 신고 처리 → 메타데이터 관리
- [ ] 소프트 삭제 정책 검증
  - [ ] 삭제된 사용자/코스/과제 접근 차단
  - [ ] 관련 데이터 보존 확인
- [ ] 메타데이터 비활성화 정책 검증
  - [ ] 비활성화된 메타데이터 필터링
  - [ ] 기존 데이터 참조 유지
- [ ] 과제 가중치 검증
  - [ ] 100% 초과 시 트랜잭션 롤백
- [ ] 성능 테스트
  - [ ] 대량 데이터 조회 (페이지네이션)
  - [ ] 쿼리 최적화 (인덱스 활용)

#### 최적화
- [ ] N+1 쿼리 제거
- [ ] 불필요한 데이터 조회 최소화
- [ ] React Query 캐시 전략 최적화
- [ ] 에러 메시지 사용자 친화적으로 개선

---

## 📊 진행 상황 추적

### 전체 진행률
- [ ] Phase 0: 문서 검토 (100% ✅)
- [ ] Phase 1: 데이터베이스 마이그레이션 (0%)
- [ ] Phase 2: SPECADD 구현 (0%)
- [ ] Phase 3: UC004~UC006 구현 (0%)
- [ ] Phase 4: UC007~UC009 구현 (0%)
- [ ] Phase 5: UC010~UC011 구현 (0%)
- [ ] Phase 6: UC012 구현 (0%)
- [ ] Phase 7: 통합 테스트 및 최적화 (0%)

### 예상 총 소요 시간
- **Phase 1**: 0.5시간
- **Phase 2**: 2~3시간
- **Phase 3**: 6~8시간
- **Phase 4**: 8~10시간
- **Phase 5**: 6~8시간
- **Phase 6**: 4~6시간
- **Phase 7**: 4~6시간
- **총합**: **31~42시간** (약 4~5일)

---

## 🎯 핵심 원칙

### 1. 소프트 삭제 (Soft Delete)
- 모든 `SELECT` 쿼리에 `WHERE deleted_at IS NULL` 조건 포함
- `DELETE` 요청 시 `UPDATE SET deleted_at = NOW()` 수행
- 물리적 `DELETE` 금지

### 2. 메타데이터 비활성화
- 메타데이터 조회 시 `WHERE is_active = TRUE` 조건 포함
- 삭제 요청 시 `UPDATE SET is_active = FALSE` 수행
- 물리적 `DELETE` 금지

### 3. 트랜잭션 검증
- 과제 가중치 합계 검증은 트랜잭션 내에서 수행
- 100% 초과 시 롤백 및 에러 반환

### 4. API 인증
- 모든 보호된 엔드포인트에 `requireAuth` 미들웨어 적용
- 역할 기반 접근 제어 (`requireRole`)
- 소유권 검증 (본인/소유자만 접근)

### 5. 에러 처리
- 표준 에러 코드 사용 (`UPPER_SNAKE_CASE`)
- 표준 응답 형식 (`{ success, data/error }`)
- 사용자 친화적 에러 메시지

---

## 📚 참고 문서

### 필수 문서
- `docs/CHANGELOG-CTO-REVIEW.md` - CTO 리뷰 반영 이력
- `docs/specadd.md` - UC001~UC003 수정 명세
- `docs/api-policy.md` - API 정책 및 규약
- `docs/database.md` - 데이터베이스 스키마
- `docs/userflow.md` - 사용자 플로우

### 기능별 명세
- `docs/001~003/spec.md` - UC001~UC003 (수정 대상)
- `docs/004~012/spec.md` - UC004~UC012 (신규 구현)

### 기타
- `refactoring-plan.md` - 리팩토링 계획
- `docs/prd.md` - 제품 요구사항 문서

---

## 🚨 주의사항

### CRITICAL
1. **Phase 1 (데이터베이스 마이그레이션)을 먼저 완료**하지 않으면 모든 코드가 실패합니다.
2. **Phase 2 (SPECADD)를 완료**한 후 Phase 3 이후를 진행해야 합니다.
3. **과제 가중치 검증**은 트랜잭션 내에서 수행해야 합니다 (UC009).
4. **메타데이터 비활성화**는 물리적 삭제가 아닌 `is_active = FALSE`로 처리합니다 (UC012).

### TIP
- 각 Phase 완료 후 즉시 테스트하여 문제를 조기에 발견하세요.
- Git 커밋은 Phase 단위로 수행하여 롤백이 용이하도록 하세요.
- 개발 환경에서 충분히 테스트한 후 프로덕션에 배포하세요.

---

**이 로드맵을 따라 구현하면, CTO 리뷰 요구사항을 모두 충족하는 견고한 LMS 시스템을 완성할 수 있습니다!** 🎉

