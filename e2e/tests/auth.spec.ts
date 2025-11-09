import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 인증 관련 E2E 테스트
 * - 회원가입, 로그인, 프로필 조회
 */

test.describe('Authentication', () => {
  test.describe('회원가입', () => {
    test('should complete signup flow for learner', async ({ page }) => {
      const timestamp = Date.now();
      const email = `learner-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `Test Learner ${timestamp}`;

      // 회원가입 페이지로 이동
      await page.goto('/signup');

      // 폼 입력
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);
      await page.selectOption('[name="role"]', 'learner');

      // 회원가입 버튼 클릭
      await page.click('button:has-text("회원가입")');

      // 성공 후 리다이렉트 확인 (강좌 목록 또는 대시보드)
      await page.waitForURL(/\/(courses|dashboard)/);
    });

    test('should complete signup flow for instructor', async ({ page }) => {
      const timestamp = Date.now();
      const email = `instructor-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `Test Instructor ${timestamp}`;

      await page.goto('/signup');

      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);
      await page.selectOption('[name="role"]', 'instructor');

      await page.click('button:has-text("회원가입")');

      await page.waitForURL(/\/(courses|instructor-dashboard)/);
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/signup');

      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.fill('[name="name"]', 'Test User');

      await page.click('button:has-text("회원가입")');

      // 에러 메시지 표시 확인
      await expect(page.locator('text=/이메일|email/i')).toBeVisible();
    });

    test('should show validation error for weak password', async ({ page }) => {
      await page.goto('/signup');

      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', '123'); // 너무 짧은 비밀번호
      await page.fill('[name="name"]', 'Test User');

      await page.click('button:has-text("회원가입")');

      // 비밀번호 에러 메시지 확인
      await expect(page.locator('text=/비밀번호|password/i')).toBeVisible();
    });
  });

  test.describe('로그인', () => {
    test('should login successfully with valid credentials', async ({
      page,
    }) => {
      // 먼저 테스트 계정 생성
      const timestamp = Date.now();
      const email = `login-test-${timestamp}@example.com`;
      const password = 'TestPassword123!';

      await page.goto('/signup');
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', 'Login Test User');
      await page.selectOption('[name="role"]', 'learner');
      await page.click('button:has-text("회원가입")');
      await page.waitForURL(/\/(courses|dashboard)/);

      // 로그아웃
      await page.click('button:has-text("로그아웃")');

      // 로그인 페이지로 이동
      await page.goto('/login');

      // 로그인
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.click('button:has-text("로그인")');

      // 로그인 성공 확인
      await page.waitForURL(/\/(courses|dashboard)/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[name="email"]', 'nonexistent@example.com');
      await page.fill('[name="password"]', 'WrongPassword123!');

      await page.click('button:has-text("로그인")');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('text=/이메일|비밀번호|로그인|실패/i')
      ).toBeVisible();
    });

    test('should redirect to login when accessing protected page without auth', async ({
      page,
    }) => {
      // 인증 없이 보호된 페이지 접근
      await page.goto('/dashboard');

      // 로그인 페이지로 리다이렉트되어야 함
      await page.waitForURL(/\/login/);
    });
  });

  test.describe('프로필 조회', () => {
    authTest(
      'should display user profile for learner',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // 프로필 페이지로 이동 (또는 대시보드)
        await page.goto('/dashboard');

        // 사용자 정보 표시 확인
        await expect(page.locator(`text=${user.name}`)).toBeVisible();
        await expect(page.locator(`text=${user.email}`)).toBeVisible();
      }
    );

    authTest(
      'should display user profile for instructor',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        await expect(page.locator(`text=${user.name}`)).toBeVisible();
        await expect(page.locator(`text=${user.email}`)).toBeVisible();
      }
    );
  });

  test.describe('API - 프로필 조회', () => {
    authTest(
      'should get user profile via API',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // API 요청
        const response = await page.request.get('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(user.email);
        expect(data.user.role).toBe(user.role);
      }
    );

    test('should return 401 for unauthenticated profile request', async ({
      page,
    }) => {
      const response = await page.request.get('/api/auth/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('로그아웃', () => {
    authTest('should logout successfully', async ({ authenticatedLearner }) => {
      const { page } = authenticatedLearner;

      await page.goto('/dashboard');

      // 로그아웃 버튼 클릭
      await page.click('button:has-text("로그아웃")');

      // 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/);

      // 다시 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
      await page.goto('/dashboard');
      await page.waitForURL(/\/login/);
    });
  });
});
