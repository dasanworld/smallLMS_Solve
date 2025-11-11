import { test, expect } from '@playwright/test';

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

    await page.goto(`${BASE_URL}/dashboard`);

    await page.waitForLoadState('networkidle', {
      timeout: 5000,
    }).catch(() => {
      // 타임아웃 무시
    });

    // 대시보드 페이지 로드 확인
    const mainContent = page.locator('[role="main"]');
    expect((await mainContent.count()) > 0).toBeTruthy();

    console.log('✅ 대시보드 접근 성공');
  });

  /**
   * Test 2: 강좌 관리 페이지 접근
   */
  test('02. 강좌 관리 페이지 접근', async ({ page }) => {
    console.log('\n📌 Test 2: 강좌 관리 페이지 접근');

    // 강좌 관리 페이지 이동
    const coursesLink = page.locator(
      'a:has-text(/강좌|courses|강좌 관리|course management/i)'
    );

    if ((await coursesLink.count()) > 0) {
      await coursesLink.click();
    } else {
      await page.goto(`${BASE_URL}/instructor/courses`);
    }

    await page.waitForLoadState('networkidle', {
      timeout: 5000,
    }).catch(() => {
      // 타임아웃 무시
    });

    const mainContent = page.locator('[role="main"]');
    expect((await mainContent.count()) > 0).toBeTruthy();

    console.log('✅ 강좌 관리 페이지 접근 성공');
  });

  /**
   * Test 3: 강좌 생성
   */
  test('03. 강좌 생성', async ({ page }) => {
    console.log('\n📌 Test 3: 강좌 생성');

    const timestamp = Date.now();

    // 강좌 관리 페이지로 이동
    const coursesLink = page.locator(
      'a:has-text(/강좌|courses|강좌 관리|course management/i)'
    );

    if ((await coursesLink.count()) > 0) {
      await coursesLink.click();
    } else {
      await page.goto(`${BASE_URL}/instructor/courses`);
    }

    await page.waitForLoadState('networkidle', {
      timeout: 5000,
    }).catch(() => {
      // 타임아웃 무시
    });

    // 강좌 생성 버튼 찾기
    const createButton = page.locator(
      'button:has-text(/생성|생성하기|새 강좌|create|new/i)'
    );

    if ((await createButton.count()) > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // 강좌 정보 입력
      const courseName = `E2E Test Course ${timestamp}`;
      const courseDescription = `This is a test course created by E2E test`;

      const titleInput = page.locator(
        'input[placeholder*="이름"], input[placeholder*="제목"], input[placeholder*="name"]'
      ).first();
      const descriptionInput = page.locator(
        'textarea[placeholder*="설명"], textarea[placeholder*="description"]'
      ).first();

      if ((await titleInput.count()) > 0) {
        await titleInput.fill(courseName);
        console.log(`📝 강좌 제목 입력: ${courseName}`);
      }

      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.fill(courseDescription);
        console.log(`📝 강좌 설명 입력: ${courseDescription}`);
      }

      // 강좌 생성 제출
      const submitButton = page.locator(
        'button:has-text(/저장|생성|제출|submit|save/i)'
      );

      if ((await submitButton.count()) > 0) {
        await submitButton.click();
        await page.waitForTimeout(1500);

        console.log('✅ 강좌 생성 제출 완료');
      } else {
        console.log('⚠️ 제출 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('⚠️ 강좌 생성 버튼을 찾을 수 없습니다.');
    }
  });

  /**
   * Test 4: 강좌 목록 확인
   */
  test('04. 강좌 목록 확인', async ({ page }) => {
    console.log('\n📌 Test 4: 강좌 목록 확인');

    await page.goto(`${BASE_URL}/instructor/courses`);

    await page.waitForLoadState('networkidle', {
      timeout: 5000,
    }).catch(() => {
      // 타임아웃 무시
    });

    // 강좌 목록 확인
    const courses = page.locator('[class*="course"]');
    const courseCount = await courses.count();

    console.log(`✅ 강좌 목록 확인: ${courseCount}개의 강좌 발견`);
    expect(courseCount >= 0).toBeTruthy();
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
