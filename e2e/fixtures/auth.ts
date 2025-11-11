import { test as base, type Page } from '@playwright/test';
import { TokenManager } from '../shared/token-manager';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 테스트 사용자 정보
const LEARNER_EMAIL = process.env.LEARNER_EMAIL || 'learn-demo@test.com';
const LEARNER_PASSWORD = process.env.LEARNER_PASSWORD || 'test123!';

const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'inst-demo@test.com';
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || 'test123!';

// 사용자 정보 인터페이스
type AuthRole = 'instructor' | 'learner';

interface AuthenticatedUser {
  email: string;
  name: string;
  role: AuthRole;
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
 * Supabase 프로필 정보를 조회합니다.
 */
async function fetchUserProfile(
  page: Page,
  accessToken: string,
  fallback: { email: string; name?: string; role: AuthRole }
): Promise<AuthenticatedUser> {
  if (!accessToken) {
    return {
      email: fallback.email,
      name: fallback.name || 'Test User',
      role: fallback.role,
      token: '',
      id: '',
    };
  }

  try {
    const response = await page.request.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok()) {
      const profileData = await response.json();
      const userProfile = profileData.user || profileData;

      return {
        email: userProfile.email || fallback.email,
        name: userProfile.name || fallback.name || 'Test User',
        role: (userProfile.role as AuthRole) || fallback.role,
        token: accessToken,
        id: userProfile.id || '',
      };
    }
  } catch (error) {
    console.warn('[auth fixture] Failed to fetch user profile', error);
  }

  return {
    email: fallback.email,
    name: fallback.name || 'Test User',
    role: fallback.role,
    token: accessToken,
    id: '',
  };
}

/**
 * 실제 로그인을 수행하여 토큰을 얻고 사용자 정보를 조회합니다
 */
async function loginAndGetUser(
  page: Page,
  email: string,
  password: string,
  role: AuthRole,
  displayName?: string
): Promise<AuthenticatedUser> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  const expectedUrl = role === 'instructor' ? `${BASE_URL}/instructor-dashboard` : `${BASE_URL}/dashboard`;
  await page.waitForURL(expectedUrl, { timeout: 15000 }).catch(() => {
    // 다른 화면으로 리다이렉트되더라도 로그인 성공 여부는 추후 API 호출로 확인
  });

  const tokenData = await TokenManager.extractToken(page);
  const accessToken = tokenData?.accessToken ?? '';

  const user = await fetchUserProfile(page, accessToken, {
    email,
    name: displayName,
    role,
  });

  try {
    const storageState = await page.context().storageState();
    if (tokenData) {
      await TokenManager.saveToken(role, tokenData, storageState, {
        email: user.email,
        name: user.name,
      });
    }
  } catch (error) {
    console.warn(`[auth fixture] Failed to save ${role} token`, error);
  }

  return user;
}

async function createAuthenticatedContext(
  page: Page,
  role: AuthRole,
  credentials: { email: string; password: string; name?: string }
): Promise<AuthenticatedContext> {
  const storedToken = TokenManager.loadToken(role);

  if (storedToken) {
    const isValid = await TokenManager.validateToken(page, storedToken);

    if (isValid) {
      await TokenManager.restoreSession(page, storedToken);

      const defaultUrl = role === 'instructor' ? `${BASE_URL}/instructor-dashboard` : `${BASE_URL}/dashboard`;
      await page.goto(defaultUrl, { waitUntil: 'networkidle' }).catch(() => {});

      const user = await fetchUserProfile(page, storedToken.accessToken, {
        email: storedToken.email || credentials.email,
        name: storedToken.name || credentials.name,
        role,
      });

      return { page, user };
    }

    TokenManager.clearToken(role);
  }

  const user = await loginAndGetUser(page, credentials.email, credentials.password, role, credentials.name);
  return { page, user };
}

/**
 * 새로운 fixture 정의
 */
export const test = base.extend<AuthFixtures>({
  // 인증된 학습자 (page + user 정보)
  authenticatedLearner: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'learner', {
      email: LEARNER_EMAIL,
      password: LEARNER_PASSWORD,
    });

    await use(context);
    await page.close();
  },

  // 인증된 강사 (page + user 정보)
  authenticatedInstructor: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'instructor', {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
    });

    await use(context);
    await page.close();
  },

  // 학습자 페이지 (인증된 학습자 세션)
  learnerPage: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'learner', {
      email: LEARNER_EMAIL,
      password: LEARNER_PASSWORD,
    });

    await use(context.page);
    await page.close();
  },

  // 강사 페이지 (인증된 강사 세션)
  instructorPage: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'instructor', {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
    });

    await use(context.page);
    await page.close();
  },

  // 학습자 사용자 정보 (토큰 포함)
  learner: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'learner', {
      email: LEARNER_EMAIL,
      password: LEARNER_PASSWORD,
    });

    await use(context.user);
    await page.close();
  },

  // 강사 사용자 정보 (토큰 포함)
  instructor: async ({ page }, use) => {
    const context = await createAuthenticatedContext(page, 'instructor', {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
    });

    await use(context.user);
    await page.close();
  },
});

export { expect } from '@playwright/test';
