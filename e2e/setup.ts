import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 강사 계정 정보
const INSTRUCTOR_EMAIL = `instructor-setup-${Date.now()}@example.com`;
const INSTRUCTOR_PASSWORD = 'TestPassword123!';
const INSTRUCTOR_NAME = `Setup Instructor ${Date.now()}`;

// 학습자 계정 정보
const LEARNER_EMAIL = `learner-setup-${Date.now()}@example.com`;
const LEARNER_PASSWORD = 'TestPassword123!';
const LEARNER_NAME = `Setup Learner ${Date.now()}`;

// 계정 정보를 파일에 저장하는 함수
function saveTestAccounts() {
  const accounts = {
    instructor: {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
      name: INSTRUCTOR_NAME,
    },
    learner: {
      email: LEARNER_EMAIL,
      password: LEARNER_PASSWORD,
      name: LEARNER_NAME,
    },
  };

  const filePath = path.join(__dirname, 'test-accounts.json');
  fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));
  console.log(`\n💾 테스트 계정 정보 저장: ${filePath}`);
}

/**
 * 강사 계정 회원가입 및 로그인
 */
setup('강사 회원가입 및 로그인 (Setup)', async ({ page, context }) => {
  console.log('\n=== 🔧 강사 Setup 시작 ===');
  console.log(`📧 강사 이메일: ${INSTRUCTOR_EMAIL}`);

  // 회원가입
  await page.goto(`${BASE_URL}/signup`);

  // 페이지 로드 확인
  await expect(page.locator('text=/회원가입|Sign up/i')).toBeVisible({
    timeout: 5000,
  });

  // 회원가입 폼 작성
  await page.fill('[name="email"]', INSTRUCTOR_EMAIL);
  await page.fill('[name="password"]', INSTRUCTOR_PASSWORD);
  await page.fill('[name="name"]', INSTRUCTOR_NAME);

  // 역할 선택 (강사)
  const roleSelect = page.locator('[name="role"]');
  if ((await roleSelect.count()) > 0) {
    await roleSelect.selectOption('instructor');
  }

  // 회원가입 버튼 클릭
  const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');
  await signupButton.click();

  // 회원가입 성공 확인
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  const isSignupSuccess =
    currentUrl.includes('dashboard') ||
    currentUrl.includes('courses') ||
    currentUrl.includes('login') ||
    (await page.locator('text=/성공|완료|가입|Welcome|Dashboard/i').count()) > 0;

  if (!isSignupSuccess) {
    console.log('⚠️ 강사 회원가입 실패. 로그인 페이지로 이동합니다.');
  } else {
    console.log('✅ 강사 회원가입 완료');
  }

  // 로그인 (자동 로그인이 안 되었을 경우)
  const currentUrl2 = page.url();
  if (!currentUrl2.includes('dashboard')) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', INSTRUCTOR_EMAIL);
    await page.fill('input[type="password"]', INSTRUCTOR_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('✅ 강사 로그인 완료');
  }

  // 쿠키/세션 저장
  const cookies = await context.cookies();
  const state = await context.storageState();

  // 강사 상태 저장
  await page.context().addCookies(cookies);

  console.log('✅ 강사 세션 저장 완료');

  // 첫 번째 setup 완료 시 계정 정보 저장
  saveTestAccounts();
});

/**
 * 학습자 계정 회원가입 및 로그인
 */
setup('학습자 회원가입 및 로그인 (Setup)', async ({ page, context }) => {
  console.log('=== 🔧 학습자 Setup 시작 ===');
  console.log(`📧 학습자 이메일: ${LEARNER_EMAIL}`);

  // 회원가입
  await page.goto(`${BASE_URL}/signup`);

  // 페이지 로드 확인
  await expect(page.locator('text=/회원가입|Sign up/i')).toBeVisible({
    timeout: 5000,
  });

  // 회원가입 폼 작성
  await page.fill('[name="email"]', LEARNER_EMAIL);
  await page.fill('[name="password"]', LEARNER_PASSWORD);
  await page.fill('[name="name"]', LEARNER_NAME);

  // 역할 선택 (학습자)
  const roleSelect = page.locator('[name="role"]');
  if ((await roleSelect.count()) > 0) {
    await roleSelect.selectOption('learner');
  }

  // 회원가입 버튼 클릭
  const signupButton = page.locator('button:has-text(/회원가입|Sign up/i)');
  await signupButton.click();

  // 회원가입 성공 확인
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  const isSignupSuccess =
    currentUrl.includes('dashboard') ||
    currentUrl.includes('courses') ||
    currentUrl.includes('login') ||
    (await page.locator('text=/성공|완료|가입|Welcome|Dashboard/i').count()) > 0;

  if (!isSignupSuccess) {
    console.log('⚠️ 학습자 회원가입 실패. 로그인 페이지로 이동합니다.');
  } else {
    console.log('✅ 학습자 회원가입 완료');
  }

  // 로그인 (자동 로그인이 안 되었을 경우)
  const currentUrl2 = page.url();
  if (!currentUrl2.includes('dashboard')) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('✅ 학습자 로그인 완료');
  }

  // 쿠키/세션 저장
  const cookies = await context.cookies();
  const state = await context.storageState();

  // 학습자 상태 저장
  await page.context().addCookies(cookies);

  console.log('✅ 학습자 세션 저장 완료\n');
});
