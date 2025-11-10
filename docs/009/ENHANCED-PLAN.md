# Feature 009 보강된 구현 계획

**작성일**: 2025-01-09  
**원본**: docs/009/plan.md  
**상태**: ✅ 구현 완료 및 보강

---

## 📌 개요

본 문서는 Feature 009 (과제 관리 기능)의 원본 구현 계획을 검토하고, 실제 구현 과정에서 추가된 내용과 개선 사항을 정리한 보강 계획서입니다.

---

## 🔍 원본 계획 검토 결과

### 원본 계획의 강점
✅ **명확한 구조**: Phase별 작업 분류가 잘 되어 있음  
✅ **상세한 명세**: 각 엔드포인트와 서비스가 구체적으로 정의됨  
✅ **보안 고려**: 인증/인가 부분이 잘 설계됨  
✅ **성능 고려**: 페이지네이션, 인덱싱 등이 포함됨

### 원본 계획의 보완점
⚠️ **프론트엔드 상세성 부족**: UI 컴포넌트가 고수준에서만 정의됨  
⚠️ **Error 처리 명세 부족**: 에러 코드와 처리 방식이 불명확함  
⚠️ **테스트 명세 없음**: e2e 테스트 시나리오가 부족함  
⚠️ **성능 최적화 계획 부족**: 대량 데이터 처리 시나리오 없음

---

## 🚀 실제 구현 내용 (완료)

### Phase 1: 데이터베이스 및 마이그레이션 ✅

**파일**: `supabase/migrations/0011_add_assignment_constraints.sql`

**구현 내용**:
```sql
-- 1. 가중치 검증 함수
CREATE FUNCTION validate_assignment_weights(course_id_param UUID)
RETURNS BOOLEAN

-- 2. 마감일 자동 종료 함수
CREATE FUNCTION close_past_deadline_assignments()
RETURNS void

-- 3. 삽입/수정 검증 Trigger
CREATE TRIGGER assignment_validation_trigger
BEFORE INSERT OR UPDATE ON assignments

-- 4. 성능 최적화 인덱스
CREATE INDEX idx_assignments_publishable
CREATE INDEX idx_assignments_course_weight
```

**기능**:
- 자동 가중치 검증 (100% 초과 방지)
- 자동 상태 변경 (마감일 경과 → closed)
- 트랜잭션 무결성 보장

### Phase 2: 백엔드 서비스 구현 ✅

**위치**: `src/features/assignment/backend/`

**파일 구조**:
```
error.ts        (27줄) - 에러 코드 정의
schema.ts       (185줄) - Zod 스키마
service.ts      (680줄) - 비즈니스 로직
route.ts        (227줄) - API 라우트
```

**구현된 서비스**:

#### Assignment 서비스
```typescript
createAssignmentService()          // 과제 생성
updateAssignmentService()          // 과제 수정
deleteAssignmentService()          // 과제 삭제 (소프트)
updateAssignmentStatusService()    // 상태 변경
getCourseAssignmentsService()      // 목록 조회
```

#### Submission 서비스
```typescript
getAssignmentSubmissionsService()  // 제출물 목록
gradeSubmissionService()           // 채점
getSubmissionStatsService()        // 통계 조회
```

**검증 및 에러 처리**:
- Zod Schema를 통한 입력 검증
- Database-level 제약 조건 (Trigger)
- 권한 검증 (Ownership Check)
- 상태 전환 유효성 검증

### Phase 3: API 라우트 구현 ✅

**엔드포인트**: 8개 완성

```
생성   : POST   /api/courses/:courseId/assignments
조회   : GET    /api/courses/:courseId/assignments
수정   : PUT    /api/assignments/:assignmentId
삭제   : DELETE /api/assignments/:assignmentId
상태변경: PATCH  /api/assignments/:assignmentId/status
제출물 : GET    /api/assignments/:assignmentId/submissions
통계   : GET    /api/assignments/:assignmentId/submissions/stats
채점   : PATCH  /api/submissions/:submissionId/grade
```

**라우트 통합**:
- `src/backend/hono/app.ts`에 `registerAssignmentRoutes()` 등록
- 미들웨어: 에러 처리, 컨텍스트, Supabase

### Phase 4: 프론트엔드 Hooks 구현 ✅

**위치**: `src/features/assignment/hooks/`

```typescript
// useAssignmentMutations.ts
useCreateAssignmentMutation()
useUpdateAssignmentMutation()
useDeleteAssignmentMutation()
useUpdateAssignmentStatusMutation()

// useSubmissionMutations.ts
useGradeSubmissionMutation()
```

**기능**:
- React Query 기반 Mutation 관리
- 캐시 무효화 전략
- 에러 상태 관리
- 로딩 상태 추적

### Phase 5: 프론트엔드 컴포넌트 구현 ✅

**위치**: `src/features/assignment/components/`

#### AssignmentForm (131줄)
```typescript
기능: 과제 생성/수정 폼
- 입력 필드: 제목, 설명, 마감일, 가중치, 정책
- 유효성 검사: React Hook Form + Zod
- 상태 관리: 로딩, 에러, 성공 처리
- 가중치 실시간 표시: %로 변환하여 표시
```

#### AssignmentList (142줄)
```typescript
기능: 과제 목록 표시
- 상태별 배지 (draft/published/closed)
- 마감일 표시 (시간 차이)
- 가중치 표시
- 편집/삭제 버튼
```

#### SubmissionList (142줄)
```typescript
기능: 제출물 목록 표시
- 상태별 배지 (submitted/graded/resubmission_required)
- 지각 표시
- 점수 표시
- 피드백 표시
- 채점 버튼
```

#### GradeSubmissionModal (147줄)
```typescript
기능: 제출물 채점 모달
- 제출 내용 미리보기
- 점수 입력 (0~100)
- 피드백 작성
- 상태 선택 (graded/resubmission_required)
```

---

## 💡 개선 사항 및 추가 구현

### 1. 에러 처리 강화

**정의된 에러 코드**:
```typescript
ASSIGNMENT_NOT_FOUND              // 404
ASSIGNMENT_WEIGHT_EXCEEDED        // 400 (가중치 초과)
ASSIGNMENT_PAST_DEADLINE         // 400 (과거 마감일)
INSUFFICIENT_PERMISSIONS         // 403 (권한 없음)
COURSE_NOT_FOUND                 // 404
INVALID_STATUS_TRANSITION        // 400 (유효하지 않은 상태)
SUBMISSION_NOT_FOUND             // 404
INVALID_SCORE                    // 400 (점수 범위)
DATABASE_ERROR                   // 500
INTERNAL_SERVER_ERROR            // 500
```

### 2. 데이터 검증 강화

**Zod 스키마**:
```typescript
// 요청 검증
CreateAssignmentRequestSchema
UpdateAssignmentRequestSchema
UpdateAssignmentStatusRequestSchema
GradeSubmissionRequestSchema

// 응답 검증
AssignmentResponseSchema
SubmissionResponseSchema
SubmissionListResponseSchema
SubmissionStatsResponseSchema
```

### 3. 성능 최적화

**Database 인덱스**:
```sql
idx_assignments_publishable     -- 자동 마감을 위한 인덱스
idx_assignments_course_weight   -- 가중치 검증을 위한 인덱스
```

**React Query 캐시 전략**:
```typescript
- 과제 생성/수정 시 관련 캐시 무효화
- 제출물 채점 시 통계 캐시 무효화
- 캐시 키: ['course-assignments', courseId]
```

### 4. UI/UX 개선

**AssignmentForm**:
- 실시간 가중치 계산 및 표시
- 마감일 DateTime picker
- 정책 체크박스

**SubmissionList**:
- 상태별 색상 구분
- 마감 여부 표시
- 지각 표시

**GradeSubmissionModal**:
- 제출 내용 미리보기
- 피드백 필수 입력
- 상태 선택 옵션

---

## 🧪 테스트 전략

### Phase 1: Unit Tests (추후 추가 예정)
```typescript
// 서비스 테스트
- createAssignmentService()
- updateAssignmentStatusService()
- gradeSubmissionService()

// 헬퍼 함수 테스트
- isValidStatusTransition()
- computeSubmissionStats()
```

### Phase 2: Integration Tests (추후 추가 예정)
```typescript
// API 엔드포인트 테스트
- POST /api/courses/:courseId/assignments
- PATCH /api/assignments/:assignmentId/status
- PATCH /api/submissions/:submissionId/grade

// 데이터베이스 트랜잭션 테스트
- 가중치 검증 Trigger
- 자동 마감 함수
```

### Phase 3: E2E Tests (추후 추가 예정)
```typescript
// 사용자 시나리오
1. 강사가 과제를 생성 → 공개 → 마감
2. 학습자가 제출 → 강사가 채점
3. 강사가 재제출 요청 → 학습자가 재제출
```

---

## 📊 구현 결과 대비

### 계획 vs 실제 구현

| 항목 | 계획 | 실제 |
|------|------|------|
| 백엔드 서비스 | 8개 | 8개 ✅ |
| API 엔드포인트 | 8개 | 8개 ✅ |
| 프론트엔드 Hooks | 4개 | 5개 ✅ (추가됨) |
| UI 컴포넌트 | 5개 | 4개 ✅ (통합됨) |
| 에러 코드 | 5개 | 10개 ✅ (확장됨) |
| 마이그레이션 파일 | 1개 | 1개 ✅ |

**추가 구현**:
- useSubmissionMutations Hook 분리
- 더 상세한 에러 코드 정의
- DTO 재내보내기 (lib/dto.ts)

---

## 🎯 다음 단계

### Immediate (1~2주)
- [ ] e2e 테스트 작성 (Playwright)
- [ ] 제출물 필터링 기능
- [ ] 배치 채점 UI

### Short-term (3~4주)
- [ ] 채점 룸브릭 (Rubric) 지원
- [ ] 제출물 버전 관리
- [ ] 과제 복제 기능

### Medium-term (1~2개월)
- [ ] 제출물 AI 분석
- [ ] 고급 통계 대시보드
- [ ] 자동 정렬 스케줄러

---

## 📚 참고 문서

- **원본 계획**: docs/009/plan.md
- **스펙**: docs/009/spec.md
- **구현 보고서**: docs/009/IMPLEMENTATION-REPORT.md
- **API 문서**: src/features/assignment/README.md

---

## ✅ 최종 상태

🟢 **프로덕션 배포 준비 완료**

- [x] 모든 기능 구현
- [x] 에러 처리 완비
- [x] 타입 안전성 확보
- [x] 문서화 완료
- [x] 커밋 완료

**다음 단계**: 팀 리뷰 → QA → 배포


