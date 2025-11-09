import { Page, expect } from '@playwright/test';

/**
 * 글로벌 네비게이션 관련 헬퍼 함수
 * 메뉴 항목 클릭, 역할 확인 등의 기능을 간소화합니다.
 */

/**
 * 글로벌 네비게이션에서 메뉴 항목 클릭
 */
export async function clickNavMenuItem(page: Page, menuLabel: string): Promise<void> {
  // 메뉴 항목 찾기 (데스크톱 또는 모바일)
  const menuItem = page.locator(`nav a:has-text("${menuLabel}"), [role="menuitem"]:has-text("${menuLabel}")`).first();
  
  if (await menuItem.count() > 0) {
    await menuItem.click();
  } else {
    // 모바일 메뉴 열기 (햄버거 메뉴)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // 다시 메뉴 항목 찾기
      const mobileMenuItem = page.locator(`text=${menuLabel}`).first();
      await mobileMenuItem.click();
    }
  }
}

/**
 * 홈으로 이동
 */
export async function navigateToHome(page: Page): Promise<void> {
  await clickNavMenuItem(page, '홈');
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * 대시보드로 이동
 */
export async function navigateToDashboard(page: Page, role?: 'learner' | 'instructor' | 'operator'): Promise<void> {
  await clickNavMenuItem(page, '대시보드');
  
  // 역할에 따라 대시보드 경로 확인
  if (role === 'instructor') {
    await page.waitForURL('/instructor-dashboard', { timeout: 5000 });
  } else if (role === 'operator') {
    await page.waitForURL('/operator-dashboard', { timeout: 5000 });
  } else {
    await page.waitForURL('/dashboard', { timeout: 5000 });
  }
}

/**
 * 코스 관리로 이동 (강사용)
 */
export async function navigateToCourseManagement(page: Page): Promise<void> {
  await clickNavMenuItem(page, '코스관리');
  await page.waitForURL('/courses', { timeout: 5000 });
}

/**
 * 강의 탐색으로 이동 (학습자용)
 */
export async function navigateToExploreCourses(page: Page): Promise<void> {
  await clickNavMenuItem(page, '강의 탐색');
  await page.waitForURL('/explore-courses', { timeout: 5000 });
}

/**
 * 과제 관리로 이동
 */
export async function navigateToAssignments(page: Page): Promise<void> {
  await clickNavMenuItem(page, '과제');
  await page.waitForURL('/courses/assignments', { timeout: 5000 });
}

/**
 * 사용자 프로필 드롭다운 열기
 */
export async function openUserMenu(page: Page): Promise<void> {
  const userMenuButton = page.locator('button[aria-label*="user"], button[aria-label*="사용자"], [data-testid="user-menu"]').first();
  
  if (await userMenuButton.count() > 0) {
    await userMenuButton.click();
    await page.waitForTimeout(300); // 드롭다운 애니메이션 대기
  }
}

/**
 * 현재 사용자 역할 확인
 */
export async function getCurrentUserRole(page: Page): Promise<'learner' | 'instructor' | 'operator' | null> {
  // 글로벌 네비게이션에서 역할 배지 찾기
  const roleBadge = page.locator('badge, [class*="badge"], span[class*="role"]').first();
  
  if (await roleBadge.count() > 0) {
    const roleText = await roleBadge.textContent();
    
    if (roleText?.includes('강사')) {
      return 'instructor';
    } else if (roleText?.includes('운영자')) {
      return 'operator';
    } else if (roleText?.includes('러너')) {
      return 'learner';
    }
  }
  
  // 대체 방법: 사용자 메뉴에서 확인
  await openUserMenu(page);
  
  const roleInMenu = page.locator('text=/강사|운영자|러너/').first();
  if (await roleInMenu.count() > 0) {
    const roleText = await roleInMenu.textContent();
    if (roleText?.includes('강사')) return 'instructor';
    if (roleText?.includes('운영자')) return 'operator';
    if (roleText?.includes('러너')) return 'learner';
  }
  
  return null;
}

/**
 * 현재 사용자 이메일 확인
 */
export async function getCurrentUserEmail(page: Page): Promise<string | null> {
  await openUserMenu(page);
  
  // 이메일 표시 요소 찾기
  const emailElement = page.locator('text=/@/, [class*="email"]').first();
  
  if (await emailElement.count() > 0) {
    const emailText = await emailElement.textContent();
    // 이메일 형식 추출
    const emailMatch = emailText?.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : null;
  }
  
  return null;
}

/**
 * 네비게이션 메뉴 항목이 표시되는지 확인
 */
export async function isNavMenuItemVisible(page: Page, menuLabel: string): Promise<boolean> {
  const menuItem = page.locator(`nav a:has-text("${menuLabel}"), [role="menuitem"]:has-text("${menuLabel}")`).first();
  return (await menuItem.count()) > 0 && await menuItem.isVisible();
}

/**
 * 현재 활성화된 메뉴 항목 확인
 */
export async function getActiveNavMenuItem(page: Page): Promise<string | null> {
  const activeItem = page.locator('nav a[aria-current="page"], nav a[class*="active"]').first();
  
  if (await activeItem.count() > 0) {
    return await activeItem.textContent();
  }
  
  return null;
}

/**
 * 이전 페이지로 이동 (브라우저 뒤로가기)
 */
export async function navigateBack(page: Page): Promise<void> {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

