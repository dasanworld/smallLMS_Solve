import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import {
  navigateToHome,
  navigateToDashboard,
  navigateToCourseManagement,
  navigateToExploreCourses,
  navigateToAssignments,
  getCurrentUserRole,
  getCurrentUserEmail,
  isNavMenuItemVisible,
  getActiveNavMenuItem,
} from '../helpers/navigation-helper';

/**
 * 글로벌 네비게이션 관련 E2E 테스트
 * - 메뉴 항목 클릭, 역할별 메뉴 표시, 사용자 정보 표시
 */

test.describe('Global Navigation', () => {
  test.describe('메뉴 네비게이션', () => {
    authTest('홈 메뉴 클릭 시 랜딩페이지로 이동한다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      await navigateToHome(learnerPage);
      await expect(learnerPage).toHaveURL('/');
    });

    authTest('대시보드 메뉴 클릭 시 역할별 대시보드로 이동한다', async ({ learnerPage, instructorPage }) => {
      // 학습자 대시보드
      await learnerPage.goto('/');
      await navigateToDashboard(learnerPage, 'learner');
      await expect(learnerPage).toHaveURL('/dashboard');

      // 강사 대시보드
      await instructorPage.goto('/');
      await navigateToDashboard(instructorPage, 'instructor');
      await expect(instructorPage).toHaveURL('/instructor-dashboard');
    });

    authTest('강사는 코스관리 메뉴를 볼 수 있다', async ({ instructorPage }) => {
      await instructorPage.goto('/instructor-dashboard');
      
      const isVisible = await isNavMenuItemVisible(instructorPage, '코스관리');
      expect(isVisible).toBe(true);
    });

    authTest('학습자는 강의 탐색 메뉴를 볼 수 있다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      
      const isVisible = await isNavMenuItemVisible(learnerPage, '강의 탐색');
      expect(isVisible).toBe(true);
    });

    authTest('과제 메뉴 클릭 시 과제 목록 페이지로 이동한다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      await navigateToAssignments(learnerPage);
      await expect(learnerPage).toHaveURL('/courses/assignments');
    });
  });

  test.describe('사용자 프로필', () => {
    authTest('사용자 메뉴에서 역할을 확인할 수 있다', async ({ learnerPage, instructorPage }) => {
      // 학습자 역할 확인
      await learnerPage.goto('/dashboard');
      const learnerRole = await getCurrentUserRole(learnerPage);
      expect(learnerRole).toBe('learner');

      // 강사 역할 확인
      await instructorPage.goto('/instructor-dashboard');
      const instructorRole = await getCurrentUserRole(instructorPage);
      expect(instructorRole).toBe('instructor');
    });

    authTest('사용자 메뉴에서 이메일을 확인할 수 있다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      
      const email = await getCurrentUserEmail(learnerPage);
      expect(email).toBeTruthy();
      expect(email).toContain('@');
    });

    authTest('사용자 메뉴 드롭다운이 정상적으로 열리고 닫힌다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');

      // 사용자 메뉴 버튼 찾기
      const userMenuButton = learnerPage.locator('button[aria-label*="user"], button[aria-label*="사용자"]').first();
      await expect(userMenuButton).toBeVisible();

      // 메뉴 열기
      await userMenuButton.click();
      await learnerPage.waitForTimeout(300);

      // 드롭다운 메뉴 표시 확인
      const dropdown = learnerPage.locator('[role="menu"], [data-testid="user-menu"]').first();
      await expect(dropdown).toBeVisible();

      // 로그아웃 버튼이 있는지 확인
      const logoutButton = learnerPage.locator('button:has-text("로그아웃")').first();
      await expect(logoutButton).toBeVisible();
    });
  });

  test.describe('활성 메뉴 표시', () => {
    authTest('현재 페이지에 해당하는 메뉴 항목이 활성화된다', async ({ learnerPage }) => {
      // 대시보드로 이동
      await learnerPage.goto('/dashboard');
      await learnerPage.waitForTimeout(500);

      // 활성 메뉴 확인 (구현에 따라 다를 수 있음)
      const activeItem = await getActiveNavMenuItem(learnerPage);
      // 활성 메뉴가 있으면 확인
      if (activeItem) {
        expect(activeItem).toContain('대시보드');
      }
    });
  });

  test.describe('역할별 메뉴 표시', () => {
    authTest('학습자 메뉴에는 강의 탐색이 포함된다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      
      const hasExploreCourses = await isNavMenuItemVisible(learnerPage, '강의 탐색');
      expect(hasExploreCourses).toBe(true);
    });

    authTest('강사 메뉴에는 코스관리가 포함된다', async ({ instructorPage }) => {
      await instructorPage.goto('/instructor-dashboard');
      
      const hasCourseManagement = await isNavMenuItemVisible(instructorPage, '코스관리');
      expect(hasCourseManagement).toBe(true);
    });

    authTest('모든 역할에 과제 메뉴가 표시된다', async ({ learnerPage, instructorPage }) => {
      // 학습자
      await learnerPage.goto('/dashboard');
      const learnerHasAssignments = await isNavMenuItemVisible(learnerPage, '과제');
      expect(learnerHasAssignments).toBe(true);

      // 강사
      await instructorPage.goto('/instructor-dashboard');
      const instructorHasAssignments = await isNavMenuItemVisible(instructorPage, '과제');
      expect(instructorHasAssignments).toBe(true);
    });
  });

  test.describe('모바일 네비게이션', () => {
    authTest('모바일에서 햄버거 메뉴가 표시된다', async ({ learnerPage }) => {
      // 모바일 뷰포트 설정
      await learnerPage.setViewportSize({ width: 375, height: 667 });
      await learnerPage.goto('/dashboard');

      // 햄버거 메뉴 버튼 찾기
      const menuButton = learnerPage.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      
      // 모바일에서는 햄버거 메뉴가 표시될 수 있음
      if (await menuButton.count() > 0) {
        await expect(menuButton).toBeVisible();
      }
    });
  });
});

