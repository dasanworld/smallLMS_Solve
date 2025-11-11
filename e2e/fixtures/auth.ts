import { test as base, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 테스트 사용자 정보
const LEARNER_EMAIL = process.env.LEARNER_EMAIL || 'learner@example.com';
const LEARNER_PASSWORD = process.env.LEARNER_PASSWORD || 'password123';

const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'instructor@example.com';
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || 'password123';

// 사용자 정보 인터페이스
interface AuthenticatedUser {
  email: string;
  name: string;
  role: 'instructor' | 'learner';
  token: string;
  id: string;
}

interface AuthenticatedContext {
  page: Page;
  user: AuthenticatedUser;
}

// 고급 fixture 타입
type AuthFixtures = {
  authenticatedLearner: AuthenticatedContext;
  authenticatedInstructor: AuthenticatedContext;
  learnerPage: Page;
  instructorPage: Page;
  learner: AuthenticatedUser;
  instructor: AuthenticatedUser;
};

/**
 * 실제 로그인을 수행하여 토큰을 얻고 사용자 정보를 조회합니다
 */
async function loginAndGetUser(
  page: Page,
  email: string,
  password: string,
  role: 'instructor' | 'learner'
): Promise<AuthenticatedUser> {
  // 로그인 페이지로 이동
  await page.goto(`${BASE_URL}/login`);

  // 이메일 입력
  await page.fill('input[type="email"]', email);

  // 비밀번호 입력
  await page.fill('input[type="password"]', password);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 로그인 성공 후 리다이렉트 대기
  if (role === 'instructor') {
    await page.waitForURL(`${BASE_URL}/instructor-dashboard`, { timeout: 10000 }).catch(() => {
      // 혹시 다른 경로로 리다이렉트되었을 수 있음
    });
  } else {
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 }).catch(() => {
      // 혹시 다른 경로로 리다이렉트되었을 수 있음
    });
  }

  // 프로필 정보 조회 API 호출
  const profileResponse = await page.request.get(`${BASE_URL}/api/auth/profile`);

  if (!profileResponse.ok()) {
    throw new Error(`Failed to get user profile: ${profileResponse.status()}`);
  }

  const profileData = await profileResponse.json();
  const userProfile = profileData.user || profileData;

  // localStorage에서 토큰 추출 (Supabase 세션)
  let token = '';
  await page.evaluate(() => {
    const authToken = localStorage.getItem('supabase.auth.token');
    if (authToken) {
      const parsed = JSON.parse(authToken);
      (window as any).testToken = parsed.access_token || parsed;
    }
  });

  token = await page.evaluate(() => (window as any).testToken || '');

  return {
    email: userProfile.email || email,
    name: userProfile.name || 'Test User',
    role: userProfile.role || role,
    token: token,
    id: userProfile.id || '',
  };
}

/**
 * 새로운 fixture 정의
 */
export const test = base.extend<AuthFixtures>({
  // 인증된 학습자 (page + user 정보)
  authenticatedLearner: async ({ page }, use) => {
    const user = await loginAndGetUser(page, LEARNER_EMAIL, LEARNER_PASSWORD, 'learner');

    await use({
      page,
      user,
    });

    // 테스트 후 정리
    await page.close();
  },

  // 인증된 강사 (page + user 정보)
  authenticatedInstructor: async ({ page }, use) => {
    const user = await loginAndGetUser(page, INSTRUCTOR_EMAIL, INSTRUCTOR_PASSWORD, 'instructor');

    await use({
      page,
      user,
    });

    // 테스트 후 정리
    await page.close();
  },

  // 학습자 페이지 (인증된 학습자 세션)
  learnerPage: async ({ page }, use) => {
    await loginAndGetUser(page, LEARNER_EMAIL, LEARNER_PASSWORD, 'learner');

    await use(page);

    // 테스트 후 정리
    await page.close();
  },

  // 강사 페이지 (인증된 강사 세션)
  instructorPage: async ({ page }, use) => {
    await loginAndGetUser(page, INSTRUCTOR_EMAIL, INSTRUCTOR_PASSWORD, 'instructor');

    await use(page);

    // 테스트 후 정리
    await page.close();
  },

  // 학습자 사용자 정보 (토큰 포함)
  learner: async ({ page }, use) => {
    const user = await loginAndGetUser(page, LEARNER_EMAIL, LEARNER_PASSWORD, 'learner');

    await use(user);

    // 테스트 후 정리
    await page.close();
  },

  // 강사 사용자 정보 (토큰 포함)
  instructor: async ({ page }, use) => {
    const user = await loginAndGetUser(page, INSTRUCTOR_EMAIL, INSTRUCTOR_PASSWORD, 'instructor');

    await use(user);

    // 테스트 후 정리
    await page.close();
  },
});

export { expect } from '@playwright/test';
