import { Page, expect } from '@playwright/test';

/**
 * 인증 관련 헬퍼 함수
 * 회원가입, 로그인, 로그아웃 등의 인증 플로우를 간소화합니다.
 */

export interface SignupOptions {
  email: string;
  password: string;
  role: 'learner' | 'instructor' | 'operator';
  name?: string;
}

export interface LoginOptions {
  email: string;
  password: string;
}

/**
 * 회원가입
 */
export async function signup(page: Page, options: SignupOptions): Promise<void> {
  await page.goto('/signup');

  // 이메일 입력
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(options.email);

  // 비밀번호 입력
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(options.password);

  // 이름 입력 (있는 경우)
  if (options.name) {
    const nameInput = page.locator('input[name="name"], input[name="full_name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(options.name);
    }
  }

  // 역할 선택
  const roleSelect = page.locator('select[name="role"]');
  if (await roleSelect.count() > 0) {
    await roleSelect.selectOption(options.role);
  }

  // 회원가입 버튼 클릭
  await page.click('button:has-text("회원가입"), button:has-text("가입")');

  // 역할에 따라 대시보드로 리다이렉트 대기
  const dashboardPath = options.role === 'instructor' 
    ? '/instructor-dashboard' 
    : options.role === 'operator'
    ? '/operator-dashboard'
    : '/dashboard';
  
  await page.waitForURL(`**${dashboardPath}`, { timeout: 10000 });
}

/**
 * 로그인
 */
export async function login(page: Page, options: LoginOptions): Promise<void> {
  await page.goto('/login');

  // 이메일 입력
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(options.email);

  // 비밀번호 입력
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(options.password);

  // 로그인 버튼 클릭
  await page.click('button:has-text("로그인"), button[type="submit"]');

  // 대시보드로 리다이렉트 대기 (역할에 따라 다를 수 있음)
  await page.waitForURL(/\/(dashboard|instructor-dashboard|operator-dashboard)/, { timeout: 10000 });
}

/**
 * 로그아웃
 */
export async function logout(page: Page): Promise<void> {
  // 글로벌 네비게이션에서 사용자 메뉴 찾기
  const userMenuButton = page.locator('button[aria-label*="user"], button[aria-label*="사용자"], [data-testid="user-menu"]').first();
  
  if (await userMenuButton.count() > 0) {
    await userMenuButton.click();
    
    // 로그아웃 버튼 클릭
    const logoutButton = page.locator('button:has-text("로그아웃"), [role="menuitem"]:has-text("로그아웃")');
    await logoutButton.click();
  } else {
    // 대체 방법: 직접 로그아웃 API 호출
    await page.goto('/');
    // 로그아웃 버튼을 다른 방법으로 찾기
    const logoutBtn = page.locator('text=로그아웃').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
    }
  }

  // 랜딩페이지로 리다이렉트 대기
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * 현재 로그인 상태 확인
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // 글로벌 네비게이션이 표시되는지 확인
  const nav = page.locator('nav, [role="navigation"]').first();
  if (await nav.count() === 0) {
    return false;
  }

  // 사용자 메뉴나 로그아웃 버튼이 있는지 확인
  const userMenu = page.locator('button[aria-label*="user"], text=로그아웃').first();
  return (await userMenu.count()) > 0;
}

/**
 * 특정 역할로 로그인된 상태인지 확인
 */
export async function isLoggedInAsRole(page: Page, role: 'learner' | 'instructor' | 'operator'): Promise<boolean> {
  if (!(await isLoggedIn(page))) {
    return false;
  }

  // 역할 표시 확인 (글로벌 네비게이션에서)
  const roleBadge = page.locator(`text=${role === 'instructor' ? '강사' : role === 'operator' ? '운영자' : '러너'}`);
  return (await roleBadge.count()) > 0;
}

