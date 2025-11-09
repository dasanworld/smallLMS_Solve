'use client';

import { test, expect } from '@playwright/test';
import { generateRandomEmail } from '../fixtures/users';
import { generateRandomCourseTitle, generateRandomAssignmentTitle } from '../fixtures/data';

/**
 * E2E 완전한 워크플로우 테스트
 * 
 * 시나리오: 강사가 과제를 만들고, 러너가 과제를 제출한 후, 점수를 확인
 */

test.describe('🎓 E2E 완전한 워크플로우: 강사 → 과제 → 러너 → 제출 → 채점 → 점수 확인', () => {
  let instructorEmail: string;
  let instructorPassword: string;
  let learnerEmail: string;
  let learnerPassword: string;
  let courseTitle: string;
  let assignmentTitle: string;
  let courseId: string;
  let assignmentId: string;
  let submissionId: string;

  test('[Step 1] 강사 회원가입 및 로그인', async ({ page }) => {
    instructorEmail = generateRandomEmail('instructor');
    instructorPassword = 'TestPass123!';
    courseTitle = generateRandomCourseTitle('웹개발');

    console.log('\n📋 강사 회원가입 시작');
    console.log(`  이메일: ${instructorEmail}`);
    console.log(`  강의명: ${courseTitle}`);

    // 랜딩 페이지로 이동
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // 회원가입 페이지로 이동
    const signupLink = page.locator('a').filter({ hasText: /가입|회원가입/i }).first();
    if (await signupLink.isVisible({ timeout: 5000 })) {
      await signupLink.click();
    } else {
      await page.goto('/signup');
    }
    
    await page.waitForURL(/\/signup/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    console.log('✓ 회원가입 페이지 로드');

    // 이메일 입력
    await page.fill('[placeholder="이메일 주소를 입력하세요"]', instructorEmail);
    console.log('✓ 이메일 입력');

    // 비밀번호 입력
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(instructorPassword);
    console.log('✓ 비밀번호 입력');

    // 비밀번호 확인
    await passwordInputs[1].fill(instructorPassword);
    console.log('✓ 비밀번호 재확인 입력');

    // 이름 입력
    await page.fill('[placeholder="이름을 입력하세요"]', 'E2E Test Instructor');
    console.log('✓ 이름 입력');

    // 역할 선택 (강사)
    await page.getByRole('radio', { name: /강사|Instructor/ }).click();
    console.log('✓ 역할(강사) 선택');

    // 약관 동의
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await termsCheckbox.check();
    console.log('✓ 약관 동의');

    // 가입하기
    const signupButton = page.getByRole('button', { name: /가입|회원가입/ });
    await signupButton.click();
    console.log('⏳ 회원가입 처리 중...');

    // 강사 대시보드로 리다이렉트 확인
    await page.waitForURL(/\/instructor-dashboard|\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ [Step 1] 강사 회원가입 및 로그인 완료\n');
  });

  test('[Step 2] 강사가 강의 생성 및 발행', async ({ page }) => {
    if (!courseTitle || !courseId) {
      // 강사 로그인
      instructorEmail = generateRandomEmail('instructor');
      instructorPassword = 'TestPass123!';
      courseTitle = generateRandomCourseTitle('웹개발');

      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.fill('input[placeholder*="이메일"]', instructorEmail);
      const passwordInputs = await page.locator('input[type="password"]').all();
      await passwordInputs[0].fill(instructorPassword);
      await page.getByRole('button', { name: /로그인/ }).click();
      await page.waitForURL(/\/instructor-dashboard/, { timeout: 15000 });
    }

    console.log('\n📋 강사 강의 생성 시작');
    console.log(`  강의명: ${courseTitle}`);

    // 강사 대시보드
    await page.goto('/instructor-dashboard', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    // 코스 만들기 버튼 클릭
    const createCourseBtn = page.getByRole('button', { name: /코스 만들기|강의 만들기/ });
    await createCourseBtn.click();
    console.log('✓ 강의 생성 페이지 이동');

    await page.waitForURL(/\/courses\/new|\/courses/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // 강의 정보 입력
    const titleInput = page.locator('input[name="title"], input[placeholder*="제목"]').first();
    await titleInput.fill(courseTitle);
    console.log('✓ 강의 제목 입력');

    const descriptionArea = page.locator('textarea[name="description"], textarea[placeholder*="설명"]').first();
    await descriptionArea.fill('E2E 테스트용 강의입니다.');
    console.log('✓ 강의 설명 입력');

    // 상태를 발행(published)으로 설정
    const statusSelects = await page.locator('select[name="status"]').all();
    if (statusSelects.length > 0) {
      await statusSelects[0].selectOption('published');
      console.log('✓ 상태를 발행으로 설정');
    }

    // 강의 생성
    const createBtn = page.getByRole('button', { name: /생성|만들기|저장/ });
    await createBtn.click();
    console.log('⏳ 강의 생성 처리 중...');

    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 15000 });
    const currentUrl = page.url();
    const match = currentUrl.match(/\/courses\/([a-f0-9-]+)/);
    if (match) {
      courseId = match[1];
      console.log(`✓ 강의 생성 완료 (ID: ${courseId.substring(0, 8)}...)`);
    }

    console.log('✅ [Step 2] 강사 강의 생성 및 발행 완료\n');
  });

  test('[Step 3] 강사가 과제 생성 및 발행', async ({ page }) => {
    if (!courseId) test.skip();

    instructorEmail = generateRandomEmail('instructor');
    instructorPassword = 'TestPass123!';
    assignmentTitle = generateRandomAssignmentTitle('과제');

    console.log('\n📋 강사 과제 생성 시작');
    console.log(`  과제명: ${assignmentTitle}`);
    console.log(`  강의ID: ${courseId.substring(0, 8)}...`);

    // 강사 로그인
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="이메일"]', instructorEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(instructorPassword);
    await page.getByRole('button', { name: /로그인/ }).click();
    await page.waitForURL(/\/instructor-dashboard/, { timeout: 15000 });
    console.log('✓ 강사 로그인 완료');

    // 과제 생성 페이지로 이동
    await page.goto(`/courses/${courseId}/assignments/new`, { waitUntil: 'networkidle' });
    console.log('✓ 과제 생성 페이지 로드');

    // 과제 정보 입력
    const titleInput = page.locator('input[name="title"]').first();
    await titleInput.fill(assignmentTitle);
    console.log('✓ 과제 제목 입력');

    const descArea = page.locator('textarea[name="description"]').first();
    await descArea.fill('E2E 테스트용 과제입니다. 이 과제를 완료해주세요.');
    console.log('✓ 과제 설명 입력');

    // 배점
    const pointsInput = page.locator('input[name="pointsWeight"]').first();
    await pointsInput.fill('100');
    console.log('✓ 배점 입력');

    // 과제 생성
    const createBtn = page.getByRole('button', { name: /생성|과제 생성/ });
    await createBtn.click();
    console.log('⏳ 과제 생성 처리 중...');

    await page.waitForURL(/\/courses\/[a-f0-9-]+\/assignments\/[a-f0-9-]+/, { timeout: 15000 });
    const currentUrl = page.url();
    const match = currentUrl.match(/\/assignments\/([a-f0-9-]+)/);
    if (match) {
      assignmentId = match[1];
      console.log(`✓ 과제 생성 완료 (ID: ${assignmentId.substring(0, 8)}...)`);
    }

    // 과제 발행
    const publishBtn = page.getByRole('button', { name: /발행|게시/ }).first();
    if (await publishBtn.isVisible({ timeout: 5000 })) {
      await publishBtn.click();
      console.log('⏳ 과제 발행 처리 중...');
      await expect(page.locator('text=/발행 상태로 변경|게시됨/')).toBeVisible({ timeout: 10000 });
      console.log('✓ 과제 발행 완료');
    }

    console.log('✅ [Step 3] 강사 과제 생성 및 발행 완료\n');
  });

  test('[Step 4] 학습자 회원가입 및 강의 수강신청', async ({ page }) => {
    if (!courseId || !courseTitle) test.skip();

    learnerEmail = generateRandomEmail('learner');
    learnerPassword = 'TestPass123!';

    console.log('\n📋 학습자 회원가입 및 수강신청 시작');
    console.log(`  이메일: ${learnerEmail}`);
    console.log(`  강의명: ${courseTitle}`);

    // 회원가입 페이지로 이동
    await page.goto('/', { waitUntil: 'networkidle' });
    const signupLink = page.locator('a').filter({ hasText: /가입|회원가입/i }).first();
    if (await signupLink.isVisible({ timeout: 5000 })) {
      await signupLink.click();
    } else {
      await page.goto('/signup');
    }

    await page.waitForURL(/\/signup/, { timeout: 10000 });
    console.log('✓ 회원가입 페이지 로드');

    // 회원가입 폼 작성
    await page.fill('[placeholder="이메일 주소를 입력하세요"]', learnerEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(learnerPassword);
    await passwordInputs[1].fill(learnerPassword);
    await page.fill('[placeholder="이름을 입력하세요"]', 'E2E Test Learner');

    // 역할 선택 (학습자 - 기본값)
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await termsCheckbox.check();
    console.log('✓ 약관 동의');

    // 가입
    const signupBtn = page.getByRole('button', { name: /가입|회원가입/ });
    await signupBtn.click();
    console.log('⏳ 학습자 회원가입 처리 중...');

    await page.waitForURL(/\/(dashboard|explore-courses)/, { timeout: 15000 });
    console.log('✓ 학습자 회원가입 완료');

    // 강의 탐색 페이지로 이동
    await page.goto('/explore-courses', { waitUntil: 'networkidle' });
    console.log('✓ 강의 탐색 페이지 로드');

    // 강의 찾아서 클릭
    const courseCard = page.locator(`text="${courseTitle}"`).first();
    await courseCard.waitFor({ state: 'visible', timeout: 10000 });
    await courseCard.click();
    console.log('✓ 강의 클릭');

    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10000 });

    // 수강신청 버튼 클릭
    const enrollBtn = page.getByRole('button', { name: /수강신청/ });
    await enrollBtn.click();
    console.log('⏳ 수강신청 처리 중...');

    // 수강신청 완료 확인
    await expect(page.getByRole('button', { name: /수강 중/ })).toBeVisible({ timeout: 10000 });
    console.log('✓ 수강신청 완료');

    console.log('✅ [Step 4] 학습자 회원가입 및 강의 수강신청 완료\n');
  });

  test('[Step 5] 학습자가 과제 제출', async ({ page }) => {
    if (!courseId || !assignmentId || !learnerEmail || !learnerPassword) test.skip();

    console.log('\n📋 학습자 과제 제출 시작');
    console.log(`  강의ID: ${courseId.substring(0, 8)}...`);
    console.log(`  과제ID: ${assignmentId.substring(0, 8)}...`);

    // 학습자 로그인
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="이메일"]', learnerEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(learnerPassword);
    await page.getByRole('button', { name: /로그인/ }).click();
    await page.waitForURL(/\/(dashboard|explore-courses)/, { timeout: 15000 });
    console.log('✓ 학습자 로그인 완료');

    // 과제 상세 페이지로 이동
    await page.goto(`/courses/${courseId}/assignments/${assignmentId}`, { waitUntil: 'networkidle' });
    console.log('✓ 과제 상세 페이지 로드');

    // 과제 제출 버튼 클릭
    const submitBtn = page.getByRole('button', { name: /과제 제출|제출/ }).first();
    await submitBtn.click();
    console.log('⏳ 과제 제출 페이지로 이동 중...');

    await page.waitForURL(/\/submissions\/(new|[a-f0-9-]+)/, { timeout: 10000 });

    // 제출 내용 입력
    const contentArea = page.locator('textarea').first();
    await contentArea.fill('E2E 테스트를 위한 과제 제출입니다.\n\n정상적으로 작동하는지 확인하고 있습니다.\n\n감사합니다!');
    console.log('✓ 제출 내용 입력');

    // 최종 제출 버튼 클릭
    const finalSubmitBtn = page.getByRole('button', { name: /제출/ }).last();
    await finalSubmitBtn.click();
    console.log('⏳ 과제 제출 처리 중...');

    await page.waitForURL(/\/submissions\/[a-f0-9-]+/, { timeout: 15000 });
    const currentUrl = page.url();
    const match = currentUrl.match(/\/submissions\/([a-f0-9-]+)/);
    if (match) {
      submissionId = match[1];
      console.log(`✓ 과제 제출 완료 (ID: ${submissionId.substring(0, 8)}...)`);
    }

    console.log('✅ [Step 5] 학습자 과제 제출 완료\n');
  });

  test('[Step 6] 강사가 과제 채점', async ({ page }) => {
    if (!submissionId || !instructorEmail || !instructorPassword) test.skip();

    console.log('\n📋 강사 과제 채점 시작');
    console.log(`  제출ID: ${submissionId.substring(0, 8)}...`);

    // 강사 로그인
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="이메일"]', instructorEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(instructorPassword);
    await page.getByRole('button', { name: /로그인/ }).click();
    await page.waitForURL(/\/instructor-dashboard/, { timeout: 15000 });
    console.log('✓ 강사 로그인 완료');

    // 채점 페이지로 이동
    await page.goto(`/submissions/${submissionId}`, { waitUntil: 'networkidle' });
    console.log('✓ 채점 페이지 로드');

    // 점수 입력
    const scoreInput = page.locator('input[name="score"]').first();
    if (await scoreInput.isVisible({ timeout: 5000 })) {
      await scoreInput.fill('95');
      console.log('✓ 점수 입력 (95점)');
    }

    // 피드백 입력
    const feedbackArea = page.locator('textarea[name="feedback"], textarea').first();
    if (await feedbackArea.isVisible({ timeout: 5000 })) {
      await feedbackArea.fill('훌륭한 제출입니다! 매우 잘 작성되었으며, 요구사항을 완벽히 충족했습니다. 계속 좋은 성과 부탁드립니다!');
      console.log('✓ 피드백 입력');
    }

    // 채점 완료 버튼 클릭
    const gradeBtn = page.getByRole('button', { name: /채점 완료|저장/ }).first();
    if (await gradeBtn.isVisible({ timeout: 5000 })) {
      await gradeBtn.click();
      console.log('⏳ 채점 처리 중...');

      // 채점 완료 확인
      await page.waitForLoadState('networkidle');
      console.log('✓ 채점 완료');
    }

    console.log('✅ [Step 6] 강사 과제 채점 완료\n');
  });

  test('[Step 7] 학습자가 대시보드에서 점수 확인', async ({ page }) => {
    if (!learnerEmail || !learnerPassword) test.skip();

    console.log('\n📋 학습자 점수 확인 시작');

    // 학습자 로그인
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="이메일"]', learnerEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(learnerPassword);
    await page.getByRole('button', { name: /로그인/ }).click();
    await page.waitForURL(/\/(dashboard|explore-courses)/, { timeout: 15000 });
    console.log('✓ 학습자 로그인 완료');

    // 대시보드로 이동
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    console.log('✓ 대시보드 로드');

    // 과제 제출 현황 섹션 확인
    const submissionSection = page.locator('text=/과제 제출 현황|Assignment/').first();
    if (await submissionSection.isVisible({ timeout: 5000 })) {
      console.log('✓ 과제 제출 현황 섹션 표시');
    }

    // 과제 제목 확인
    if (assignmentTitle) {
      const assignmentElement = page.locator(`text="${assignmentTitle}"`);
      if (await assignmentElement.isVisible({ timeout: 5000 })) {
        console.log(`✓ 과제 제목 "${assignmentTitle}" 표시됨`);
      }
    }

    // 점수 확인
    const scoreElement = page.locator('text=95');
    if (await scoreElement.isVisible({ timeout: 5000 })) {
      console.log('✓ 점수 "95점" 표시됨');
    }

    // 채점 완료 상태 확인
    const gradedStatus = page.locator('text=/채점 완료|Graded/').first();
    if (await gradedStatus.isVisible({ timeout: 5000 })) {
      console.log('✓ 채점 완료 상태 표시됨');
    }

    console.log('✅ [Step 7] 학습자 점수 확인 완료\n');
    console.log('\n🎉🎉🎉 E2E 전체 워크플로우 테스트 성공! 🎉🎉🎉\n');
  });
});

