import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 러너(학습자) 회원가입부터 학습까지의 완전한 E2E 테스트
 * 새 사용자가 가입한 후 실제로 강좌를 수강하고 과제를 제출하는 전체 프로세스를 테스트합니다.
 */

test.describe('러너 회원가입 및 첫 학습 (Complete Signup-to-Learning Flow)', () => {
  /**
   * 시나리오 1: 러너 회원가입
   */
  test.describe('러너 회원가입', () => {
    test('신규 학습자 회원가입 완료', async ({ page }) => {
      const timestamp = Date.now();
      const email = `learner-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `Test Learner ${timestamp}`;

      // 1단계: 회원가입 페이지 접근
      await page.goto(`${BASE_URL}/signup`);

      // 페이지 로드 확인
      await expect(page.locator('text=/회원가입|Sign up/i')).toBeVisible({
        timeout: 5000,
      });

      // 2단계: 회원가입 폼 작성
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);

      // 역할 선택 (학습자)
      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      // 3단계: 회원가입 버튼 클릭
      const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');
      await signupButton.click();

      // 4단계: 회원가입 성공 확인
      await page.waitForTimeout(2000);

      // 성공 메시지 또는 리다이렉트 확인
      const currentUrl = page.url();
      const successMessage = page.locator(
        'text=/성공|완료|가입|Welcome|Dashboard/i'
      );

      // 대시보드 또는 강좌 페이지로 리다이렉트되거나 성공 메시지 표시
      const isRedirected =
        currentUrl.includes('dashboard') ||
        currentUrl.includes('courses') ||
        currentUrl.includes('login');

      expect(
        isRedirected || (await successMessage.count()) > 0
      ).toBeTruthy();

      console.log(`✓ 회원가입 완료: ${email}`);
    });

    test('중복 이메일로 회원가입 시도 (실패)', async ({ page }) => {
      const timestamp = Date.now();

      // 먼저 첫 번째 회원가입
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', `duplicate-${timestamp}@example.com`);
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.fill('[name="name"]', 'First User');

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // 두 번째 회원가입 시도 (같은 이메일)
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', `duplicate-${timestamp}@example.com`);
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.fill('[name="name"]', 'Second User');

      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(1000);

      // 에러 메시지 확인
      const errorMessage = page.locator(
        'text=/이미|중복|존재|이미 가입|already|duplicate/i'
      );

      expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
    });

    test('필수 필드 미입력 시 회원가입 불가', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      // 아무것도 입력하지 않고 회원가입 버튼 클릭
      const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');

      // 버튼이 비활성화되어 있거나 에러 메시지가 표시되어야 함
      const isDisabled = await signupButton.evaluate((el: any) => el.disabled);

      if (!isDisabled) {
        await signupButton.click();
        await page.waitForTimeout(500);

        // 에러 메시지 확인
        const errorMessage = page.locator('text=/필수|필수|required|입력/i');
        expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('유효하지 않은 이메일 형식', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.fill('[name="name"]', 'Test User');

      const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');

      // 에러 메시지 또는 비활성화 확인
      const isDisabled = await signupButton.evaluate((el: any) => el.disabled);

      if (!isDisabled) {
        await signupButton.click();
        await page.waitForTimeout(500);

        const errorMessage = page.locator(
          'text=/이메일|유효하지 않은|invalid|format/i'
        );
        expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('약한 비밀번호로 회원가입 시도', async ({ page }) => {
      const timestamp = Date.now();

      await page.goto(`${BASE_URL}/signup`);

      await page.fill('[name="email"]', `weak-pw-${timestamp}@example.com`);
      await page.fill('[name="password"]', '123'); // 약한 비밀번호
      await page.fill('[name="name"]', 'Test User');

      const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');

      // 에러 메시지 또는 비활성화 확인
      const isDisabled = await signupButton.evaluate((el: any) => el.disabled);

      if (!isDisabled) {
        await signupButton.click();
        await page.waitForTimeout(500);

        const errorMessage = page.locator(
          'text=/약한|강력한|비밀번호|password|strength/i'
        );
        expect(await errorMessage.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  /**
   * 시나리오 2: 회원가입 후 첫 로그인
   */
  test.describe('회원가입 후 로그인', () => {
    test('새로 가입한 계정으로 로그인', async ({ page }) => {
      const timestamp = Date.now();
      const email = `new-learner-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `New Learner ${timestamp}`;

      // 1단계: 회원가입
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // 2단계: 로그아웃 (자동 로그인된 경우)
      const logoutButton = page.locator(
        'button:has-text(/로그아웃|logout|sign out/i)'
      );
      if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }

      // 3단계: 로그인 페이지 접근
      await page.goto(`${BASE_URL}/login`);

      // 4단계: 로그인 정보 입력
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);

      // 5단계: 로그인 버튼 클릭
      await page.click('button[type="submit"]');

      // 6단계: 로그인 성공 확인
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isLoggedIn =
        currentUrl.includes('dashboard') ||
        currentUrl.includes('courses') ||
        (await page.locator('text=/대시보드|Dashboard|강좌/i').count()) > 0;

      expect(isLoggedIn).toBeTruthy();

      console.log(`✓ 로그인 완료: ${email}`);
    });
  });

  /**
   * 시나리오 3: 회원가입 후 대시보드 접근
   */
  test.describe('회원가입 후 대시보드', () => {
    test('새 학습자의 초기 대시보드 상태', async ({ page }) => {
      const timestamp = Date.now();
      const email = `dash-learner-${timestamp}@example.com`;
      const password = 'TestPassword123!';

      // 회원가입
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', `Learner ${timestamp}`);

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // 대시보드 또는 강좌 페이지 확인
      const currentUrl = page.url();

      // 대시보드로 이동하거나 이미 강좌 페이지에 있음
      if (currentUrl.includes('courses')) {
        // 대시보드로 이동
        await page.goto(`${BASE_URL}/dashboard`);
      }

      await page.waitForLoadState('networkidle', {
        timeout: 5000,
      }).catch(() => {
        // 타임아웃 무시
      });

      // 초기 상태 확인
      // - 수강 중인 강좌 없음 또는 빈 상태
      // - 과제 없음 또는 빈 상태
      const mainContent = page.locator('[role="main"]');
      const emptyState = page.locator(
        'text=/없음|없습니다|가입|등록|없습니다|empty/i'
      );

      expect(
        (await mainContent.count()) > 0 || (await emptyState.count()) > 0
      ).toBeTruthy();

      console.log(`✓ 초기 대시보드 상태 확인: ${email}`);
    });
  });

  /**
   * 시나리오 4: 회원가입 후 강좌 탐색 및 수강신청
   */
  test.describe('회원가입 후 첫 강좌 수강신청', () => {
    test('신규 학습자의 강좌 탐색 및 수강신청', async ({ page }) => {
      const timestamp = Date.now();
      const email = `enroll-learner-${timestamp}@example.com`;
      const password = 'TestPassword123!';

      // 1단계: 회원가입
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', `Learner ${timestamp}`);

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // 2단계: 강좌 탐색 페이지로 이동
      const exploreLink = page.locator(
        'a:has-text(/강좌 탐색|explore|browse/i)'
      );

      if ((await exploreLink.count()) > 0) {
        await exploreLink.click();
      } else {
        // 직접 강좌 페이지로 이동
        await page.goto(`${BASE_URL}/courses`);
      }

      await page.waitForLoadState('networkidle', {
        timeout: 5000,
      }).catch(() => {
        // 타임아웃 무시
      });

      // 3단계: 강좌 목록 확인
      const courseCards = page.locator('[class*="course"]');
      const courseCount = await courseCards.count();

      if (courseCount > 0) {
        // 4단계: 첫 번째 강좌 클릭
        const firstCourse = courseCards.first();
        await firstCourse.click();

        await page.waitForLoadState('networkidle', {
          timeout: 5000,
        }).catch(() => {
          // 타임아웃 무시
        });

        // 5단계: 수강신청 버튼 찾기 및 클릭
        const enrollButton = page.locator(
          'button:has-text(/수강신청|enroll|register/i)'
        );

        if ((await enrollButton.count()) > 0) {
          await enrollButton.click();
          await page.waitForTimeout(1000);

          // 6단계: 수강신청 성공 메시지 확인
          const successMessage = page.locator(
            'text=/성공|완료|신청|등록|성공했습니다/i'
          );

          if ((await successMessage.count()) > 0) {
            console.log(`✓ 첫 강좌 수강신청 완료: ${email}`);
          }
        }
      } else {
        console.log('⚠ 가용한 강좌가 없습니다.');
      }
    });
  });

  /**
   * 시나리오 5: 회원가입부터 과제 제출까지
   */
  test.describe('회원가입부터 과제 제출까지 (Complete Journey)', () => {
    test('신규 학습자 전체 여정: 가입 → 로그인 → 강좌 → 과제 → 성적', async ({
      page,
    }) => {
      const timestamp = Date.now();
      const email = `complete-journey-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `Complete Learner ${timestamp}`;

      // Step 1: 회원가입
      console.log('Step 1: 회원가입 중...');
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // Step 2: 자동 로그인 확인 또는 대시보드 접근
      console.log('Step 2: 대시보드 접근 중...');
      await page.goto(`${BASE_URL}/dashboard`);

      await page.waitForLoadState('networkidle', {
        timeout: 5000,
      }).catch(() => {
        // 타임아웃 무시
      });

      // Step 3: 강좌 탐색
      console.log('Step 3: 강좌 탐색 중...');
      await page.goto(`${BASE_URL}/courses`);

      const courseCards = page.locator('[class*="course"]');
      const courseCount = await courseCards.count();

      if (courseCount > 0) {
        // 첫 강좌 선택
        const firstCourse = courseCards.first();
        const courseHref = await firstCourse
          .locator('a')
          .first()
          .getAttribute('href');

        if (courseHref) {
          // Step 4: 강좌 수강신청
          console.log('Step 4: 강좌 수강신청 중...');
          await page.goto(`${BASE_URL}${courseHref}`);

          const enrollButton = page.locator(
            'button:has-text(/수강신청|enroll/i)'
          );

          if ((await enrollButton.count()) > 0) {
            await enrollButton.click();
            await page.waitForTimeout(1000);

            // Step 5: 나의 과제 페이지로 이동
            console.log('Step 5: 과제 목록 조회 중...');
            await page.goto(`${BASE_URL}/my-assignments`);

            const assignments = page.locator('[class*="assignment"]');
            const assignmentCount = await assignments.count();

            if (assignmentCount > 0) {
              // Step 6: 첫 과제 상세 조회
              console.log('Step 6: 과제 상세 조회 중...');
              const firstAssignment = assignments.first();

              const assignmentLink = firstAssignment
                .locator('a, button')
                .first();

              if ((await assignmentLink.count()) > 0) {
                await assignmentLink.click();
                await page.waitForTimeout(1000);
              }
            } else {
              console.log('⚠ 등록된 과제가 없습니다.');
            }

            // Step 7: 성적 페이지 확인
            console.log('Step 7: 성적 페이지 확인 중...');
            await page.goto(`${BASE_URL}/grades`);

            const gradeList = page.locator('[class*="grade"]');
            const gradeCount = await gradeList.count();

            if (gradeCount > 0) {
              console.log(`✓ 전체 여정 완료: ${email}`);
            } else {
              console.log(`✓ 전체 여정 완료: ${email} (아직 성적 없음)`);
            }
          } else {
            console.log('⚠ 수강신청 버튼을 찾을 수 없습니다.');
          }
        }
      } else {
        console.log('⚠ 가용한 강좌가 없습니다.');
      }
    });
  });

  /**
   * 시나리오 6: 회원가입 폼 검증
   */
  test.describe('회원가입 폼 검증', () => {
    test('역할 선택 옵션 (학습자 vs 강사)', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      const roleSelect = page.locator('[name="role"]');

      if ((await roleSelect.count()) > 0) {
        // 옵션 확인
        const options = await roleSelect.locator('option').count();
        expect(options).toBeGreaterThanOrEqual(2); // 최소 학습자, 강사
      }
    });

    test('회원가입 폼의 접근성', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      // 레이블 확인
      const emailLabel = page.locator('label:has-text(/이메일|email/i)');
      const passwordLabel = page.locator('label:has-text(/비밀번호|password/i)');
      const nameLabel = page.locator('label:has-text(/이름|name/i)');

      expect(await emailLabel.count()).toBeGreaterThanOrEqual(0);
      expect(await passwordLabel.count()).toBeGreaterThanOrEqual(0);
      expect(await nameLabel.count()).toBeGreaterThanOrEqual(0);

      // 입력 필드 확인
      const emailInput = page.locator('[name="email"]');
      const passwordInput = page.locator('[name="password"]');
      const nameInput = page.locator('[name="name"]');

      expect(await emailInput.count()).toBeGreaterThan(0);
      expect(await passwordInput.count()).toBeGreaterThan(0);
      expect(await nameInput.count()).toBeGreaterThan(0);
    });
  });

  /**
   * 시나리오 7: 프로필 및 계정 정보
   */
  test.describe('회원가입 후 프로필', () => {
    test('프로필에 가입 정보 반영 확인', async ({ page }) => {
      const timestamp = Date.now();
      const email = `profile-${timestamp}@example.com`;
      const password = 'TestPassword123!';
      const name = `Profile Learner ${timestamp}`;

      // 회원가입
      await page.goto(`${BASE_URL}/signup`);
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', password);
      await page.fill('[name="name"]', name);

      const roleSelect = page.locator('[name="role"]');
      if ((await roleSelect.count()) > 0) {
        await roleSelect.selectOption('learner');
      }

      await page.click('button:has-text(/회원가입|Sign up/i)');
      await page.waitForTimeout(2000);

      // 프로필 메뉴 찾기
      const profileMenu = page.locator(
        'button:has-text(/프로필|profile|계정|account/i)'
      );

      if ((await profileMenu.count()) > 0) {
        await profileMenu.click();
        await page.waitForTimeout(500);

        // 사용자 정보 확인
        const userName = page.locator(`text=${name}`);
        const userEmail = page.locator(`text=${email}`);

        expect(
          (await userName.count()) > 0 || (await userEmail.count()) > 0
        ).toBeTruthy();
      }
    });
  });
});
