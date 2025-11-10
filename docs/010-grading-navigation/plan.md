# 강사 채점 관리 네비게이션 개선 계획

## 1. 개요

현재 강사의 채점 관리 기능(Feature 010)은 **백엔드 API, 페이지, 컴포넌트가 모두 구현**되어 있으나, **UI 네비게이션이 불완전**하여 사용자가 자연스럽게 접근할 수 없는 상태입니다.

- **버전**: 1.0
- **담당자**: Senior Developer
- **최종 목표**: 강사가 네비게이션 메뉴 또는 과제 관리 페이지에서 자연스럽게 채점 관리 기능에 접근할 수 있도록 개선

---

## 2. 현재 상태 분석

### 2.1 구현된 부분
- ✅ **Backend API**: `/api/submissions/:id/grade`, `/api/grades`, `/api/instructor/submissions` 등 5개 엔드포인트
- ✅ **페이지**: `/submissions/[submissionId]/grade`, `/submissions/list`, `/courses/[courseId]/assignments/[assignmentId]/submissions`
- ✅ **컴포넌트**: GradeSubmissionForm, SubmissionDetails, SubmissionsList 등
- ✅ **비즈니스 로직**: gradeSubmissionService, getSubmissionForGradingService 등
- ✅ **권한 검증**: 강사 권한, 코스 소유권 검증

### 2.2 미구현된 부분 (네비게이션)
- ❌ **GlobalNavigation**: "채점관리" 메뉴 disabled → 활성화 필요
- ❌ **InstructorAssignmentPage**: 개별 과제에서 "제출물 보기" 버튼 없음
- ❌ **InstructorAllAssignmentsPage**: 전체 과제 목록에서 제출물 링크 없음
- ❌ **제출물 목록 페이지 고아화**: URL 직접 입력으로만 접근 가능

### 2.3 현재 접근 경로
```
강사 대시보드 → "최근 제출물" → "검토" 버튼 → /submissions/{id}/review
```
⚠️ **문제**: 매우 제한된 경로만 존재. 특정 과제의 모든 제출물을 보려면 URL 직접 입력 필요

---

## 3. 요구사항 분석

### 3.1 사용자 요구사항 (Userflow 기준)
[docs/userflow.md - 9. 과제 관리 (Instructor)]
- 강사가 과제 목록에서 제출물 테이블에 접근 가능
- 필터(미채점/지각/재제출요청) 적용 가능
- 개별 제출물 채점 UI 제공

### 3.2 구현 요구사항
1. **채점관리 메뉴 활성화**: 글로벌 네비게이션에서 "채점관리" 메뉴 접근 가능
2. **과제별 제출물 보기**: 과제 관리 페이지에서 "제출물 보기" 버튼으로 접근
3. **제출물 목록 페이지**: 특정 과제의 모든 제출물 조회 및 필터링
4. **채점 페이지**: 개별 제출물 채점 및 피드백 입력

### 3.3 기술 요구사항
- Next.js App Router 사용
- React Query 데이터 패칭
- Zod 스키마 검증
- TypeScript 타입 안전성
- Tailwind CSS 스타일링

---

## 4. 구현 계획

### Phase 1: 네비게이션 메뉴 활성화

#### 1-1. GlobalNavigation.tsx 수정
**파일**: `/src/components/GlobalNavigation.tsx` (L142-150)

**변경 사항**:
```typescript
// Before (비활성화 상태)
<Link href="#" className="...text-gray-400 cursor-not-allowed" onClick={(e) => e.preventDefault()}>
  채점관리
</Link>

// After (활성화 상태)
<Link href="/submissions/list" className="...text-gray-700 hover:text-blue-600">
  채점관리
</Link>
```

**영향도**:
- 글로벌 네비게이션 메뉴 추가 (학습자 UX에는 영향 없음)
- 강사만 접근 가능하도록 권한 검증은 페이지에서 수행

---

### Phase 2: 과제 관리 페이지에 제출물 버튼 추가

#### 2-1. InstructorAssignmentPage.tsx 수정
**파일**: `/src/features/assignment/components/InstructorAssignmentPage.tsx`

**변경 사항**:
- 각 과제 카드에 "제출물 보기" 버튼 추가
- 클릭 시 `/courses/[courseId]/assignments/[assignmentId]/submissions`로 이동

**코드 구조**:
```typescript
// 기존: "수정", "삭제" 버튼만 존재
// 추가할 부분:
<Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}/submissions`)}
>
  제출물 보기
  <ChevronRight className="h-4 w-4" />
</Button>
```

**위치**: 각 과제 아이템의 액션 영역 (컴포넌트: AssignmentCard 또는 유사)

---

#### 2-2. InstructorAllAssignmentsPage.tsx 수정
**파일**: `/src/features/assignment/components/InstructorAllAssignmentsPage.tsx`

**변경 사항**:
- 초안/마감/과목별 과제 목록 섹션에서 과제 클릭 시 상세 페이지로 이동
- 또는 각 과제 카드에 "제출물 보기" 버튼 추가

**영향도**:
- 기존 모달 기반 네비게이션 유지
- 모달 내에 "제출물 보기" 버튼 추가 (선택)

---

### Phase 3: 채점 관리 대시보드 페이지 생성 (선택사항)

#### 3-1. 채점 관리 전용 페이지 (선택)
**파일**: `/src/app/(protected)/submissions/list/page.tsx` (이미 존재)

**기능 강화 사항**:
- 미채점 제출물 목록 기본 표시
- 과제/코스별 필터링
- 상태별 필터링 (미채점, 채점완료, 재제출요청)
- 우선순위 정렬 (마감 임박 순)

**UI 개선**:
- 현재 페이지 레이아웃 최적화
- 상태별 배지 명확화
- 빠른 이동 링크 추가

---

## 5. 상세 구현 단계

### Step 1: GlobalNavigation.tsx 수정
**시간 예상**: 10분
**복잡도**: ⭐ (매우 낮음)

```typescript
// src/components/GlobalNavigation.tsx

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

---

### Step 2: InstructorAssignmentPage.tsx에 제출물 버튼 추가
**시간 예상**: 15-20분
**복잡도**: ⭐⭐ (낮음)

**구현 위치**: 과제 카드의 액션 영역

```typescript
// src/features/assignment/components/InstructorAssignmentPage.tsx

<div className="flex gap-2">
  {/* 기존 버튼 */}
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

---

### Step 3: InstructorAllAssignmentsPage.tsx에 제출물 링크 추가
**시간 예상**: 20-25분
**복잡도**: ⭐⭐ (낮음)

**구현 방식**:
- Option A: 모달 내에 "제출물 보기" 버튼 추가
- Option B: 과제 카드를 클릭 가능하게 하여 `/courses/[courseId]/assignments/[assignmentId]/submissions`로 이동

**권장**: Option B (더 직관적)

```typescript
// 모달 다이얼로그에 추가
<DialogFooter>
  <Button
    variant="outline"
    onClick={() => {
      setIsOpen(false);
      router.push(
        `/courses/${assignment.course_id}/assignments/${assignment.id}/submissions`
      );
    }}
  >
    제출물 보기
  </Button>
  <Button onClick={() => setIsOpen(false)}>닫기</Button>
</DialogFooter>
```

---

### Step 4: 페이지 권한 검증 강화
**시간 예상**: 10분
**복잡도**: ⭐⭐ (낮음)

**파일**: `/src/app/(protected)/submissions/list/page.tsx`

**검증 내용**:
- 사용자가 강사인지 확인
- 필요시 `/instructor-dashboard`로 리다이렉트

```typescript
'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SubmissionsListPage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'instructor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== 'instructor') {
    return <LoadingSpinner />;
  }

  return <SubmissionsListPageContent />;
}
```

---

### Step 5: 통합 테스트 및 검증
**시간 예상**: 15-20분
**복잡도**: ⭐⭐⭐ (중간)

**테스트 항목**:
1. ✅ GlobalNavigation "채점관리" 메뉴 클릭 → `/submissions/list` 접근 가능
2. ✅ 과제 목록 → "제출물 보기" 버튼 → 제출물 목록 페이지 접근
3. ✅ 제출물 목록 → "채점" 버튼 → 채점 페이지 접근
4. ✅ 권한 검증 (강사 아님 → 리다이렉트)
5. ✅ 네비게이션 뒤로가기 정상 작동
6. ✅ 모바일 반응형 레이아웃 확인

---

## 6. 영향도 분석

### 6.1 변경 범위
```
수정 파일:
- src/components/GlobalNavigation.tsx (1줄 변경)
- src/features/assignment/components/InstructorAssignmentPage.tsx (10-15줄 추가)
- src/features/assignment/components/InstructorAllAssignmentsPage.tsx (10-15줄 추가)
- src/app/(protected)/submissions/list/page.tsx (권한 검증 로직 추가)

신규 파일: 없음
```

### 6.2 기존 기능 영향
- ✅ 학습자 UX: 영향 없음 (강사 메뉴만 변경)
- ✅ 기존 채점 기능: 영향 없음 (네비게이션만 추가)
- ✅ API: 영향 없음 (기존 API 그대로 사용)
- ✅ DB: 영향 없음 (데이터 구조 변경 없음)

### 6.3 성능 영향
- 📊 미미함 (네비게이션 링크만 추가)

---

## 7. 구현 순서 및 일정

| 단계 | 작업 | 예상 시간 | 우선순위 |
|------|------|---------|---------|
| 1 | GlobalNavigation.tsx 수정 | 10분 | 🔴 높음 |
| 2 | InstructorAssignmentPage.tsx 수정 | 20분 | 🔴 높음 |
| 3 | InstructorAllAssignmentsPage.tsx 수정 | 25분 | 🟡 중간 |
| 4 | 권한 검증 강화 | 10분 | 🟡 중간 |
| 5 | 통합 테스트 및 QA | 20분 | 🟢 낮음 |
| **총계** | | **85분** | |

---

## 8. 확인 체크리스트

### 구현 전
- [ ] 현재 코드 상태 백업
- [ ] 브랜치 생성 (`feature/grading-navigation`)
- [ ] 의존성 확인 (lucide-react, react-router 등)

### 구현 중
- [ ] 타입스크립트 컴파일 오류 없음
- [ ] ESLint 경고 없음
- [ ] 한글 인코딩 확인

### 구현 후
- [ ] 브라우저에서 모든 링크 동작 확인
- [ ] 권한 검증 테스트 (강사/학습자)
- [ ] 모바일 레이아웃 확인
- [ ] Git 커밋 메시지 작성
- [ ] PR 생성 및 코드 리뷰

---

## 9. 참고 자료

### 관련 문서
- [Feature 010 Spec](../010/spec.md)
- [Userflow - 9. 과제 관리](../userflow.md#9-과제-관리-instructor)
- [Database Schema - assignments, submissions](../database.md)

### 관련 파일
```
# 네비게이션
src/components/GlobalNavigation.tsx

# 과제 관리 페이지
src/features/assignment/components/InstructorAssignmentPage.tsx
src/features/assignment/components/InstructorAllAssignmentsPage.tsx

# 제출물 목록 페이지
src/app/(protected)/submissions/list/page.tsx

# 채점 페이지
src/app/submissions/[submissionId]/grade/page.tsx

# 백엔드 API
src/features/grade/backend/route.ts
src/features/grade/backend/service.ts
```

---

## 10. 향후 개선 사항 (선택)

1. **채점 관리 대시보드 심화**: 미채점 수, 마감 임박 수 등 요약 정보 표시
2. **일괄 채점 기능**: 여러 제출물 한 번에 채점
3. **채점 통계**: 평균 점수, 분포 그래프 등
4. **알림 시스템**: 제출물 수신 시 강사에게 알림
5. **채점 히스토리**: 수정 기록 조회

---

## 승인

- **작성자**: AI Assistant (Claude)
- **검토자**: Senior Developer (요청 대기)
- **최종 승인자**: Project Manager (요청 대기)

---

**계획 상태**: ✅ **작성 완료** (2025-11-10)

다음 단계: 사용자 승인 후 구현 시작
