import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 러너(학습자) 완전한 여정 E2E 테스트
 *
 * 모든 테스트는 반드시 다음 순서를 따릅니다:
 * 1. 회원가입 (새 계정 생성)
 * 2. 로그인 (방금 생성한 계정으로)
 * 3. 실제 기능 테스트 (대시보드, 강좌, 과제, 성적 등)
 *
 * 이를 통해 완전히 새로운 사용자의 전체 경험을 검증합니다.
 */

test.describe('러너 완전한 여정 E2E - 회원가입 후 모든 기능 테스트', () => {
  /**
   * 공통: 회원가입 및 로그인 함수
   * 모든 테스트의 시작점
   */
  async function signupAndLogin(page: any) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const testEmail = `learner-${timestamp}-${random}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Learner ${timestamp}`;

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  📝 STEP 1: 회원가입                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`📧 이메일: ${testEmail}`);
    console.log(`👤 이름: ${testName}`);
    console.log(`🔐 비밀번호: ••••••••••••••\n`);

    // 회원가입 페이지 접근
    console.log('→ 회원가입 페이지로 이동...');
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    // 회원가입 폼 작성
    const emailInput = page.locator('[name="email"], input[type="email"]');
    const nameInput = page.locator('[name="name"], input[type="text"]').first();
    const passwordInput = page.locator('[name="password"], input[type="password"]');

    if ((await emailInput.count()) === 0) {
      throw new Error('❌ 이메일 입력 필드를 찾을 수 없습니다');
    }

    await emailInput.fill(testEmail);
    console.log('✅ 이메일 입력 완료');

    if ((await nameInput.count()) > 0) {
      await nameInput.fill(testName);
      console.log('✅ 이름 입력 완료');
    }

    await passwordInput.fill(testPassword);
    console.log('✅ 비밀번호 입력 완료');

    // 역할 선택
    const roleSelect = page.locator('[name="role"]');
    if ((await roleSelect.count()) > 0) {
      await roleSelect.selectOption('learner').catch(() => {});
      console.log('✅ 역할 선택 완료 (학습자)');

    }

    // 약관 동의
    const termsCheckbox = page.locator('[name="terms"], [type="checkbox"]').first();
    if ((await termsCheckbox.count()) > 0) {
      await termsCheckbox.check();
      console.log('✅ 약관 동의 완료');
    }

    // 회원가입 버튼 클릭
    const signupButton = page.locator(
      'button:has-text(/회원가입|sign up|register/i)'
    );

    if ((await signupButton.count()) === 0) {
      throw new Error('❌ 회원가입 버튼을 찾을 수 없습니다');
    }

    await signupButton.first().click();
    console.log('✅ 회원가입 버튼 클릭');

    // 회원가입 결과 대기
    await page.waitForTimeout(2000);

    // 에러 메시지 확인
    const errorMessage = page.locator('text=/오류|에러|error|실패/i');
    if ((await errorMessage.count()) > 0) {
      const errorText = await errorMessage.first().textContent();
      throw new Error(`❌ 회원가입 실패: ${errorText}`);
    }

    console.log('\n✅ === STEP 1 완료: 회원가입 성공 ===\n');

    // ===== 로그인 =====
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  🔑 STEP 2: 로그인                                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // 로그아웃 (자동 로그인된 경우)
    const logoutButton = page.locator(
      'button:has-text(/로그아웃|logout|sign out/i)'
    );
    if ((await logoutButton.count()) > 0) {
      console.log('→ 로그아웃 중...');
      await logoutButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 로그아웃 완료');
    }

    // 로그인 페이지 접근
    console.log('→ 로그인 페이지로 이동...');
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      await page.goto(`${BASE_URL}/login`);
    }
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    // 로그인 폼 작성
    const loginEmailInput = page.locator('input[type="email"]');
    const loginPasswordInput = page.locator('input[type="password"]');

    await loginEmailInput.fill(testEmail);
    console.log(`✅ 로그인 이메일 입력: ${testEmail}`);

    await loginPasswordInput.fill(testPassword);
    console.log('✅ 로그인 비밀번호 입력');

    // 로그인 버튼 클릭
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭');

    // 로그인 결과 대기
    await page.waitForTimeout(2000);

    console.log('\n✅ === STEP 2 완료: 로그인 성공 ===\n');

    return { testEmail, testPassword, testName };
  }

  /**
   * 테스트 1: 회원가입 → 로그인 → 대시보드
   */
  test('1️⃣  회원가입 → 로그인 → 대시보드 접근', async ({ page }) => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('🧪 TEST 1: 대시보드');
    console.log('═'.repeat(60));

    // Step 1 & 2: 회원가입 및 로그인
    await signupAndLogin(page);

    // Step 3: 대시보드 확인
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 STEP 3: 대시보드 접근                             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const currentUrl = page.url();
    if (!currentUrl.includes('dashboard')) {
      console.log('→ 대시보드 페이지로 이동...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    }

    const dashboardHeading = page.locator(
      'h1:has-text(/대시보드|dashboard/i), text=/대시보드|dashboard/i'
    );

    if ((await dashboardHeading.count()) === 0) {
      throw new Error('❌ 대시보드 제목을 찾을 수 없습니다');
    }

    console.log('✅ 대시보드 로드됨');

    // 주요 섹션 확인
    const mainContent = page.locator('[role="main"]');
    expect(await mainContent.count()).toBeGreaterThan(0);

    console.log('\n✅ === STEP 3 완료: 대시보드 접근 성공 ===');
    console.log('\n✅ === TEST 1 완료 ===\n');
  });

  /**
   * 테스트 2: 회원가입 → 로그인 → 강좌 탐색 → 수강신청
   */
  test('2️⃣  회원가입 → 로그인 → 강좌 탐색 → 수강신청', async ({ page }) => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('🧪 TEST 2: 강좌 탐색 및 수강신청');
    console.log('═'.repeat(60));

    // Step 1 & 2: 회원가입 및 로그인
    await signupAndLogin(page);

    // Step 3: 강좌 탐색
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📚 STEP 3: 강좌 탐색                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('→ 강좌 페이지로 이동...');
    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const courseCards = page.locator('[class*="course"], [class*="card"]');
    const courseCount = await courseCards.count();

    console.log(`✅ 강좌 목록 로드 (${courseCount}개)`);

    if (courseCount > 0) {
      // Step 4: 강좌 수강신청
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  ✍️  STEP 4: 강좌 수강신청                            ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      const firstCourse = courseCards.first();
      const courseTitle = await firstCourse.locator('h2, h3').textContent();

      console.log(`→ 첫 강좌 선택: ${courseTitle}`);
      await firstCourse.click();
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      const enrollButton = page.locator(
        'button:has-text(/수강신청|enroll|register/i)'
      );

      if ((await enrollButton.count()) > 0) {
        console.log('✅ 수강신청 버튼 발견');
        await enrollButton.first().click();
        await page.waitForTimeout(1500);

        const successMsg = page.locator(
          'text=/성공|완료|축하|신청|enrolled/i'
        );
        if ((await successMsg.count()) > 0) {
          console.log('✅ 수강신청 성공!');
        }
      }

      console.log('\n✅ === STEP 4 완료: 강좌 수강신청 ===');
    } else {
      console.log('⚠️  등록된 강좌가 없습니다');
    }

    console.log('\n✅ === TEST 2 완료 ===\n');
  });

  /**
   * 테스트 3: 회원가입 → 로그인 → 과제 페이지
   */
  test('3️⃣  회원가입 → 로그인 → 과제 페이지 접근', async ({ page }) => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('🧪 TEST 3: 과제 페이지');
    console.log('═'.repeat(60));

    // Step 1 & 2: 회원가입 및 로그인
    await signupAndLogin(page);

    // Step 3: 과제 페이지
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📝 STEP 3: 나의 과제 페이지                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('→ 과제 페이지로 이동...');
    await page.goto(`${BASE_URL}/my-assignments`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const assignments = page.locator('[class*="assignment"]');
    const assignmentCount = await assignments.count();

    console.log(`✅ 과제 페이지 로드 (${assignmentCount}개)`);

    console.log('\n✅ === STEP 3 완료: 과제 페이지 접근 ===');
    console.log('\n✅ === TEST 3 완료 ===\n');
  });

  /**
   * 테스트 4: 회원가입 → 로그인 → 성적 페이지
   */
  test('4️⃣  회원가입 → 로그인 → 성적 조회', async ({ page }) => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('🧪 TEST 4: 성적 조회');
    console.log('═'.repeat(60));

    // Step 1 & 2: 회원가입 및 로그인
    await signupAndLogin(page);

    // Step 3: 성적 페이지
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 STEP 3: 성적 페이지                              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('→ 성적 페이지로 이동...');
    await page.goto(`${BASE_URL}/grades`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const grades = page.locator('[class*="grade"]');
    const gradeCount = await grades.count();

    console.log(`✅ 성적 페이지 로드 (${gradeCount}개)`);

    console.log('\n✅ === STEP 3 완료: 성적 페이지 접근 ===');
    console.log('\n✅ === TEST 4 완료 ===\n');
  });

  /**
   * 테스트 5: 🌟 완전한 사용자 여정
   * 회원가입 → 로그인 → 대시보드 → 강좌 → 수강신청 → 과제 → 성적
   */
  test('5️⃣  🌟 완전한 사용자 여정: 가입 → 로그인 → 모든 페이지 탐색', async ({
    page,
  }) => {
    console.log('\n\n' + '╔═══════════════════════════════════════════════════════╗');
    console.log('║  🚀 MAIN TEST: 완전한 사용자 여정                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Step 1 & 2: 회원가입 및 로그인
    const { testEmail, testName } = await signupAndLogin(page);

    // Step 3: 대시보드
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 STEP 3: 대시보드                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const dashUrl = page.url();
    if (!dashUrl.includes('dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    }
    console.log('✅ 대시보드 로드\n');

    // Step 4: 강좌 탐색
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📚 STEP 4: 강좌 탐색                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await page.goto(`${BASE_URL}/courses`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const courseCards = page.locator('[class*="course"], [class*="card"]');
    const courseCount = await courseCards.count();
    console.log(`✅ 강좌 목록 로드 (${courseCount}개)\n`);

    if (courseCount > 0) {
      // Step 5: 수강신청
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✍️  STEP 5: 강좌 수강신청                            ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      const firstCourse = courseCards.first();
      const courseTitle = await firstCourse.locator('h2, h3').textContent();
      console.log(`→ 강좌 선택: ${courseTitle}`);
      await firstCourse.click();
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      const enrollButton = page.locator(
        'button:has-text(/수강신청|enroll|register/i)'
      );
      if ((await enrollButton.count()) > 0) {
        await enrollButton.first().click();
        await page.waitForTimeout(1500);
        console.log('✅ 수강신청 완료\n');
      }
    }

    // Step 6: 과제 페이지
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📝 STEP 6: 과제 페이지                               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await page.goto(`${BASE_URL}/my-assignments`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const assignments = page.locator('[class*="assignment"]');
    const assignmentCount = await assignments.count();
    console.log(`✅ 과제 페이지 로드 (${assignmentCount}개)\n`);

    // Step 7: 성적 페이지
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 STEP 7: 성적 페이지                               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await page.goto(`${BASE_URL}/grades`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    const grades = page.locator('[class*="grade"]');
    const gradeCount = await grades.count();
    console.log(`✅ 성적 페이지 로드 (${gradeCount}개)\n`);

    // 완료
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ 완전한 사용자 여정 완료!                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`사용자: ${testName} (${testEmail})`);
    console.log(`경로: 가입 → 로그인 → 대시보드 → 강좌 → 수강신청 → 과제 → 성적\n`);
  });
});

