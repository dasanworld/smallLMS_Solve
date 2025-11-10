# 강사 채점 관리 네비게이션 개선 스펙

## 1. 개요

### 1.1 목적
강사 사용자가 UI를 통해 자연스럽게 제출물 채점 관리 기능에 접근할 수 있도록 네비게이션 흐름을 개선합니다.

### 1.2 범위
- **포함**: 네비게이션 메뉴 활성화, 과제 관리 페이지 개선, 제출물 목록 페이지 연결
- **제외**: 새로운 API 개발, 데이터베이스 스키마 변경, 기존 채점 기능 수정

### 1.3 기본 용어
| 용어 | 정의 |
|------|------|
| **강사** | 코스를 소유하고 관리하는 사용자 (role='instructor') |
| **제출물** | 학습자가 과제에 제출한 결과물 (submission) |
| **채점** | 강사가 제출물에 점수와 피드백을 부여하는 행위 |
| **네비게이션** | UI를 통한 페이지 간 이동 경로 |

---

## 2. 요구사항 정의

### 2.1 기능 요구사항 (FR)

#### FR-001: 채점관리 메뉴 활성화
**ID**: FR-001
**우선순위**: 🔴 높음
**설명**: 글로벌 네비게이션 메뉴의 "채점관리" 항목을 활성화하여 `/submissions/list` 페이지로 이동 가능하게 함

**세부 요구사항**:
- 메뉴 항목이 클릭 가능해야 함
- 회색 텍스트 → 검은색 또는 파란색 텍스트로 변경
- 현재 페이지가 `/submissions/list`인 경우 강조 표시 (예: 파란색, 밑줄)
- 마우스 오버 시 호버 효과 제공
- 모바일 메뉴에서도 동일하게 작동

**UI 요소**:
```
메뉴: [홈] [대시보드] [코스관리] [과제관리] [채점관리] [로그아웃]
                                           ↑ 활성화 필요
```

**제약 조건**:
- 강사 역할 사용자에게만 표시됨 (권한은 페이지에서 검증)
- 학습자 역할에는 영향 없음

---

#### FR-002: 과제별 제출물 보기 버튼 추가 (InstructorAssignmentPage)
**ID**: FR-002
**우선순위**: 🔴 높음
**설명**: 코스별 과제 관리 페이지에서 각 과제마다 "제출물 보기" 버튼 추가

**세부 요구사항**:
- 각 과제 카드 또는 아이템에 "제출물 보기" 버튼 추가
- 버튼 클릭 시 `/courses/[courseId]/assignments/[assignmentId]/submissions`로 이동
- 버튼은 기존 "수정", "삭제" 버튼과 함께 표시
- 아이콘 포함 (예: ChevronRight)
- 호버 시 강조 표시
- 모바일에서도 접근 가능한 크기 (최소 44px)

**UI 요소**:
```
과제 카드:
┌─────────────────────────┐
│ 과제 제목                │
│ 마감일: 2025-11-15      │
│ 상태: Published         │
├─────────────────────────┤
│ [수정] [삭제] [제출물보기→] │
└─────────────────────────┘
```

**제약 조건**:
- 해당 코스의 소유자만 버튼이 표시되어야 함 (페이지 권한 검증)
- 제출물이 없는 과제도 버튼 표시

---

#### FR-003: 전체 과제 목록에서 제출물 링크 추가 (InstructorAllAssignmentsPage)
**ID**: FR-003
**우선순위**: 🟡 중간
**설명**: 전체 과제 관리 페이지에서 과제를 클릭할 때 제출물 목록으로 이동 가능하게 함

**세부 요구사항**:
- 과제 카드 또는 과제 목록 아이템을 클릭하면 `/courses/[courseId]/assignments/[assignmentId]/submissions`로 이동
- 기존 모달 다이얼로그 내에 "제출물 보기" 버튼 추가 (선택)
- 또는 과제 카드를 직접 클릭 가능하게 개선
- 마감, 초안, 과목별 섹션 모두에 적용

**UI 요소**:
```
방식 A: 모달 내 버튼 추가
┌─────────────────────────┐
│ 과제 상세 정보           │
├─────────────────────────┤
│ [제출물 보기] [닫기]      │
└─────────────────────────┘

방식 B: 직접 이동
과제 카드 → 클릭 → 제출물 목록 페이지로 이동
```

**제약 조건**:
- 과제가 최소 1개 이상 제출물을 가져야 함 (선택사항: 없어도 버튼 표시 가능)

---

#### FR-004: 제출물 목록 페이지 권한 검증
**ID**: FR-004
**우선순위**: 🟡 중간
**설명**: `/submissions/list` 페이지에 접근할 때 강사 권한을 검증함

**세부 요구사항**:
- 페이지 로드 시 현재 사용자의 역할을 확인
- `role !== 'instructor'` 경우 `/` 또는 `/instructor-dashboard`로 리다이렉트
- 리다이렉트 중 로딩 스피너 또는 로딩 스켈레톤 표시
- 권한 없는 접근 시 에러 메시지 없이 조용히 리다이렉트

**제약 조건**:
- 서버사이드 또는 클라이언트사이드 검증 모두 가능
- 권한 검증 중 API 응답 지연이 발생할 수 있으므로 로딩 상태 관리 필수

---

### 2.2 비기능 요구사항 (NFR)

#### NFR-001: 성능
- 메뉴 로드 시간: < 100ms
- 페이지 이동 시간: < 500ms
- 추가 API 호출 없음 (기존 기능 재사용)

#### NFR-002: 접근성
- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환성

#### NFR-003: 반응형 디자인
- 모바일 (< 640px): 메뉴 축소, 버튼 크기 조정
- 태블릿 (640px ~ 1024px): 일반 레이아웃
- 데스크톱 (> 1024px): 최적화된 레이아웃

#### NFR-004: 보안
- 권한 검증 필수 (클라이언트 + 서버)
- XSS, CSRF 방지
- 민감한 정보 노출 금지

#### NFR-005: 호환성
- Chrome, Firefox, Safari, Edge 최신 2개 버전 지원
- iOS Safari 13+, Android Chrome 최신 버전 지원

---

## 3. 사용자 시나리오 (Use Case)

### UC-001: 강사가 채점관리 메뉴를 통해 제출물 목록 접근
**초기 상태**: 강사 로그인 완료, 대시보드 또는 다른 페이지 표시 중

**흐름**:
1. 강사가 글로벌 네비게이션의 "채점관리" 메뉴 클릭
2. `/submissions/list` 페이지로 이동
3. 강사의 모든 과제에 대한 제출물 목록 표시
4. 미채점, 지각, 재제출요청 필터 적용 가능
5. 제출물 클릭 → 채점 페이지로 이동
6. 점수 입력, 피드백 작성, 저장

**예상 결과**: 채점 완료, 학습자에게 피드백 전달

---

### UC-002: 강사가 특정 과제의 제출물을 조회하여 채점
**초기 상태**: 강사가 코스 관리 페이지에서 과제 목록 확인 중

**흐름**:
1. 강사가 특정 코스로 이동 (`/courses/[courseId]/assignments`)
2. 과제 목록 표시
3. 원하는 과제의 "제출물 보기" 버튼 클릭
4. `/courses/[courseId]/assignments/[assignmentId]/submissions` 페이지로 이동
5. 해당 과제의 모든 제출물 목록 표시
6. 제출물 선택 → 채점 페이지로 이동
7. 채점 완료

**예상 결과**: 특정 과제의 제출물만 효율적으로 채점 가능

---

### UC-003: 강사가 전체 과제 목록에서 제출물 접근 (선택)
**초기 상태**: 강사가 전체 과제 관리 페이지 (`/assignments`) 확인 중

**흐름**:
1. 강사가 과제 카드 클릭
2. 과제 상세 모달 표시
3. 모달 내 "제출물 보기" 버튼 클릭 (또는 과제 제목 클릭으로 직접 이동)
4. `/courses/[courseId]/assignments/[assignmentId]/submissions` 페이지로 이동
5. 제출물 목록 표시 및 채점

**예상 결과**: 전체 과제 목록에서도 제출물에 효율적으로 접근 가능

---

## 4. UI/UX 명세

### 4.1 GlobalNavigation 메뉴
**위치**: 페이지 상단 또는 좌측 사이드바
**요소**: 채점관리 메뉴 아이템

```
현재 상태:
┌──────────────────────────────────┐
│ 홈  대시보드  코스관리  과제관리  │
│ (채점관리 - 회색, 비활성)        │
└──────────────────────────────────┘

변경 후:
┌──────────────────────────────────┐
│ 홈  대시보드  코스관리  과제관리  │
│ 채점관리 (활성, 링크 가능)        │
└──────────────────────────────────┘
```

**스타일**:
- 활성 상태: 검은색 또는 파란색 텍스트
- 호버 상태: 파란색으로 변경, 밑줄 추가
- 현재 페이지: 파란색, 밑줄, 굵은 글씨

**아이콘**: BarChart3 (lucide-react)

---

### 4.2 과제 카드 액션 버튼
**위치**: 각 과제 아이템의 우측 또는 하단

```
┌─────────────────────────────────┐
│ 과제 제목                        │
│ 마감일: 2025-11-15              │
│ 상태: Published                 │
├─────────────────────────────────┤
│ [수정 버튼] [삭제 버튼] [제출물보기→] │
└─────────────────────────────────┘
```

**버튼 명세**:
- 텍스트: "제출물 보기"
- 아이콘: ChevronRight (우측 화살표)
- 색상: Primary (파란색) 또는 Outline (테두리)
- 크기: Small (sm)
- 호버: 배경색 변경, 살짝 확대
- 활성: 진한 파란색
- 비활성 (권한 없음): 회색, 커서 변경 없음

---

### 4.3 제출물 목록 페이지
**경로**: `/submissions/list` 또는 `/courses/[courseId]/assignments/[assignmentId]/submissions`

```
┌─────────────────────────────────────────┐
│ 제출물 목록 - [필터: 미채점 ▼] [정렬 ▼]  │
├─────────────────────────────────────────┤
│ 과제명          학생명    제출일시  상태 │
├─────────────────────────────────────────┤
│ 과제1           김학생    2025-11-10 📋  │
│ [검토 →]                               │
├─────────────────────────────────────────┤
│ 과제2           박학생    2025-11-11 ✓  │
│ [검토 →]                               │
└─────────────────────────────────────────┘
```

**요소**:
- 필터: 상태별 (미채점, 채점완료, 재제출요청)
- 정렬: 제출일시 (최신순/오래된순)
- 검색: 과제명, 학생명 (선택)
- 상태 아이콘: 📋(미채점), ✓(완료), ⚠️(재제출요청), ⏰(지각)

---

### 4.4 모달 다이얼로그 (과제 상세)
**위치**: InstructorAllAssignmentsPage

```
┌──────────────────────────────────┐
│ × 과제 상세 정보                  │
├──────────────────────────────────┤
│ 과제 제목                         │
│ 마감일: 2025-11-15               │
│ 점수 비중: 30%                   │
│ 상태: Published                  │
│ 설명: ...                         │
├──────────────────────────────────┤
│ [제출물 보기] [닫기]              │
└──────────────────────────────────┘
```

**버튼**:
- "제출물 보기": Primary (파란색)
- "닫기": Outline (테두리)

---

## 5. 데이터 흐름

### 5.1 네비게이션 흐름도
```
강사 로그인
  ↓
강사 대시보드
  ├─→ [채점관리] 메뉴 클릭
  │     ↓
  │   /submissions/list (모든 제출물 목록)
  │     ├─→ 필터 적용
  │     ├─→ 검색 실행
  │     └─→ 제출물 클릭
  │           ↓
  │         /submissions/[id]/grade (채점 페이지)
  │           ↓
  │         점수 + 피드백 입력 → 저장
  │
  ├─→ [코스관리] → 특정 코스 선택
  │     ├─→ /courses/[courseId]/assignments
  │     │     ├─→ 과제 목록 표시
  │     │     └─→ "제출물 보기" 버튼 클릭
  │     │           ↓
  │     │         /courses/[courseId]/assignments/[assignmentId]/submissions
  │     │           ↓
  │     │         제출물 목록 표시
  │     │           ↓
  │     │         제출물 클릭
  │     │           ↓
  │     │         /submissions/[id]/grade (채점)
  │     │
  │     └─→ /assignments (전체 과제)
  │           ├─→ 과제 카드 클릭
  │           ├─→ 과제 상세 모달
  │           └─→ "제출물 보기" 버튼 클릭
  │                 ↓
  │               /courses/[courseId]/assignments/[assignmentId]/submissions
```

---

## 6. 기술 명세

### 6.1 파일 변경 사항

#### 파일 1: src/components/GlobalNavigation.tsx
**변경 타입**: 수정 (Modification)
**라인 범위**: L142-150

```typescript
// 변경 전
<Link
  href="#"
  className="flex items-center gap-1.5 text-sm font-medium text-gray-400 cursor-not-allowed"
  onClick={(e) => e.preventDefault()}
  title="준비 중"
>
  <BarChart3 className="h-4 w-4" />
  채점관리
</Link>

// 변경 후
<Link
  href="/submissions/list"
  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
    pathname === '/submissions/list'
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-700 hover:text-blue-600'
  }`}
>
  <BarChart3 className="h-4 w-4" />
  채점관리
</Link>
```

**의존성**:
- `usePathname()` (next/navigation)
- BarChart3 아이콘은 이미 import 됨

---

#### 파일 2: src/features/assignment/components/InstructorAssignmentPage.tsx
**변경 타입**: 수정 (Modification)

**변경 내용**:
- 과제 카드 또는 아이템의 액션 영역에 "제출물 보기" 버튼 추가
- 버튼 클릭 시 `/courses/[courseId]/assignments/[assignmentId]/submissions`로 이동

```typescript
// 기존 코드에서 액션 버튼 영역을 찾아 추가:

<div className="flex gap-2">
  {/* 기존 버튼들 */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleEditAssignment(assignment.id)}
  >
    수정
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDeleteAssignment(assignment.id)}
  >
    삭제
  </Button>

  {/* 신규 버튼 */}
  <Button
    variant="default"
    size="sm"
    onClick={() => router.push(
      `/courses/${courseId}/assignments/${assignment.id}/submissions`
    )}
  >
    제출물 보기
    <ChevronRight className="h-4 w-4 ml-1" />
  </Button>
</div>
```

**의존성**:
- `Button` (shadcn/ui) - 이미 import됨
- `ChevronRight` (lucide-react) - import 필요 (확인)
- `useRouter()` (next/navigation) - 이미 사용 중

---

#### 파일 3: src/features/assignment/components/InstructorAllAssignmentsPage.tsx
**변경 타입**: 수정 (Modification)

**변경 내용**:
- 모달 다이얼로그에 "제출물 보기" 버튼 추가
- 버튼 클릭 시 모달 닫고 제출물 목록 페이지로 이동

```typescript
// 모달 하단에 버튼 추가:

<DialogFooter>
  <Button
    variant="outline"
    onClick={() => {
      setIsOpen(false);
      router.push(
        `/courses/${selectedAssignment.course_id}/assignments/${selectedAssignment.id}/submissions`
      );
    }}
  >
    제출물 보기
  </Button>

  <Button onClick={() => setIsOpen(false)}>닫기</Button>
</DialogFooter>
```

**의존성**:
- `Button`, `DialogFooter` (shadcn/ui)
- `useRouter()` (next/navigation)
- 상태: `selectedAssignment`, `setIsOpen` 필요

---

#### 파일 4: src/app/(protected)/submissions/list/page.tsx
**변경 타입**: 수정 (Modification)

**변경 내용**:
- 페이지 최상단에 권한 검증 로직 추가
- `role !== 'instructor'` 경우 리다이렉트

```typescript
'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SubmissionsListContent } from '@/features/grade/components/submissions-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SubmissionsListPage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'instructor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user?.role !== 'instructor') {
    return null;
  }

  return <SubmissionsListContent />;
}
```

**의존성**:
- `useCurrentUser()` (hook) - 확인 필요
- `useRouter()` (next/navigation)
- 기존 `SubmissionsListContent` 컴포넌트 재사용

---

### 6.2 컴포넌트 타입 정의

```typescript
// src/features/grade/types.ts (기존 또는 신규)

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  points_weight: number;
  status: 'draft' | 'published' | 'closed';
  allow_late: boolean;
  allow_resubmission: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  closed_at?: string;
  deleted_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  link?: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  is_late: boolean;
  score?: number;
  feedback?: string;
  graded_at?: string;
  submitted_at: string;
  updated_at: string;
}
```

---

### 6.3 라우팅 규칙

| 경로 | 메서드 | 설명 | 권한 |
|------|--------|------|------|
| `/submissions/list` | GET | 모든 제출물 목록 | instructor |
| `/submissions/[id]/grade` | GET | 채점 페이지 | instructor |
| `/courses/[courseId]/assignments/[assignmentId]/submissions` | GET | 과제별 제출물 목록 | instructor + 코스 소유자 |

---

### 6.4 API 엔드포인트 (기존, 재사용)

```typescript
// 이미 구현됨:
GET /api/submissions/:id/grade       // 제출물 상세 조회
GET /api/grades                       // 학습자 성적 조회
GET /api/instructor/submissions      // 강사 모든 제출물 조회
GET /api/assignments/:id/submissions // 과제별 제출물 조회
PUT /api/submissions/:id/grade       // 채점 저장
```

추가 API 개발 불필요 - 기존 API 재사용

---

## 7. 테스트 항목

### 7.1 단위 테스트 (선택)
- [ ] GlobalNavigation - 채점관리 메뉴 렌더링 확인
- [ ] InstructorAssignmentPage - 제출물 보기 버튼 렌더링 확인
- [ ] 라우팅 함수 - 올바른 URL 생성 확인

### 7.2 통합 테스트
- [ ] 채점관리 메뉴 → `/submissions/list` 접근 성공
- [ ] 과제 카드 → 제출물 목록 페이지 접근 성공
- [ ] 제출물 선택 → 채점 페이지 접근 성공
- [ ] 뒤로가기 버튼 정상 작동

### 7.3 사용성 테스트
- [ ] 강사 역할 사용자 시나리오 검증
- [ ] 학습자 역할 사용자 - 채점관리 메뉴 접근 불가 확인
- [ ] 모바일 기기에서 버튼 접근성 확인
- [ ] 키보드 네비게이션 (Tab, Enter) 정상 작동

### 7.4 보안 테스트
- [ ] 비강사 사용자의 `/submissions/list` 접근 차단 확인
- [ ] 강사가 소유하지 않은 코스의 제출물 접근 차단 (기존 API에서 검증)

---

## 8. 수락 기준 (Acceptance Criteria)

### AC-001: 채점관리 메뉴 활성화
```
Given: 강사 사용자가 로그인되어 있음
When: GlobalNavigation을 봄
Then: "채점관리" 메뉴가 활성 상태로 표시됨
And: "채점관리" 메뉴를 클릭하면 /submissions/list로 이동함
And: 모바일 화면에서도 접근 가능함
```

### AC-002: 과제별 제출물 버튼
```
Given: 강사가 코스별 과제 목록 페이지에 있음 (/courses/[courseId]/assignments)
When: 과제 카드를 봄
Then: "제출물 보기" 버튼이 표시됨
And: 버튼을 클릭하면 /courses/[courseId]/assignments/[assignmentId]/submissions로 이동함
And: 제출물이 없는 과제도 버튼이 표시됨
```

### AC-003: 전체 과제 목록 제출물 링크 (선택)
```
Given: 강사가 전체 과제 관리 페이지에 있음 (/assignments)
When: 과제를 선택함
Then: 모달 또는 상세 페이지에 "제출물 보기" 옵션이 있음
And: 클릭하면 해당 과제의 제출물 목록으로 이동함
```

### AC-004: 권한 검증
```
Given: 학습자 사용자가 /submissions/list에 접근 시도함
When: 페이지가 로드됨
Then: 홈 페이지로 리다이렉트됨
And: 에러 메시지 없이 조용히 처리됨

Given: 강사 사용자가 /submissions/list에 접근함
When: 페이지가 로드됨
Then: 제출물 목록이 정상 표시됨
```

---

## 9. 구현 체크리스트

### 코딩 전
- [ ] 현재 코드 백업 (git branch)
- [ ] 의존성 확인 (lucide-react ChevronRight 아이콘)
- [ ] 타입 정의 확인

### 코딩 중
- [ ] TypeScript 컴파일 오류 0개
- [ ] ESLint 경고 0개
- [ ] 한글 인코딩 문제 없음
- [ ] 코드 포매팅 일관성

### 코딩 후
- [ ] 모든 링크 동작 확인
- [ ] 권한 검증 테스트
- [ ] 모바일 레이아웃 확인
- [ ] 브라우저 호환성 확인
- [ ] 성능 측정 (Lighthouse)

---

## 10. 제약 조건 및 가정

### 제약 조건
1. 새로운 API 개발 금지 - 기존 API만 사용
2. 데이터베이스 변경 금지
3. 기존 기능 수정 최소화
4. 코드 라인 수 최소화

### 가정사항
1. `useCurrentUser()` 훅이 사용자 역할 정보를 제공한다고 가정
2. 기존 API 응답이 기대한 형식이라고 가정
3. 사용자가 로그인된 상태에서만 접근한다고 가정

---

## 11. 위험 요소 및 완화 전략

| 위험 | 영향도 | 가능성 | 완화 전략 |
|------|--------|--------|---------|
| 라우팅 오류 | 높음 | 낮음 | 모든 경로 테스트 |
| 권한 누수 | 높음 | 매우낮음 | 서버/클라이언트 이중 검증 |
| 성능 저하 | 중간 | 낮음 | 프로파일링 + 최적화 |
| 모바일 UX 문제 | 중간 | 중간 | 반응형 테스트 필수 |

---

## 12. 승인 및 검토

### 작성자
- **이름**: AI Assistant (Claude)
- **날짜**: 2025-11-10
- **버전**: 1.0

### 검토자 (예정)
- **이름**: Project Manager
- **날짜**: (검토 대기)

### 최종 승인자 (예정)
- **이름**: Tech Lead
- **날짜**: (승인 대기)

---

**문서 상태**: ✅ **초안 완성** (검토 대기)

다음 단계: 이 스펙을 바탕으로 구현 시작
