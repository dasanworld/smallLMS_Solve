# 리다이렉트 정책 (Redirect Policy)

## 개요

사용자의 인증 상태와 역할(role)에 따라 적절한 페이지로 자동 이동하는 정책입니다.

---

## 1. 경로 분류

### 1.1 공개 경로 (Public Paths)

모든 사용자가 접근 가능하며, 인증 여부와 관계없이 접근할 수 있습니다.

| 경로 | 설명 | 대상 |
|------|------|------|
| `/` | 랜딩페이지/홈 | 비로그인 사용자: 프로젝트 소개, 로그인/회원가입 버튼<br/>로그인 사용자: 역할별 대시보드 링크 |
| `/login` | 로그인 페이지 | 비로그인 사용자 |
| `/signup` | 회원가입 페이지 | 비로그인 사용자 |
| `/_next/*` | Next.js 정적 파일 | 전체 |
| `/api/*` | API 라우트 | 전체 |

### 1.2 보호된 경로 (Protected Paths)

인증된 사용자만 접근 가능하며, 역할 검증이 추가로 수행됩니다.

| 경로 | 설명 | 필요 역할 | 비허가시 리다이렉트 |
|------|------|---------|-------------------|
| `/dashboard` | 학습자 대시보드 | `learner` | `/instructor-dashboard` |
| `/instructor-dashboard` | 강사 대시보드 | `instructor` | `/dashboard` |
| `/courses` | 강사 코스 관리 페이지 | `instructor` | `/dashboard` |
| `/explore-courses` | 학습자 코스 탐색 페이지 | `learner` | `/dashboard` |
| `/courses/[id]` | 코스 상세 페이지 | `instructor` | `/dashboard` |
| `/courses/[id]/assignments` | 과제 관리 페이지 | `instructor` | `/dashboard` |
| `/courses/[id]/submissions` | 제출물 채점 페이지 | `instructor` | `/dashboard` |

---

## 2. 인증 흐름 (Authentication Flow)

### 2.1 로그인 전 (Unauthenticated)

#### 시나리오 1: 공개 경로 접근
```
사용자 접근 경로: / (홈), /login, /signup
↓
그대로 진행 (리다이렉트 없음)
```

#### 시나리오 2: 보호된 경로 접근
```
사용자 접근 경로: /dashboard, /courses, etc.
↓
middleware.ts에서 감지
↓
/login?redirectedFrom=[originalPath] 리다이렉트
(예: /dashboard 접근 → /login?redirectedFrom=/dashboard)
```

### 2.2 로그인 중 (Login Form Submission)

```
로그인 폼 제출
↓
src/app/login/page.tsx의 handleLogin() 실행
↓
로그인 성공
↓
리다이렉트 결정:
  1. redirectedFrom 파라미터 있음 → 해당 경로로 이동
  2. redirectedFrom 파라미터 없음 → /dashboard로 이동
```

### 2.3 회원가입 완료 (Signup Completion)

```
회원가입 폼 제출
↓
src/features/auth/backend/service.ts의 signupUserService() 실행
↓
회원가입 성공
↓
리다이렉트 결정 (역할 기반):
  - role === 'learner'  → /dashboard (학습자 대시보드)
  - role === 'instructor' → /instructor-dashboard (강사 대시보드)
```

---

## 3. 페이지별 역할 검증 (Page-Level Role Validation)

각 페이지는 로드 시점에 사용자 역할을 검증하고, 비허가 사용자를 리다이렉트합니다.

### 3.1 학습자 대시보드 (`/dashboard`)

**구현 위치**: `src/app/(protected)/dashboard/page.tsx:43-47`

```typescript
useEffect(() => {
  if (userProfile && userProfile.role !== 'learner') {
    router.replace('/instructor-dashboard');
  }
}, [userProfile, router]);
```

**정책**:
- `learner` 역할만 접근 가능
- `instructor`가 접근하면 `/instructor-dashboard`로 리다이렉트

### 3.2 강사 대시보드 (`/instructor-dashboard`)

**구현 위치**: `src/app/(protected)/instructor-dashboard/page.tsx:43-47`

```typescript
useEffect(() => {
  if (userProfile && userProfile.role !== 'instructor') {
    router.replace('/dashboard');
  }
}, [userProfile, router]);
```

**정책**:
- `instructor` 역할만 접근 가능
- `learner`가 접근하면 `/dashboard`로 리다이렉트

### 3.3 강사 코스 관리 (`/courses`)

**구현 위치**: `src/app/(protected)/courses/page.tsx:42-56`

```typescript
useEffect(() => {
  if (userProfile && userProfile.role !== 'instructor') {
    router.replace('/dashboard');
  }
}, [userProfile, router]);
```

**정책**:
- `instructor` 역할만 접근 가능
- `learner`가 접근하면 `/dashboard`로 리다이렉트

### 3.4 학습자 코스 탐색 (`/explore-courses`)

**구현 위치**: `src/app/(protected)/explore-courses/page.tsx:15-18`

```typescript
if (user && user.role === 'instructor') {
  redirect('/dashboard');
}
```

**정책**:
- `learner` 역할만 접근 가능
- `instructor`가 접근하면 `/dashboard`로 리다이렉트
- (Server Component에서 `redirect()` 함수 사용)

---

## 4. 역할 값 정의 (Role Values)

| 역할 | 값 | 설명 |
|------|-----|------|
| 학습자 | `'learner'` | 학생, 과정 수강 |
| 강사 | `'instructor'` | 교사, 과정 강의 |
| **기본값** | `'learner'` | 역할 정보 없을 시 적용 |

---

## 5. 구현 레이어

### 5.1 미들웨어 계층 (`middleware.ts`)

**담당**: 비로그인 사용자의 보호된 경로 접근 차단

```
모든 요청 → middleware.ts 검사
  ├─ 비로그인 + 보호된 경로 → /login?redirectedFrom=... 리다이렉트
  ├─ 비로그인 + 공개 경로 → 그대로 진행
  ├─ 로그인 + 모든 경로 → 그대로 진행 (페이지 단계 검증 수행)
  └─ 정적 자산 → 그대로 진행
```

### 5.2 페이지 계층 (Client/Server Component)

**담당**: 인증된 사용자의 역할별 페이지 접근 제어

```
페이지 로드 → useCurrentUser() or redirect() 실행
  ├─ 역할 확인
  ├─ 비허가 역할 → 역할별 페이지로 리다이렉트
  └─ 허가된 역할 → 페이지 렌더링
```

### 5.3 서버 로직 계층 (Backend Service)

**담당**: 회원가입 완료 후 역할별 리다이렉트 결정

```
회원가입 완료 → signupUserService() 실행
  ├─ learner 확인 → /dashboard 반환
  └─ instructor 확인 → /instructor-dashboard 반환
```

---

## 6. 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│                  사용자 요청 (Request)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           middleware.ts (인증 상태 검증)                    │
│  ├─ 로그인 여부 확인                                        │
│  ├─ 보호된 경로 판단                                        │
│  └─ 비로그인 + 보호경로 → /login으로 리다이렉트            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    페이지 렌더링                             │
│  ├─ useCurrentUser() 호출 (인증 상태 조회)                 │
│  ├─ 역할 기반 접근 제어                                     │
│  └─ 비허가 역할 → 역할별 대시보드로 리다이렉트             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  페이지 콘텐츠 표시                          │
│  ├─ 학습자 대시보드 (/dashboard)                           │
│  ├─ 강사 대시보드 (/instructor-dashboard)                  │
│  └─ 랜딩페이지 (/)                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 주요 파일 참고

| 파일 | 역할 | 라인 |
|------|------|------|
| `middleware.ts` | 비로그인 사용자 보호 경로 차단 | 54-66 |
| `src/constants/auth.ts` | 공개/보호 경로 정의 | 3, 8 |
| `src/app/page.tsx` | 랜딩페이지 (비로그인/로그인 모두 접근) | - |
| `src/app/login/page.tsx` | 로그인 페이지 및 redirectedFrom 처리 | 23-28, 46-49 |
| `src/features/auth/backend/service.ts` | 회원가입 완료 후 리다이렉트 결정 | 154-155 |
| `src/app/(protected)/dashboard/page.tsx` | 학습자 역할 검증 | 43-47 |
| `src/app/(protected)/instructor-dashboard/page.tsx` | 강사 역할 검증 | 43-47 |
| `src/app/(protected)/courses/page.tsx` | 강사 역할 검증 | 42-56 |
| `src/app/(protected)/explore-courses/page.tsx` | 학습자 역할 검증 | 15-18 |

---

## 8. 정책 적용 체크리스트

- [x] 비로그인 사용자는 `/`(랜딩페이지)에 접근 가능
- [x] 비로그인 사용자가 보호된 경로 접근 시 로그인 페이지로 리다이렉트
- [x] 로그인 성공 후 `redirectedFrom` 파라미터로 원래 경로로 복귀
- [x] 회원가입 완료 후 역할별로 `/dashboard` 또는 `/instructor-dashboard`로 이동
- [x] 학습자는 `/dashboard`, `/explore-courses`에만 접근 가능
- [x] 강사는 `/instructor-dashboard`, `/courses`에만 접근 가능
- [x] 역할 비허가 시 역할별 기본 대시보드로 자동 리다이렉트

---

## 9. 향후 개선사항

- [ ] 운영자(operator) 역할 추가 시 리다이렉트 규칙 확장
- [ ] 페이지별 역할 검증 로직을 HOC나 미들웨어로 통합
- [ ] 리다이렉트 히스토리 로깅 기능 추가
