import { test as base, Page } from '@playwright/test';
import { login } from '../helpers/auth-helper';
import { testUsers, TestUser } from './users';

/**
 * 인증 관련 픽스처
 * 역할별로 로그인된 페이지를 제공합니다.
 */

type AuthFixtures = {
  // 기본 인증된 페이지 (학습자)
  authenticatedPage: Page;
  
  // 역할별 인증된 페이지
  learnerPage: Page;
  instructorPage: Page;
  operatorPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // 기본 인증된 페이지 (학습자)
  authenticatedPage: async ({ page }, use) => {
    const user = testUsers.learner;
    await login(page, { email: user.email, password: user.password });
    await use(page);
  },

  // 학습자 페이지
  learnerPage: async ({ page }, use) => {
    const user = testUsers.learner;
    await login(page, { email: user.email, password: user.password });
    await use(page);
  },

  // 강사 페이지
  instructorPage: async ({ page }, use) => {
    const user = testUsers.instructor;
    await login(page, { email: user.email, password: user.password });
    await use(page);
  },

  // 운영자 페이지
  operatorPage: async ({ page }, use) => {
    const user = testUsers.operator;
    await login(page, { email: user.email, password: user.password });
    await use(page);
  },
});

export { expect } from '@playwright/test';
