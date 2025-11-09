import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { signup, login, logout, isLoggedIn } from '../helpers/auth-helper';
import { generateRandomEmail } from '../fixtures/users';

/**
 * 인증 관련 E2E 테스트
 * - 회원가입, 로그인, 로그아웃, 프로필 조회
 */

test.describe('Authentication', () => {
  test.describe('회원가입', () => {
    test('should complete signup flow for learner', async ({ page }) => {
      const email = generateRandomEmail('learner');
      const password = 'TestPassword123!';

      // 헬퍼 함수 사용
      await signup(page, {
        email,
        password,
        role: 'learner',
        name: 'Test Learner',
      });

      // 대시보드로 리다이렉트 확인
      await expect(page).toHaveURL(/\/(dashboard|explore-courses)/);
    });

    test('should complete signup flow for instructor', async ({ page }) => {
      const email = generateRandomEmail('instructor');
      const password = 'TestPassword123!';

      await signup(page, {
        email,
        password,
        role: 'instructor',
        name: 'Test Instructor',
      });

      // 강사 대시보드로 리다이렉트 확인
      await expect(page).toHaveURL(/\/instructor-dashboard/);
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
      const email = generateRandomEmail('login-test');
      const password = 'TestPassword123!';

      await signup(page, {
        email,
        password,
        role: 'learner',
        name: 'Login Test User',
      });

      // 로그아웃
      await logout(page);

      // 헬퍼 함수로 로그인
      await login(page, { email, password });

      // 로그인 성공 확인
      await expect(page).toHaveURL(/\/(dashboard|explore-courses)/);
      expect(await isLoggedIn(page)).toBe(true);
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
    authTest('should display user profile for learner', async ({ learnerPage }) => {
      // 대시보드로 이동
      await learnerPage.goto('/dashboard');

      // 글로벌 네비게이션에서 사용자 정보 확인
      const userMenu = learnerPage.locator('button[aria-label*="user"], button[aria-label*="사용자"]').first();
      await expect(userMenu).toBeVisible();

      // 사용자 메뉴 열기
      await userMenu.click();
      
      // 이메일 표시 확인
      const emailText = learnerPage.locator('text=/@/').first();
      await expect(emailText).toBeVisible();
    });

    authTest('should display user profile for instructor', async ({ instructorPage }) => {
      await instructorPage.goto('/instructor-dashboard');

      // 글로벌 네비게이션에서 사용자 정보 확인
      const userMenu = instructorPage.locator('button[aria-label*="user"], button[aria-label*="사용자"]').first();
      await expect(userMenu).toBeVisible();

      // 사용자 메뉴 열기
      await userMenu.click();
      
      // 역할 표시 확인 (강사)
      const roleText = instructorPage.locator('text=/강사/').first();
      await expect(roleText).toBeVisible();
    });
  });

  test.describe('API - 프로필 조회', () => {
    authTest('should get user profile via API', async ({ learnerPage }) => {
      // API 요청 (쿠키 기반 인증)
      const response = await learnerPage.request.get('/api/auth/profile');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      // 응답 구조에 따라 조정 필요
      if (data.data) {
        expect(data.data.email).toBeDefined();
        expect(data.data.role).toBeDefined();
      }
    });

    test('should return 401 for unauthenticated profile request', async ({
      page,
    }) => {
      const response = await page.request.get('/api/auth/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('로그아웃', () => {
    authTest('should logout successfully', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');

      // 헬퍼 함수로 로그아웃
      await logout(learnerPage);

      // 랜딩페이지로 리다이렉트 확인
      await expect(learnerPage).toHaveURL('/');

      // 로그인 상태 확인
      expect(await isLoggedIn(learnerPage)).toBe(false);

      // 다시 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
      await learnerPage.goto('/dashboard');
      await expect(learnerPage).toHaveURL(/\/login/);
    });
  });
});
