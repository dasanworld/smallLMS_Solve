# 강사 대시보드 E2E 테스트 가이드

## 개요

이 문서는 강사 대시보드와 관련된 모든 E2E 테스트의 실행 방법과 테스트 시나리오를 설명합니다.

## 테스트 파일 위치

- **강사 E2E 테스트**: `e2e/tests/instructor.spec.ts`
- **테스트 Fixture**: `e2e/fixtures/auth.ts`
- **Playwright Config**: `playwright.config.ts` (프로젝트 루트)

## 테스트 범위

### 1. 강사 대시보드 (`/instructor-dashboard`)
- ✅ 강사 대시보드 기본 표시
- ✅ 메트릭 데이터 표시 (코스 수, 학생 수, 과제 수, 채점 대기)
- ✅ 내 코스 섹션 표시
- ✅ 최근 제출물 섹션 표시
- ✅ 채점 대기 카운터 표시
- ✅ API 엔드포인트 테스트 (`GET /api/dashboard/instructor`)
- ✅ 학습자의 강사 대시보드 접근 시 리다이렉트

### 2. 강사 코스 관리 (`/courses`)
- ✅ 코스 목록 페이지 표시
- ✅ 코스 생성 기능
- ✅ 코스 정보 수정
- ✅ 코스 상태 변경 (draft → published → archived)
- ✅ API 엔드포인트 테스트 (`GET /api/courses/my`)

### 3. 강사 전체 과제 관리 (`/assignments`)
- ✅ 전체 과제 관리 페이지 표시
- ✅ 초안 과제 섹션 표시
- ✅ 발행 과제 섹션 표시
- ✅ 마감 과제 섹션 표시

### 4. 강사 개별 코스 과제 관리 (`/courses/[courseId]/assignments`)
- ✅ 코스별 과제 목록 표시
- ✅ 과제 생성 기능
- ✅ 과제 수정 기능

### 5. 강사 제출물 관리 (`/courses/[courseId]/assignments/[assignmentId]/submissions`)
- ✅ 제출물 목록 조회

### 6. 강사 채점 (`/submissions/[submissionId]/grade`)
- ✅ 채점 페이지 접근
- ✅ 점수 입력 및 제출

### 7. 역할 기반 접근 제어
- ✅ 학습자의 강사 페이지 접근 차단
- ✅ 학습자의 강사 API 접근 차단
- ✅ 인증되지 않은 사용자의 강사 API 접근 차단

### 8. 통합 워크플로우
- ✅ 강사가 코스 생성 → 과제 생성 → 대시보드에서 확인하는 전체 흐름

## 테스트 실행 방법

### 사전 준비

1. **테스트 사용자 계정 생성**
   ```bash
   # 다음 정보로 강사 및 학습자 계정 생성
   강사:
   - 이메일: instructor@example.com
   - 비밀번호: password123
   - 역할: instructor

   학습자:
   - 이메일: learner@example.com
   - 비밀번호: password123
   - 역할: learner
   ```

2. **환경 변수 설정**
   ```bash
   # .env.local 또는 환경 변수 설정
   BASE_URL=http://localhost:3000
   INSTRUCTOR_EMAIL=instructor@example.com
   INSTRUCTOR_PASSWORD=password123
   LEARNER_EMAIL=learner@example.com
   LEARNER_PASSWORD=password123
   ```

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```

### 전체 E2E 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# 또는
npx playwright test
```

### 강사 테스트만 실행

```bash
# 강사 테스트만 실행
npx playwright test instructor.spec.ts

# 또는
npm run test:e2e -- instructor.spec.ts
```

### 특정 테스트만 실행

```bash
# 강사 대시보드 테스트만 실행
npx playwright test instructor.spec.ts --grep "강사 대시보드"

# 코스 관리 테스트만 실행
npx playwright test instructor.spec.ts --grep "강사 코스 관리"

# 과제 관리 테스트만 실행
npx playwright test instructor.spec.ts --grep "강사 과제 관리"

# 채점 테스트만 실행
npx playwright test instructor.spec.ts --grep "강사 채점"
```

### UI 모드에서 테스트 실행

```bash
# UI 모드 (실시간 테스트 시청)
npx playwright test instructor.spec.ts --ui
```

### 헤드리스 모드에서 실행

```bash
# 헤드리스 모드 (기본값)
npx playwright test instructor.spec.ts --headed=false
```

### 디버그 모드에서 실행

```bash
# 디버그 모드
npx playwright test instructor.spec.ts --debug
```

## 테스트 Fixture 사용법

### 기본 Fixture

#### `instructorPage`
인증된 강사 세션의 Page 객체를 제공합니다.

```typescript
authTest('should do something', async ({ instructorPage }) => {
  const page = instructorPage;
  await page.goto('/instructor-dashboard');
  // 테스트 코드
});
```

#### `learnerPage`
인증된 학습자 세션의 Page 객체를 제공합니다.

```typescript
authTest('should do something', async ({ learnerPage }) => {
  const page = learnerPage;
  await page.goto('/dashboard');
  // 테스트 코드
});
```

#### `instructor`
강사 사용자 정보 (토큰 포함) 객체를 제공합니다.

```typescript
authTest('should test API', async ({ instructor }) => {
  const response = await page.request.get('/api/dashboard/instructor', {
    headers: {
      Authorization: `Bearer ${instructor.token}`,
    },
  });
  // API 테스트 코드
});
```

#### `learner`
학습자 사용자 정보 (토큰 포함) 객체를 제공합니다.

```typescript
authTest('should test API', async ({ learner }) => {
  const response = await page.request.get('/api/auth/profile', {
    headers: {
      Authorization: `Bearer ${learner.token}`,
    },
  });
  // API 테스트 코드
});
```

#### `authenticatedInstructor`
인증된 강사의 Page와 사용자 정보를 모두 포함합니다.

```typescript
authTest('should do something', async ({ authenticatedInstructor }) => {
  const { page, user } = authenticatedInstructor;
  // page: Page 객체
  // user: { email, name, role, token, id }
});
```

#### `authenticatedLearner`
인증된 학습자의 Page와 사용자 정보를 모두 포함합니다.

```typescript
authTest('should do something', async ({ authenticatedLearner }) => {
  const { page, user } = authenticatedLearner;
  // page: Page 객체
  // user: { email, name, role, token, id }
});
```

## 테스트 시나리오 상세

### 시나리오 1: 강사 대시보드 기본 기능

```typescript
// 강사 대시보드 접근 및 내용 확인
authTest('should display instructor dashboard', async ({ instructorPage }) => {
  const page = instructorPage;

  // 강사 대시보드로 이동
  await page.goto('/instructor-dashboard');

  // 제목 확인
  await expect(page.locator('h1:has-text("강사 대시보드")')).toBeVisible();

  // 메트릭 확인
  const metricsCards = page.locator('[class*="metric"]');
  expect(await metricsCards.count()).toBeGreaterThan(0);

  // 코스 섹션 확인
  await expect(
    page.locator('[class*="CardTitle"]:has-text("내 코스")')
  ).toBeVisible();
});
```

### 시나리오 2: 코스 생성

```typescript
// 강사가 새 코스를 생성
authTest('should create a new course', async ({ instructorPage }) => {
  const page = instructorPage;
  const courseName = `Test Course ${Date.now()}`;

  // 코스 관리 페이지로 이동
  await page.goto('/courses');

  // 새 코스 생성 버튼 클릭
  await page.click('button:has-text("새 코스 생성")');

  // 코스명 입력
  await page.fill('input[name="title"]', courseName);

  // 제출
  await page.click('button:has-text("생성")');

  // 생성 확인
  await expect(page.locator(`text=${courseName}`)).toBeVisible();
});
```

### 시나리오 3: 역할 기반 접근 제어

```typescript
// 학습자가 강사 대시보드에 접근 시도하면 리다이렉트됨
authTest('should redirect learner to learner dashboard', async ({ learnerPage }) => {
  const page = learnerPage;

  // 강사 대시보드 접근 시도
  await page.goto('/instructor-dashboard', { waitUntil: 'networkidle' });

  // 학습자 대시보드로 리다이렉트 확인
  await expect(page).toHaveURL('/dashboard');
});
```

## 테스트 결과 확인

### 테스트 리포트 생성

```bash
# 테스트 실행 후 리포트 생성
npm run test:e2e
```

### 리포트 보기

```bash
# HTML 리포트 보기
npx playwright show-report
```

### 스크린샷 확인

실패한 테스트의 경우 자동으로 스크린샷이 저장됩니다.
- 위치: `test-results/` 디렉토리
- 파일명: `{테스트명}-failed.png`

## 문제 해결

### 테스트 타임아웃 해결

```typescript
// 특정 요소 대기 시간 증가
await page.waitForSelector('[data-testid="course-list"]', { timeout: 10000 });

// URL 변경 대기 시간 증가
await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10000 });
```

### 로그인 실패 해결

1. 테스트 사용자 계정 존재 확인
2. 환경 변수 설정 확인 (BASE_URL, 이메일, 비밀번호)
3. 개발 서버 실행 확인
4. Supabase 연결 상태 확인

### API 테스트 실패 해결

1. 토큰 생성 확인
2. Authorization 헤더 포함 확인
3. API 엔드포인트 경로 확인
4. CORS 설정 확인

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright
        run: npx playwright install

      - name: Start dev server
        run: npm run dev &
        env:
          BASE_URL: http://localhost:3000

      - name: Wait for server
        run: sleep 5

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          INSTRUCTOR_EMAIL: instructor@example.com
          INSTRUCTOR_PASSWORD: password123
          LEARNER_EMAIL: learner@example.com
          LEARNER_PASSWORD: password123

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 추가 자료

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API 레퍼런스](https://playwright.dev/docs/api/class-page)

## 문의 및 기여

E2E 테스트에 관한 질문이나 개선 사항이 있으면 PR을 제출해주세요.
