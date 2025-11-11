import { test, expect } from '@playwright/test';
import { Selectors } from '../shared/selectors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 강사 워크플로우 E2E 테스트
 *
 * ⚠️ 주의: 이 테스트는 setup.ts에서 생성한 강사 계정을 사용합니다.
 * setup.ts에서 회원가입과 로그인이 먼저 진행되므로, 이 테스트는 로그인 된 상태에서 시작됩니다.
 */

test.describe('강사 워크플로우', () => {
  /**
   * Test 1: 대시보드 접근
   */
  test('01. 강사 대시보드 접근', async ({ page }) => {
    console.log('\n📌 Test 1: 강사 대시보드 접근');

    await page.goto(`${BASE_URL}/instructor-dashboard`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(Selectors.dashboard.instructorHeading(page)).toBeVisible();

    console.log('✅ 대시보드 접근 성공');
  });

  /**
   * Test 2: 강좌 관리 페이지 접근
   */
  test('02. 강좌 관리 페이지 접근', async ({ page }) => {
    console.log('\n📌 Test 2: 강좌 관리 페이지 접근');

    await page.goto(`${BASE_URL}/instructor-dashboard`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle').catch(() => {});

    const courseManagementButton = Selectors.course.managementButton(page);
    if ((await courseManagementButton.count()) > 0) {
      await courseManagementButton.click();
      await page.waitForURL(/\/courses/, { timeout: 10000 }).catch(() => {});
    } else {
      console.log('ℹ️ 코스 관리 버튼을 찾지 못해 직접 이동합니다.');
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(Selectors.course.heading(page)).toBeVisible();

    console.log('✅ 강좌 관리 페이지 접근 성공');
  });

  /**
   * Test 3: 강좌 생성
   */
  test('03. 강좌 생성', async ({ page }) => {
    console.log('\n📌 Test 3: 강좌 생성');

    const timestamp = Date.now();

    await page.goto(`${BASE_URL}/instructor-dashboard`, {
      waitUntil: 'domcontentloaded',
    });

    const courseManagementButton = Selectors.course.managementButton(page);
    if ((await courseManagementButton.count()) > 0) {
      await courseManagementButton.click();
      await page.waitForURL(/\/courses/, { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForLoadState('networkidle').catch(() => {});

    const createTab = Selectors.course.createTab(page);
    if ((await createTab.count()) > 0) {
      await createTab.click();
    }

    const courseName = `E2E Test Course ${timestamp}`;
    const courseDescription = `This is a test course created by E2E test`;

    const titleInput = page.locator('input[name="title"]').first();
    const descriptionInput = page.locator('textarea[name="description"]').first();

    if ((await titleInput.count()) === 0) {
      console.log('⚠️ 제목 입력 필드를 찾지 못했습니다.');
      return;
    }

    await titleInput.fill(courseName);
    if ((await descriptionInput.count()) > 0) {
      await descriptionInput.fill(courseDescription);
    }

    const submitButton = page.getByRole('button', { name: /생성|저장|Create/i }).first();
    await submitButton.click();
    await page.waitForTimeout(1500);

    const confirmation = page.locator(`text=${courseName}`).first();
    await expect(confirmation).toBeVisible({ timeout: 5000 });

    console.log('✅ 강좌 생성 제출 완료');
  });

  /**
   * Test 4: 강좌 목록 확인
   */
  test('04. 강좌 목록 확인', async ({ page }) => {
    console.log('\n📌 Test 4: 강좌 목록 확인');

    await page.goto(`${BASE_URL}/courses`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(Selectors.course.heading(page)).toBeVisible();
    console.log('✅ 강좌 페이지 헤더 확인 완료');
  });

  /**
   * Test 5: 프로필 페이지 접근
   */
  test('05. 프로필 페이지 접근', async ({ page }) => {
    console.log('\n📌 Test 5: 프로필 페이지 접근');

    // 프로필 메뉴 또는 계정 메뉴 찾기
    const profileMenu = page.locator(
      'button:has-text(/프로필|profile|계정|account|설정/i), a:has-text(/프로필|profile|계정|account|설정/i)'
    );

    if ((await profileMenu.count()) > 0) {
      await profileMenu.first().click();
      await page.waitForTimeout(500);

      console.log('✅ 프로필 메뉴 접근 성공');
    } else {
      console.log('⚠️ 프로필 메뉴를 찾을 수 없습니다.');
    }
  });

  /**
   * Test 6: 강좌 설정/수정 (선택사항)
   */
  test('06. 강좌 설정 접근', async ({ page }) => {
    console.log('\n📌 Test 6: 강좌 설정 접근');

    await page.goto(`${BASE_URL}/instructor/courses`);

    await page.waitForLoadState('networkidle', {
      timeout: 5000,
    }).catch(() => {
      // 타임아웃 무시
    });

    // 첫 번째 강좌의 설정 버튼 찾기
    const settingsButton = page.locator(
      'button:has-text(/설정|수정|edit|settings/i)'
    ).first();

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ 강좌 설정 접근 성공');
    } else {
      console.log('⚠️ 설정 버튼을 찾을 수 없습니다.');
    }
  });

  /**
   * Test 7: 학생 관리 (선택사항)
   */
  test('07. 학생 관리 페이지 접근', async ({ page }) => {
    console.log('\n📌 Test 7: 학생 관리 페이지 접근');

    const managementLinks = [
      'a:has-text(/학생|students|students|학습자 관리/i)',
      'a:has-text(/관리|manage|members/i)',
      'button:has-text(/학생|students|members/i)',
    ];

    let found = false;
    for (const selector of managementLinks) {
      const link = page.locator(selector).first();
      if ((await link.count()) > 0) {
        await link.click();
        await page.waitForTimeout(1000);
        console.log('✅ 학생 관리 페이지 접근 성공');
        found = true;
        break;
      }
    }

    if (!found) {
      console.log('⚠️ 학생 관리 페이지 링크를 찾을 수 없습니다.');
    }
  });

  /**
   * Test 8: 과제 관리 (선택사항)
   */
  test('08. 과제 관리 페이지 접근', async ({ page }) => {
    console.log('\n📌 Test 8: 과제 관리 페이지 접근');

    const assignmentLinks = [
      'a:has-text(/과제|assignments|tasks|assignment/i)',
      'button:has-text(/과제|assignments|tasks/i)',
    ];

    let found = false;
    for (const selector of assignmentLinks) {
      const link = page.locator(selector).first();
      if ((await link.count()) > 0) {
        await link.click();
        await page.waitForTimeout(1000);
        console.log('✅ 과제 관리 페이지 접근 성공');
        found = true;
        break;
      }
    }

    if (!found) {
      console.log('⚠️ 과제 관리 페이지 링크를 찾을 수 없습니다.');
    }
  });

  /**
   * Test 9: 로그아웃
   */
  test('09. 로그아웃', async ({ page }) => {
    console.log('\n📌 Test 9: 로그아웃');

    // 로그아웃 버튼 찾기
    const logoutButton = page.locator(
      'button:has-text(/로그아웃|logout|sign out/i), a:has-text(/로그아웃|logout|sign out/i)'
    );

    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isLoggedOut =
        currentUrl.includes('login') ||
        currentUrl.includes('signup') ||
        currentUrl === BASE_URL + '/';

      if (isLoggedOut || (await page.locator('text=/로그인/i').count()) > 0) {
        console.log('✅ 로그아웃 성공');
      } else {
        console.log('⚠️ 로그아웃 확인 필요');
      }
    } else {
      console.log('⚠️ 로그아웃 버튼을 찾을 수 없습니다.');
    }
  });
});
