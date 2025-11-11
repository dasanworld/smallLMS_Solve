# 📚 문서 관리 가이드

## 📋 현재 문서 구조

### 🎯 핵심 문서 (필독)

| 문서 | 설명 | 대상 |
|------|------|------|
| `prd.md` | 제품 요구사항 정의서 | 기획/개발 |
| `database.md` | 데이터베이스 스키마 | 개발자 |
| `userflow.md` | 사용자 흐름도 | 기획/개발 |
| `specadd.md` | 추가 사양서 | 개발자 |

### 📦 구현 계획 (참고용)

| 문서 | 설명 |
|------|------|
| `IMPLEMENTATION_CHECKLIST.md` | 구현 체크리스트 |
| `IMPLEMENTATION-ROADMAP.md` | 구현 로드맵 |
| `usecase-checker.md` | 유스케이스 검증 |

### 📁 기능별 상세 문서 (001-012)

각 폴더는 특정 기능별로 정리:
- `plan.md` - 기능 계획
- `spec.md` - 기능 사양

**예**: `001/plan.md` - 001 기능 계획

---

## ✅ 정리된 내용

### 🗑️ 삭제된 문서들 (중복/보관 완료)

**E2E 테스트 관련** (총 10개):
- E2E_INSTRUCTOR_TESTING.md
- E2E_LEARNER_TESTS.md
- LEARNER_COMPLETE_JOURNEY_*.md (2개)
- LEARNER_E2E_TESTS_*.md (2개)
- LEARNER_FROM_SCRATCH_GUIDE.md
- QUICK_START_INSTRUCTOR_E2E.md
- LEARNER_COURSES_IMPLEMENTATION.md
- README_LEARNER_COURSES.md

**시스템 아키텍처** (총 1개):
- INSTRUCTOR_SYSTEM_ARCHITECTURE.md

**정책/정의** (총 6개):
- PHASE1-2-COMPLETION.md
- api-policy-*.md (2개)
- REDIRECT_POLICY.md
- MIGRATION_GUIDE.md

**랜딩페이지** (총 3개):
- LANDING_PAGE_*.md (3개)
- CHANGELOG-CTO-REVIEW.md

**총 삭제**: 20개 문서

---

## 📍 E2E 테스트 관련 핵심 정보

### 테스트 실행 방법

```bash
# 전체 E2E 테스트 실행
npm run test:e2e

# 순차 실행 (워크플로우 테스트)
WORKFLOW_TEST=true npm run test:e2e -- --project=chromium

# UI 모드로 실행
npm run test:e2e:ui
```

### 테스트 구조

**위치**: `e2e/tests/*.spec.ts`

**주요 테스트 파일**:
- `auth.spec.ts` - 인증 테스트
- `course.spec.ts` - 강좌 관리 테스트
- `assignment.spec.ts` - 과제 관리 테스트
- `dashboard.spec.ts` - 대시보드 테스트
- `instructor-workflow.spec.ts` - 강사 워크플로우
- `learner-workflow.spec.ts` - 학습자 워크플로우
- `complete-workflow.spec.ts` - 전체 워크플로우

### 테스트 도구

- **프레임워크**: Playwright
- **설정**: `playwright.config.ts`
- **Fixture**: `e2e/fixtures/auth.ts`
- **Helper**: `e2e/helpers/*.ts`

---

## 🚀 빠른 시작

### 1. 개발 서버 시작
```bash
npm run dev
```

### 2. E2E 테스트 실행
```bash
WORKFLOW_TEST=true npm run test:e2e -- --project=chromium
```

### 3. 테스트 UI 모드
```bash
npm run test:e2e:ui
```

---

## 🔗 관련 링크

**설정 파일**:
- `playwright.config.ts` - Playwright 설정
- `.ruler/guideline.md` - 개발 가이드라인
- `tsconfig.json` - TypeScript 설정

**소스 코드**:
- `src/app/api/[[...hono]]/route.ts` - API 라우트
- `src/backend/hono/app.ts` - Hono 앱
- `e2e/setup.ts` - E2E Setup

---

## 💡 핵심 가이드

### 테스트 작성 시
1. `authTest` fixture 사용
2. `describe.configure({ mode: 'serial' })` - 순차 실행
3. `integration-test-data.json` - 데이터 공유
4. `console.log()` - 진행 로깅

### 주요 패턴
```typescript
// 순차 실행
authTest.describe('테스트', () => {
  authTest.describe.configure({ mode: 'serial' });
  
  authTest('테스트 1', async ({ page }) => {
    // 테스트 코드
  });
});

// 데이터 공유
const data = loadIntegrationData();
data.courseId = courseId;
saveIntegrationData(data);
```

---

## 📞 도움말

### 테스트 실패 시
1. 로그 확인: `tail /tmp/e2e-workflow-final.log`
2. Playwright Inspector 사용: `--debug`
3. 개별 테스트 실행: `npx playwright test <file.spec.ts>`

### API 문제 시
- Hono API 확인: `src/backend/hono/app.ts`
- 라우트 정의: `src/features/*/backend/route.ts`
- Bearer 토큰 확인: `e2e/fixtures/auth.ts`

---

**마지막 정리**: 2025-11-11  
**정리 내용**: E2E 테스트 관련 문서 20개 정리, 핵심 문서만 보관

