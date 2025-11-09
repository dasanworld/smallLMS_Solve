import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 인증이 필요한 페이지 테스트를 위한 픽스처
    // 이곳에서 로그인 로직을 작성할 수 있습니다
    await use(page);
  },
});

export { expect } from '@playwright/test';
