# 강사 E2E 테스트 빠른 시작 가이드

## 5분 안에 테스트 시작하기

### Step 1: 환경 설정 (1분)

```bash
# 프로젝트 루트에서 실행
cd /Volumes/CORSAIR/data/webapp/dev/01_02smallLMS_Solve

# 환경 변수 확인 (이미 설정되어 있어야 함)
# .env.local 파일 확인
```

### Step 2: 개발 서버 시작 (1분)

```bash
# 터미널 1
npm run dev

# 대기: "ready started server on 0.0.0.0:3000"
```

### Step 3: 테스트 사용자 계정 확인 (1분)

**강사 계정**:
- 이메일: `instructor@example.com`
- 비밀번호: `password123`
- 역할: `instructor`

**학습자 계정**:
- 이메일: `learner@example.com`
- 비밀번호: `password123`
- 역할: `learner`

> 만약 계정이 없다면 회원가입 페이지 `/signup`에서 생성하세요.

### Step 4: E2E 테스트 실행 (2분)

```bash
# 터미널 2 (새로운 터미널 창)
# 강사 E2E 테스트 실행
npm run test:e2e -- instructor.spec.ts

# 또는 UI 모드로 실행 (권장)
npm run test:e2e:ui -- instructor.spec.ts
```

---

## 테스트 결과 확인

### UI 모드 (권장)

```bash
npm run test:e2e:ui -- instructor.spec.ts
```

- 브라우저 창이 자동으로 열림
- 실시간으로 테스트 진행 상황 확인
- 각 테스트를 개별 실행 가능

### HTML 리포트

```bash
# 테스트 후
npm run test:e2e:report

# HTML 리포트 자동 오픈
```

### 콘솔 출력

```bash
npm run test:e2e -- instructor.spec.ts

# 출력 예:
# ✓ 강사 대시보드 (/instructor-dashboard) > should display instructor dashboard
# ✓ 강사 코스 관리 (/courses) > should display course list page
# ...
```

---

## 자주 하는 실수 및 해결

### 문제: "Failed to create user profile"
**원인**: 테스트 사용자 계정이 없음
**해결**:
```bash
# 브라우저에서 http://localhost:3000/signup 방문
# 위의 테스트 사용자 정보로 계정 생성
```

### 문제: "Timeout waiting for /api/dashboard/instructor"
**원인**: 개발 서버가 실행 중이 아님
**해결**:
```bash
npm run dev  # 터미널 1에서 실행 중인지 확인
```

### 문제: "Element not found"
**원인**: 페이지 로드 지연
**해결**: 자동으로 재시도되므로 기다리기

---

## 주요 테스트 항목

### 1️⃣ 강사 대시보드 기본 테스트
```bash
npm run test:e2e -- instructor.spec.ts --grep "강사 대시보드"
```
✅ 대시보드 표시
✅ 메트릭 표시
✅ 코스 목록 표시
✅ 최근 제출물 표시

### 2️⃣ 코스 관리 테스트
```bash
npm run test:e2e -- instructor.spec.ts --grep "강사 코스 관리"
```
✅ 코스 생성
✅ 코스 수정
✅ 상태 변경

### 3️⃣ 과제 관리 테스트
```bash
npm run test:e2e -- instructor.spec.ts --grep "강사 과제"
```
✅ 전체 과제 조회
✅ 개별 과제 생성
✅ 과제 수정

### 4️⃣ 채점 테스트
```bash
npm run test:e2e -- instructor.spec.ts --grep "강사 채점"
```
✅ 채점 페이지 접근
✅ 점수 입력 및 제출

### 5️⃣ 권한 제어 테스트
```bash
npm run test:e2e -- instructor.spec.ts --grep "역할 기반"
```
✅ 학습자 접근 차단
✅ API 접근 차단

---

## 특정 테스트만 실행

### 옵션 1: grep 사용
```bash
# 특정 문자열 포함한 테스트만 실행
npm run test:e2e -- instructor.spec.ts --grep "대시보드"
```

### 옵션 2: 테스트 이름으로 필터링
```bash
# 정확한 테스트명으로 실행
npm run test:e2e -- instructor.spec.ts --grep "should display instructor dashboard"
```

### 옵션 3: 브라우저 선택
```bash
# Chrome에서만 실행
npm run test:e2e -- instructor.spec.ts --project=chromium

# Firefox에서만 실행
npm run test:e2e -- instructor.spec.ts --project=firefox

# Safari에서만 실행
npm run test:e2e -- instructor.spec.ts --project=webkit
```

---

## 디버그 모드

### 한 줄씩 실행 (Debugger)
```bash
npm run test:e2e:debug -- instructor.spec.ts

# Step Over (다음 줄)
# Step Into (함수 진입)
# Step Out (함수 나가기)
# Continue (계속 실행)
```

### 스크린샷 저장
실패한 테스트는 자동으로 스크린샷이 저장됩니다:
```
test-results/
├─ instructor-should-display-instructor-dashboard-failed.png
├─ instructor-should-create-course-failed.png
└─ ...
```

### 비디오 녹화
```bash
# 실패한 테스트만 녹화
npm run test:e2e -- instructor.spec.ts

# 비디오 위치
test-results/instructor-should-display-instructor-dashboard-failed/video.webm
```

---

## 연속 실행 (Watch Mode)

```bash
# 파일 변경 시 자동으로 테스트 재실행
npx playwright test --watch instructor.spec.ts
```

---

## 성능 테스트

```bash
# 각 테스트 실행 시간 측정
npm run test:e2e -- instructor.spec.ts --reporter=list

# 상세 타이밍 정보
npm run test:e2e -- instructor.spec.ts --reporter=json > results.json
```

---

## CI/CD 통합

### GitHub Actions
프로젝트에 `.github/workflows/e2e-tests.yml` 파일 생성:

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
      - run: npm ci
      - run: npx playwright install
      - run: npm run dev &
      - run: sleep 10
      - run: npm run test:e2e
```

---

## 도움말

### 명령어 팁
```bash
# 모든 테스트 목록 보기
npm run test:e2e -- --list

# 한 번에 한 테스트만 실행
npm run test:e2e -- instructor.spec.ts --serial

# 병렬 실행 비활성화
npm run test:e2e -- instructor.spec.ts --workers=1

# 상세한 출력
npm run test:e2e -- instructor.spec.ts --reporter=verbose
```

### 로그 확인
```bash
# Playwright 상세 로그
PW_DEBUG=pw:api npm run test:e2e -- instructor.spec.ts

# 전체 디버그 로그
PW_DEBUG=pw:* npm run test:e2e -- instructor.spec.ts
```

---

## 추가 리소스

| 리소스 | 위치 |
|--------|------|
| 상세 E2E 가이드 | `docs/E2E_INSTRUCTOR_TESTING.md` |
| 아키텍처 문서 | `docs/INSTRUCTOR_SYSTEM_ARCHITECTURE.md` |
| 테스트 파일 | `e2e/tests/instructor.spec.ts` |
| Fixture | `e2e/fixtures/auth.ts` |

---

## 더 알아보기

### Playwright 공식 문서
- 🔗 https://playwright.dev/docs/intro

### 테스트 Best Practices
- 🔗 https://playwright.dev/docs/best-practices

### Debugging
- 🔗 https://playwright.dev/docs/debug

---

**🎯 준비 완료!** 이제 E2E 테스트를 실행할 수 있습니다.

```bash
npm run test:e2e:ui -- instructor.spec.ts
```

Happy Testing! 🚀
