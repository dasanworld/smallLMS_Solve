# E2E 테스트 가이드

## 개요
이 디렉토리는 Playwright를 사용한 E2E(End-to-End) 테스트를 포함합니다.

## 디렉토리 구조

```
e2e/
├── fixtures/          # Playwright 픽스처 (재사용 가능한 테스트 설정)
├── helpers/           # 테스트 헬퍼 클래스 및 유틸리티
├── tests/             # 실제 테스트 파일들
└── README.md          # 이 파일
```

## 설치 및 실행

### 테스트 실행
```bash
# 모든 테스트 실행
npm run test:e2e

# 특정 테스트 파일 실행
npm run test:e2e tests/auth.spec.ts

# UI 모드로 테스트 실행
npm run test:e2e:ui

# 디버그 모드로 테스트 실행
npm run test:e2e:debug

# 테스트 리포트 보기
npm run test:e2e:report
```

## 테스트 작성 가이드

### 기본 구조
```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  // 테스트 코드 작성
});
```

### 헬퍼 함수 사용
- `PageHelper`: 페이지 상호작용 유틸리티
- `ApiHelper`: API 요청 유틸리티
- `fixtures/auth.ts`: 인증 관련 픽스처

## 환경 설정

- **Base URL**: http://localhost:3000 (playwright.config.ts에서 설정)
- **Timeout**: 30초 (기본값)
- **Retries**: CI 환경에서만 2회

## CI/CD 통합

CI 환경에서 테스트는 다음과 같이 실행됩니다:
- 병렬 처리 비활성화 (workers: 1)
- 2회 자동 재시도
- HTML 리포트 생성

## 추가 리소스

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright API 참조](https://playwright.dev/docs/api/class-playwright)
