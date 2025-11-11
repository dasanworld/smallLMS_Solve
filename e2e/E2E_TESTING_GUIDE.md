# E2E 테스트 가이드

## 📋 개요

이 프로젝트의 E2E 테스트는 다음과 같이 구성되어 있습니다:

1. **Setup Phase** (`e2e/setup.ts`)
   - 테스트 전에 자동으로 강사/학습자 계정 생성
   - 회원가입 및 로그인 진행
   - 테스트 계정 정보를 `test-accounts.json`에 저장

2. **Test Phase** (`e2e/tests/`)
   - Setup이 완료된 후 실행되는 실제 기능 테스트
   - 각 테스트는 로그인된 상태에서 시작

## 🚀 테스트 실행 방법

### 1. UI 모드로 실행 (권장 - 대시보드에서 시각적으로 확인)

```bash
npm run e2e:ui
```

**실행 흐름:**
1. Setup 단계: 자동으로 강사/학습자 계정 생성 및 로그인
2. Test 단계: 로그인된 상태에서 강사 워크플로우 테스트
3. Playwright Inspector 열림 (선택사항)

### 2. CLI 모드로 모든 테스트 실행

```bash
npm run e2e
```

### 3. 특정 테스트 파일만 실행

```bash
# 강사 워크플로우 테스트만 실행
npm run e2e e2e/tests/instructor-workflow.spec.ts

# 학습자 워크플로우 테스트만 실행
npm run e2e e2e/tests/learner-signup-flow.spec.ts
```

### 4. Setup 다시 실행

계정을 새로 생성하려면:

```bash
npm run e2e --project=setup
```

## 📁 디렉토리 구조

```
e2e/
├── setup.ts                              # 테스트 전 사전 작업 (회원가입, 로그인)
├── test-accounts.json                    # 생성된 테스트 계정 정보 (자동 생성)
├── tests/
│   ├── instructor-workflow.spec.ts       # 강사 기능 테스트
│   ├── learner-signup-flow.spec.ts       # 학습자 기능 테스트
│   └── [other test files]
├── fixtures/                             # 테스트 데이터
├── helpers/                              # 테스트 헬퍼 함수
└── README.md                             # E2E 테스트 안내
```

## 🔑 테스트 계정 정보

Setup 단계가 완료되면 `e2e/test-accounts.json` 파일이 생성됩니다:

```json
{
  "instructor": {
    "email": "instructor-setup-1731XXXXXXXXX@example.com",
    "password": "TestPassword123!",
    "name": "Setup Instructor XXXXXXXXXXXX"
  },
  "learner": {
    "email": "learner-setup-1731XXXXXXXXX@example.com",
    "password": "TestPassword123!",
    "name": "Setup Learner XXXXXXXXXXXX"
  }
}
```

### ⚠️ 주의사항

- 매번 테스트 실행할 때마다 새로운 계정이 생성됩니다
- 테스트 계정은 실제 데이터베이스에 저장됩니다
- 테스트 후 불필요한 계정은 수동으로 삭제해주세요

## 🧪 테스트 구성

### Setup Tests

**파일**: `e2e/setup.ts`

- `강사 회원가입 및 로그인 (Setup)`: 테스트용 강사 계정 생성
- `학습자 회원가입 및 로그인 (Setup)`: 테스트용 학습자 계정 생성

### Instructor Workflow Tests

**파일**: `e2e/tests/instructor-workflow.spec.ts`

1. `01. 강사 대시보드 접근`: 대시보드 기본 기능 확인
2. `02. 강좌 관리 페이지 접근`: 강좌 관리 페이지 로드
3. `03. 강좌 생성`: 새 강좌 생성 기능
4. `04. 강좌 목록 확인`: 생성된 강좌 목록 확인
5. `05. 프로필 페이지 접근`: 프로필 메뉴 접근
6. `06. 강좌 설정 접근`: 강좌 설정/수정 기능
7. `07. 학생 관리 페이지 접근`: 학생 관리 기능
8. `08. 과제 관리 페이지 접근`: 과제 관리 기능
9. `09. 로그아웃`: 로그아웃 기능 확인

### Learner Workflow Tests

**파일**: `e2e/tests/learner-signup-flow.spec.ts`

- 학습자 회원가입부터 과제 제출까지의 전체 흐름

## 🛠️ Playwright 설정

**파일**: `playwright.config.ts`

주요 설정:
- `projects`: 각 프로젝트마다 setup에 의존성 설정
- `testDir`: `./e2e` 디렉토리에서 테스트 검색
- `webServer`: 자동으로 dev 서버 시작 (`npm run dev`)

## 📊 테스트 보고서

테스트 실행 후 HTML 보고서 생성:

```bash
npm run e2e
# 보고서 열기
npx playwright show-report
```

## 🔍 디버깅 팁

### 1. UI 모드에서 특정 테스트 실행

```bash
npm run e2e:ui -- e2e/tests/instructor-workflow.spec.ts
```

### 2. 특정 테스트만 실행

```bash
# 파일 내 test.only() 사용 후
npm run e2e
```

### 3. 느린 시간 설정

```bash
npm run e2e -- --slow-mo=1000  # 1초씩 지연
```

### 4. 브라우저 자동 종료 방지 (디버깅)

`playwright.config.ts`에서:

```typescript
use: {
  headless: false,  // 브라우저 UI 표시
  slowMo: 1000,    // 1초씩 지연
}
```

## 📝 테스트 작성 가이드

### 새로운 테스트 추가하기

1. `e2e/tests/` 디렉토리에 `*.spec.ts` 파일 생성
2. 다음 패턴을 따라 테스트 작성:

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('새로운 기능 테스트', () => {
  test('기능 테스트 1', async ({ page }) => {
    // Setup에서 생성된 계정으로 이미 로그인 된 상태

    // 테스트 코드 작성
    await page.goto(`${BASE_URL}/some-page`);

    // 검증
    const element = page.locator('text=expected text');
    await expect(element).toBeVisible();
  });
});
```

### 중요 포인트

- ✅ 모든 테스트는 **로그인된 상태**에서 시작
- ✅ `BASE_URL` 사용 (상대 경로 권장)
- ✅ 명확한 로그 메시지 추가 (`console.log`)
- ✅ 예상 결과에 대한 `expect` 사용
- ❌ Setup 단계에서 회원가입 다시 진행 금지

## 🐛 문제 해결

### "회원가입이 실패했습니다" 오류

**원인**: 계정 생성 실패
**해결**:
1. 데이터베이스 연결 확인
2. Supabase 상태 확인
3. 개발 서버 재시작

### "테스트 타임아웃" 오류

**원인**: 페이지 로딩 지연
**해결**:
1. `timeout` 값 증가
2. 네트워크 속도 확인
3. 개발 서버 성능 확인

### "요소를 찾을 수 없습니다" 오류

**원인**: 셀렉터가 잘못됨
**해결**:
1. UI 모드로 실행하여 실제 요소 확인
2. 셀렉터 수정
3. `waitForLoadState()` 추가

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright 테스트 가이드](https://playwright.dev/docs/intro)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)

---

**마지막 업데이트**: 2024-11-11
**작성자**: AI Assistant
