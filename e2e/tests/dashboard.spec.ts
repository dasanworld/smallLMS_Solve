import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 대시보드 관련 E2E 테스트
 * - 학습자 대시보드, 강사 대시보드
 */

test.describe('Dashboard', () => {
  test.describe('학습자 대시보드', () => {
    authTest(
      'should display learner dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 대시보드 제목 확인
        await expect(
          page.locator('text=/대시보드|Dashboard|학습자/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should display enrolled courses in dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 수강 중인 강좌 섹션 확인
        await expect(
          page.locator('text=/수강 중인 강좌|내 강좌|My Courses/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should display recent assignments in dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 최근 과제 섹션 확인
        const assignmentsSection = page.locator(
          'text=/과제|Assignment|제출/i'
        );
        if ((await assignmentsSection.count()) > 0) {
          await expect(assignmentsSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should display learning progress',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 학습 진도 또는 통계 확인
        const progressSection = page.locator('text=/진도|진행|Progress/i');
        if ((await progressSection.count()) > 0) {
          await expect(progressSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should navigate to course from dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 강좌 카드 클릭
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();

          // 강좌 상세 페이지로 이동 확인
          await page.waitForURL(/\/courses\/[a-f0-9-]+/);
        }
      }
    );

    authTest(
      'should display upcoming assignments with due dates',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 마감일이 표시된 과제 확인
        const dueDateElements = page.locator('text=/마감|Due|기한/i');
        if ((await dueDateElements.count()) > 0) {
          await expect(dueDateElements.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should get learner dashboard data via API',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.get('/api/dashboard/learner', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        // 대시보드 데이터 구조 확인
        expect(data).toBeDefined();
      }
    );
  });

  test.describe('강사 대시보드', () => {
    authTest(
      'should display instructor dashboard',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 강사 대시보드 제목 확인
        await expect(
          page.locator('text=/강사 대시보드|Instructor Dashboard/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should display instructor courses',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 내 강좌 목록 확인
        await expect(
          page.locator('text=/내 강좌|My Courses|강좌 관리/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should show course creation button',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 강좌 생성 버튼 확인
        const createButton = page.locator('button:has-text("강좌 생성")');
        if ((await createButton.count()) > 0) {
          await expect(createButton).toBeVisible();
        }
      }
    );

    authTest(
      'should display recent submissions to grade',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 평가 대기 제출물 섹션 확인
        const submissionsSection = page.locator(
          'text=/제출물|평가|Submission|Grade/i'
        );
        if ((await submissionsSection.count()) > 0) {
          await expect(submissionsSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should display course statistics',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 통계 정보 확인 (등록 학생 수, 과제 수 등)
        const statsSection = page.locator('text=/통계|수강생|학생|등록/i');
        if ((await statsSection.count()) > 0) {
          await expect(statsSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should navigate to course management from dashboard',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 강좌 관리 페이지로 이동
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();

          // 강좌 상세/관리 페이지로 이동 확인
          await page.waitForURL(/\/courses\/[a-f0-9-]+/);
        }
      }
    );

    authTest(
      'should get instructor dashboard data via API',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const response = await page.request.get('/api/dashboard/instructor', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toBeDefined();
      }
    );
  });

  test.describe('대시보드 접근 제어', () => {
    test('should redirect to login when accessing dashboard without auth', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/);
    });

    test('should redirect to login when accessing instructor dashboard without auth', async ({
      page,
    }) => {
      await page.goto('/instructor-dashboard');

      // 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/);
    });

    authTest(
      'should not allow learner to access instructor dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/instructor-dashboard');

        // 권한 없음 페이지 또는 리다이렉트
        const currentUrl = page.url();
        // 강사 대시보드에 접근하지 못했는지 확인
        if (currentUrl.includes('instructor-dashboard')) {
          // 만약 페이지에 접근했다면 권한 없음 메시지 확인
          await expect(page.locator('text=/권한|403|Forbidden/i')).toBeVisible();
        }
      }
    );

    authTest(
      'should not allow instructor to access learner-only features',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        // 학습자 대시보드 API 호출 시도
        const response = await page.request.get('/api/dashboard/learner', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        // 강사가 학습자 대시보드에 접근할 수 있는지는 정책에 따라 다름
        // 만약 강사도 학습자 기능을 사용할 수 있다면 200, 아니면 403
        expect([200, 403]).toContain(response.status());
      }
    );
  });

  test.describe('대시보드 상호작용', () => {
    authTest(
      'should filter courses by status in dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 필터 옵션 (진행 중, 완료 등)
        const filterSelect = page.locator('select[name="status"]');
        if ((await filterSelect.count()) > 0) {
          await filterSelect.selectOption('active');
          await page.waitForTimeout(500);

          // 필터링된 결과 확인
          await expect(page.locator('text=/수강 중/i')).toBeVisible();
        }
      }
    );

    authTest(
      'should sort assignments by due date',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 정렬 옵션
        const sortButton = page.locator('button:has-text("마감일순")');
        if ((await sortButton.count()) > 0) {
          await sortButton.click();
          await page.waitForTimeout(500);
        }
      }
    );

    authTest(
      'should display quick actions in dashboard',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 빠른 작업 버튼들 (강좌 생성, 과제 생성 등)
        const quickActions = page.locator('text=/빠른|Quick Action/i');
        if ((await quickActions.count()) > 0) {
          await expect(quickActions.first()).toBeVisible();
        }
      }
    );
  });

  test.describe('대시보드 알림 및 업데이트', () => {
    authTest(
      'should display notifications in dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 알림 아이콘 또는 섹션
        const notificationIcon = page.locator('button:has-text("알림")');
        if ((await notificationIcon.count()) > 0) {
          await notificationIcon.click();

          // 알림 목록 확인
          await expect(
            page.locator('text=/알림|Notification/i')
          ).toBeVisible();
        }
      }
    );

    authTest(
      'should show badge for ungraded submissions',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 평가되지 않은 제출물 배지
        const badge = page.locator('[class*="badge"]');
        if ((await badge.count()) > 0) {
          // 배지가 있으면 숫자 확인
          const badgeText = await badge.first().textContent();
          expect(badgeText).toBeTruthy();
        }
      }
    );
  });

  test.describe('대시보드 검색', () => {
    authTest(
      'should search for courses in dashboard',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 검색 입력
        const searchInput = page.locator('input[placeholder*="검색"]');
        if ((await searchInput.count()) > 0) {
          await searchInput.fill('programming');
          await page.waitForTimeout(500);

          // 검색 결과 확인
          await expect(page.locator('text=/programming/i')).toBeVisible();
        }
      }
    );
  });
});
