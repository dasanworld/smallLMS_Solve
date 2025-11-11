# 과제 관리 (Assignment Management) 기능

## 개요

Feature 009 - 강사가 과제를 생성, 수정, 상태 전환하고 학습자의 제출물을 관리하는 기능입니다.

## 디렉토리 구조

```
src/features/assignment/
├── backend/
│   ├── error.ts           # 에러 코드 정의
│   ├── schema.ts          # Zod 스키마 (요청/응답)
│   ├── service.ts         # 비즈니스 로직 서비스
│   └── route.ts           # API 라우트
├── hooks/
│   ├── useAssignmentMutations.ts  # 과제 관리 Mutation Hook
│   └── useSubmissionMutations.ts  # 제출물 관리 Mutation Hook
├── components/
│   ├── AssignmentForm.tsx          # 과제 생성/수정 폼
│   ├── AssignmentList.tsx          # 과제 목록
│   ├── SubmissionList.tsx          # 제출물 목록
│   └── GradeSubmissionModal.tsx    # 제출물 채점 모달
├── lib/
│   └── dto.ts             # DTO 재내보내기
└── README.md
```

## 주요 기능

### 1. 과제 관리

#### 생성 (Create)
- **엔드포인트**: `POST /api/courses/:courseId/assignments`
- **권한**: Instructor (코스 소유자만)
- **입력**: 제목, 설명, 마감일, 가중치, 정책
- **검증**: 
  - 가중치 합이 100% 초과 방지
  - 필드 유효성 검사

#### 수정 (Update)
- **엔드포인트**: `PUT /api/assignments/:assignmentId`
- **권한**: Instructor (코스 소유자만)
- **입력**: 수정할 필드만 전송

#### 삭제 (Delete)
- **엔드포인트**: `DELETE /api/assignments/:assignmentId`
- **권한**: Instructor (코스 소유자만)
- **방식**: 소프트 삭제 (`deleted_at` 기록)

#### 상태 변경 (Status Update)
- **엔드포인트**: `PATCH /api/assignments/:assignmentId/status`
- **상태 전환**:
  - `draft` → `published`: 학습자에게 공개
  - `published` → `closed`: 제출 차단, 채점만 가능
  - `closed`: 변경 불가능

### 2. 제출물 관리

#### 제출물 목록 조회
- **엔드포인트**: `GET /api/assignments/:assignmentId/submissions`
- **권한**: Instructor (코스 소유자만)
- **필터링**: 페이지네이션 지원

#### 제출물 채점
- **엔드포인트**: `PATCH /api/submissions/:submissionId/grade`
- **권한**: Instructor (코스 소유자만)
- **입력**: 점수 (0~100), 피드백, 상태
- **상태**:
  - `graded`: 채점 완료
  - `resubmission_required`: 재제출 요청

#### 통계 조회
- **엔드포인트**: `GET /api/assignments/:assignmentId/submissions/stats`
- **데이터**: 제출 수, 미채점, 지각, 재제출요청, 평균점수

## 데이터 구조

### Assignment

```typescript
interface AssignmentResponse {
  id: string;              // UUID
  courseId: string;        // 코스 ID
  title: string;           // 제목
  description: string;     // 설명
  dueDate: string;         // 마감일 (ISO 8601)
  pointsWeight: number;    // 가중치 (0~1.0)
  status: 'draft' | 'published' | 'closed';
  allowLate: boolean;      // 지각 허용 여부
  allowResubmission: boolean; // 재제출 허용 여부
  publishedAt: string | null;  // 공개 시점
  closedAt: string | null;     // 마감 시점
  createdAt: string;       // 생성 시간
  updatedAt: string;       // 수정 시간
}
```

### Submission

```typescript
interface SubmissionResponse {
  id: string;              // UUID
  assignmentId: string;    // 과제 ID
  userId: string;          // 학습자 ID
  content: string;         // 제출 내용
  link: string | null;     // 제출 링크
  status: 'submitted' | 'graded' | 'resubmission_required';
  isLate: boolean;         // 지각 여부
  score: number | null;    // 점수
  feedback: string | null; // 피드백
  gradedAt: string | null; // 채점 시점
  submittedAt: string;     // 제출 시점
  updatedAt: string;       // 수정 시간
}
```

## 비즈니스 규칙

1. **가중치 검증**: 한 코스의 모든 과제 가중치 합은 100%를 초과할 수 없음
2. **상태 전환**: draft → published → closed 순서로만 변경 가능
3. **권한 검증**: 강사는 자신의 코스의 과제만 관리 가능
4. **소프트 삭제**: 과제 삭제 시 `deleted_at` 타임스탬프 기록
5. **제출물 보존**: 과제 삭제 후에도 제출물 데이터 유지

## 사용 예시

### 과제 생성

```typescript
const { mutate } = useCreateAssignmentMutation();

mutate({
  courseId: 'course-123',
  title: '팀 프로젝트',
  description: '3명 이상의 팀으로 진행',
  dueDate: '2025-01-31T23:59:59Z',
  pointsWeight: 0.3,
  allowLate: true,
  allowResubmission: true,
});
```

### 과제 상태 변경

```typescript
const { mutate } = useUpdateAssignmentStatusMutation();

mutate({
  assignmentId: 'assignment-456',
  status: 'published',
});
```

### 제출물 채점

```typescript
const { mutate } = useGradeSubmissionMutation();

mutate({
  submissionId: 'submission-789',
  score: 95,
  feedback: '매우 좋은 작업입니다!',
  status: 'graded',
});
```

## 에러 처리

### 주요 에러 코드

- `ASSIGNMENT_NOT_FOUND`: 과제를 찾을 수 없음
- `ASSIGNMENT_WEIGHT_EXCEEDED`: 가중치 합이 100% 초과
- `ASSIGNMENT_PAST_DEADLINE`: 마감일이 과거 날짜
- `INSUFFICIENT_PERMISSIONS`: 권한 없음
- `COURSE_NOT_FOUND`: 코스를 찾을 수 없음
- `SUBMISSION_NOT_FOUND`: 제출물을 찾을 수 없음
- `INVALID_SCORE`: 점수 범위 벗어남 (0~100)

## 주의사항

1. **마감일 자동 변경**: Database의 Cron Job이 매일 자정(UTC)에 마감일이 지난 과제를 자동으로 `closed` 상태로 변경합니다.

2. **가중치 검증**: 과제 생성/수정 시 모든 과제의 가중치를 재계산하므로 성능에 영향이 있을 수 있습니다.

3. **제출물 업데이트**: 재제출 시 기존 레코드의 내용을 갱신하며, 새로운 레코드가 생성되지 않습니다.

## 앞으로의 개선 사항

- [ ] 배치 연산 최적화 (가중치 검증)
- [ ] 대량 채점 기능
- [ ] 채점 룸브릭 (Rubric) 지원
- [ ] 제출물 버전 관리
- [ ] 과제 복제 기능




