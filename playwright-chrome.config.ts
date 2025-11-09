import { defineConfig, devices } from '@playwright/test';

/**
 * Chrome 전용 Playwright 설정
 * 
 * 이 설정은 Chrome 브라우저만 테스트하여 빠른 피드백을 제공합니다.
 * 개발 중에는 병렬 처리(2-4 workers)를 사용하고,
 * CI 환경에서는 직렬 실행(1 worker)으로 안정성을 보장합니다.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 테스트 파일 병렬 실행 */
  fullyParallel: true,
  
  /* CI 환경에서 test.only 사용 금지 */
  forbidOnly: !!process.env.CI,
  
  /* 재시도: CI 환경에서만 2회, 로컬에서는 1회 */
  retries: process.env.CI ? 2 : 1,
  
  /* Workers: 개발 중 2-4개, CI에서는 1개 (직렬 실행) */
  workers: process.env.CI ? 1 : 2,
  
  /* 리포터: HTML 리포트 생성 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'], // 콘솔에도 출력
  ],
  
  /* 공통 설정 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',
    
    /* Trace: 실패한 테스트에 대해서만 수집 (효율성) */
    trace: 'on-first-retry',
    
    /* Screenshot: 실패한 테스트에 대해서만 수집 */
    screenshot: 'only-on-failure',
    
    /* Video: 실패한 테스트에 대해서만 수집 */
    video: 'retain-on-failure',
    
    /* 타임아웃 설정 */
    actionTimeout: 10000, // 각 액션 타임아웃: 10초
    navigationTimeout: 30000, // 네비게이션 타임아웃: 30초
  },

  /* Chrome만 테스트 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 추가 Chrome 옵션 (필요시)
        // launchOptions: {
        //   args: ['--disable-web-security'],
        // },
      },
    },
  ],

  /* 로컬 개발 서버 실행 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // CI가 아닌 경우 기존 서버 재사용
    timeout: 120000, // 서버 시작 타임아웃: 2분
    stdout: 'ignore', // 서버 로그 숨김 (테스트 출력 깔끔하게)
    stderr: 'pipe', // 에러만 표시
  },
  
  /* 전역 타임아웃 설정 */
  timeout: 30000, // 각 테스트 타임아웃: 30초
  expect: {
    timeout: 5000, // expect 타임아웃: 5초
  },
});

