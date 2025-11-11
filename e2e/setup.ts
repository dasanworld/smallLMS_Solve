import { test as setup, expect, type StorageState } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TokenManager } from './shared/token-manager';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 고정 데모 계정 (환경변수 우선)
const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || 'inst-demo@test.com';
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || 'test123!';
const INSTRUCTOR_NAME = 'Demo Instructor';

const LEARNER_EMAIL = process.env.LEARNER_EMAIL || 'learn-demo@test.com';
const LEARNER_PASSWORD = process.env.LEARNER_PASSWORD || 'test123!';
const LEARNER_NAME = 'Demo Learner';

function writeJsonFile(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function persistToken(
  role: 'instructor' | 'learner',
  page: Parameters<typeof setup>[0]['page'],
  storageState: StorageState,
  metadata: { email: string; name: string }
) {
  const tokenData = await TokenManager.extractToken(page);

  if (!tokenData) {
    console.warn(`[Setup] Failed to extract ${role} token from localStorage`);
    return;
  }

  await TokenManager.saveToken(role, tokenData, storageState, {
    email: metadata.email,
    name: metadata.name,
  });
}

// 계정 정보를 파일에 저장하는 함수
function saveTestAccounts() {
  const instructorToken = TokenManager.loadToken('instructor');
  const learnerToken = TokenManager.loadToken('learner');

  const accounts = {
    instructor: {
      email: INSTRUCTOR_EMAIL,
      password: INSTRUCTOR_PASSWORD,
      name: INSTRUCTOR_NAME,
      accessToken: instructorToken?.accessToken ?? null,
    },
    learner: {
      email: LEARNER_EMAIL,
      password: LEARNER_PASSWORD,
      name: LEARNER_NAME,
      accessToken: learnerToken?.accessToken ?? null,
    },
  };

  const filePath = path.join(__dirname, 'test-accounts.json');
  writeJsonFile(filePath, accounts);
  console.log(`\n💾 테스트 계정 정보 저장: ${filePath}`);
}

/**
 * 강사 로그인 (고정 계정)
 */
setup('강사 로그인 (Setup: no signup)', async ({ page, context }) => {
  console.log('\n=== 🔧 강사 Setup 시작 (로그인 전용) ===');
  console.log(`📧 강사 이메일: ${INSTRUCTOR_EMAIL}`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', INSTRUCTOR_EMAIL);
  await page.fill('input[type="password"]', INSTRUCTOR_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  console.log('✅ 강사 로그인 완료');

  // 쿠키/세션 저장
  const cookies = await context.cookies();
  const state = await context.storageState();

  // 강사 상태 저장
  if (cookies.length > 0) {
    await page.context().addCookies(cookies);
  }

  await persistToken(
    'instructor',
    page,
    state,
    { email: INSTRUCTOR_EMAIL, name: INSTRUCTOR_NAME }
  );

  console.log('✅ 강사 세션 저장 완료');

  // 첫 번째 setup 완료 시 계정 정보 저장
  saveTestAccounts();
});

/**
 * 학습자 로그인 (고정 계정)
 */
setup('학습자 로그인 (Setup: no signup)', async ({ page, context }) => {
  console.log('=== 🔧 학습자 Setup 시작 (로그인 전용) ===');
  console.log(`📧 학습자 이메일: ${LEARNER_EMAIL}`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', LEARNER_EMAIL);
  await page.fill('input[type="password"]', LEARNER_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  console.log('✅ 학습자 로그인 완료');

  // 쿠키/세션 저장
  const cookies = await context.cookies();
  const state = await context.storageState();

  // 학습자 상태 저장
  if (cookies.length > 0) {
    await page.context().addCookies(cookies);
  }

  await persistToken(
    'learner',
    page,
    state,
    { email: LEARNER_EMAIL, name: LEARNER_NAME }
  );

  console.log('✅ 학습자 세션 저장 완료\n');

  // 최종 계정/토큰 정보 업데이트
  saveTestAccounts();
});
