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
  
  // 호환성을 위한 별칭
  authenticatedLearner?: { page: Page; user: any };
  authenticatedInstructor?: { page: Page; user: any };
  authenticatedOperator?: { page: Page; user: any };
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

  // 호환성을 위한 별칭 (기존 테스트용)
  authenticatedLearner: async ({ learnerPage }, use) => {
    await use({ page: learnerPage, user: testUsers.learner });
  },

  authenticatedInstructor: async ({ instructorPage }, use) => {
    await use({ page: instructorPage, user: testUsers.instructor });
  },

  authenticatedOperator: async ({ operatorPage }, use) => {
    await use({ page: operatorPage, user: testUsers.operator });
  },
});

export { expect } from '@playwright/test';
