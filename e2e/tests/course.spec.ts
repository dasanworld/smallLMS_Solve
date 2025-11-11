import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { Selectors } from '../shared/selectors';
import { APIDebugger } from '../shared/api-debugger';

/**
 * 강좌 관련 E2E 테스트
 * - 강좌 검색, 조회, 등록, 생성, 상태 관리
 */

test.describe('Course Management', () => {
  test.describe('강좌 목록 및 검색 (공개)', () => {
    test('should display course list on courses page', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle').catch(() => {});

      // 강좌 목록 표시 확인
      await expect(Selectors.course.heading(page)).toBeVisible();
    });

    test('should filter courses by category', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('domcontentloaded');

      // 카테고리 필터 선택
      const categorySelect = page.locator('select[name="category"]');
      if ((await categorySelect.count()) > 0) {
        await categorySelect.selectOption({ index: 1 }); // 첫 번째 카테고리 선택

        // 페이지 리로드 또는 필터 적용 확인
        await page.waitForTimeout(500);
      }
    });

    test('should filter courses by difficulty', async ({ page }) => {
      await page.goto('/courses');

      // 난이도 필터 선택
      const difficultySelect = page.locator('select[name="difficulty"]');
      if ((await difficultySelect.count()) > 0) {
        await difficultySelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    });

    test('should search courses by keyword', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('domcontentloaded');

      // 검색어 입력
      const searchInput = page.locator('input[name="search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('programming');
        await page.click('button:has-text("검색")');
        await page.waitForTimeout(500);
      }
    });

    test('should navigate to course detail page', async ({ page }) => {
      await page.goto('/courses');

      // 강좌 카드 클릭 (첫 번째 강좌)
      const firstCourse = page.locator('a[href*="/courses/"]').first();
      if ((await firstCourse.count()) > 0) {
        await firstCourse.click();

        // 강좌 상세 페이지로 이동 확인
        await page.waitForURL(/\/courses\/[a-f0-9-]+/);
      }
    });
  });

  test.describe('강좌 등록 (학습자)', () => {
    authTest(
      'should enroll in a course as learner',
      async ({ learnerPage }) => {
        const page = learnerPage;

        await page.goto('/courses');

        // 첫 번째 강좌 선택
        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          await firstCourse.click();
          await page.waitForURL(/\/courses\/[a-f0-9-]+/);

          // 등록 버튼 클릭
          const enrollButton = page.locator('button:has-text("수강 신청")');
          if ((await enrollButton.count()) > 0) {
            await enrollButton.click();

            // 등록 성공 메시지 또는 버튼 상태 변경 확인
            await expect(
              page.locator('text=/수강 중|등록 완료/i')
            ).toBeVisible();
          }
        }
      }
    );

    authTest(
      'should view enrolled courses in dashboard',
      async ({ learnerPage }) => {
        const page = learnerPage;

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle').catch(() => {});

        // 등록된 강좌 목록 확인
        await expect(Selectors.dashboard.learnerHeading(page)).toBeVisible();
      }
    );
  });

  test.describe('강좌 생성 (강사)', () => {
    authTest(
      'should create a new course as instructor',
      async ({ instructorPage }) => {
        const page = instructorPage;
        const timestamp = Date.now();
        const courseName = `Test Course ${timestamp}`;

        await page.goto('/instructor-dashboard', { waitUntil: 'domcontentloaded' });

        const managementButton = Selectors.course.managementButton(page);
        if ((await managementButton.count()) > 0) {
          await managementButton.click();
          await page.waitForURL(/\/courses/, { timeout: 10000 }).catch(() => {});
        } else {
          await page.goto('/courses', { waitUntil: 'domcontentloaded' });
        }

        await page.waitForLoadState('networkidle').catch(() => {});

        const createTab = Selectors.course.createTab(page);
        if ((await createTab.count()) > 0) {
          await createTab.click();
        }

        await page.fill('[name="title"]', courseName);
        const description = page.locator('textarea[name="description"]').first();
        if ((await description.count()) > 0) {
          await description.fill('This is a test course description');
        }

        const submitButton = page.getByRole('button', { name: /생성|저장|Create/i }).first();
        await submitButton.click();
        await page.waitForTimeout(1000);

        await expect(page.locator(`text=${courseName}`)).toBeVisible({ timeout: 5000 });
      }
    );

    authTest(
      'should view created courses as instructor',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard', { waitUntil: 'domcontentloaded' });
        await expect(Selectors.dashboard.instructorHeading(page)).toBeVisible();
      }
    );
  });

  test.describe('강좌 수정 (강사)', () => {
    authTest(
      'should edit own course as instructor',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // 첫 번째 강좌 선택
        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          await firstCourse.click();

          // 수정 버튼 클릭
          const editButton = page.locator('button:has-text("수정")');
          if ((await editButton.count()) > 0) {
            await editButton.click();

            // 제목 수정
            const titleInput = page.locator('[name="title"]');
            await titleInput.clear();
            await titleInput.fill('Updated Course Title');

            // 저장 버튼 클릭
            await page.click('button:has-text("저장")');

            // 수정 성공 확인
            await expect(
              page.locator('text=Updated Course Title')
            ).toBeVisible();
          }
        }
      }
    );
  });

  test.describe('강좌 상태 관리 (강사)', () => {
    authTest(
      'should publish a draft course',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 먼저 draft 강좌 생성
        const timestamp = Date.now();
        const courseName = `Draft Course ${timestamp}`;

        await page.goto('/instructor-dashboard', { waitUntil: 'domcontentloaded' });
        const managementButton = Selectors.course.managementButton(page);
        if ((await managementButton.count()) > 0) {
          await managementButton.click();
          await page.waitForURL(/\/courses/, { timeout: 10000 }).catch(() => {});
        } else {
          await page.goto('/courses', { waitUntil: 'domcontentloaded' });
        }

        await page.waitForLoadState('networkidle').catch(() => {});
        const createTab = Selectors.course.createTab(page);
        if ((await createTab.count()) > 0) {
          await createTab.click();
        }

        await page.fill('[name="title"]', courseName);
        await page.fill('textarea[name="description"]', 'Draft course description');
        await page.getByRole('button', { name: /생성|저장|Create/i }).first().click();

        // 새로 생성된 코스에서 발행 진행
        const publishButton = page.locator('button:has-text("발행"), button:has-text("Publish")').first();
        if ((await publishButton.count()) > 0) {
          await publishButton.click();
          await expect(page.locator('text=/발행됨|Published/i')).toBeVisible();
        }
      }
    );

    authTest(
      'should archive a published course',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/courses', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const statusButton = page.locator('button:has-text("상태 변경"), button:has-text("Publish")').first();
        if ((await statusButton.count()) > 0) {
          await statusButton.click();

          const archiveButton = page.locator('button:has-text("아카이브"), button:has-text("Archive")').first();
          if ((await archiveButton.count()) > 0) {
            await archiveButton.click();
            const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")').first();
            if ((await confirmButton.count()) > 0) {
              await confirmButton.click();
            }

            await expect(page.locator('text=/아카이브됨|Archived/i')).toBeVisible();
          }
        }
      }
    );
  });

  test.describe('API - 강좌 관리', () => {
    test('should get public courses list via API', async ({ page }) => {
      const result = await APIDebugger.callAndLog(page, 'GET', '/api/courses?page=1&limit=10');
      expect(result.ok).toBeTruthy();
      expect(result.data).not.toBeNull();
    });

    authTest(
      'should create course via API as instructor',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;
        const timestamp = Date.now();

        const result = await APIDebugger.callAndLog(page, 'POST', '/api/courses', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: `API Test Course ${timestamp}`,
            description: 'Created via API',
            category_id: 1,
            difficulty_id: 1,
          },
        });

        expect(result.ok).toBeTruthy();
        expect(result.data).not.toBeNull();
      }
    );

    authTest(
      'should enroll in course via API as learner',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // 먼저 강좌 목록 조회
        const coursesResult = await APIDebugger.callAndLog<{
          courses: { id: string }[];
        }>(page, 'GET', '/api/courses?page=1&limit=1');

        if (coursesResult.data?.courses?.length) {
          const courseId = coursesResult.data.courses[0].id;

          // 강좌 등록
          const enrollResult = await APIDebugger.callAndLog(page, 'POST', '/api/enrollments', {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              course_id: courseId,
            },
          });

          expect([200, 201, 409]).toContain(enrollResult.status); // 409는 이미 등록된 경우
        }
      }
    );

    authTest(
      'should get instructor courses via API',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const result = await APIDebugger.callAndLog(page, 'GET', '/api/courses/my', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(result.ok).toBeTruthy();
        const courses = (result.data as { courses?: unknown[] } | null)?.courses;
        expect(Array.isArray(courses)).toBe(true);
      }
    );
  });

  test.describe('권한 검증', () => {
    authTest(
      'should not allow learner to create courses',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const result = await APIDebugger.callAndLog(page, 'POST', '/api/courses', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: 'Unauthorized Course',
            description: 'Should fail',
            category_id: 1,
            difficulty_id: 1,
          },
        });

        expect(result.status).toBe(403); // Forbidden
      }
    );
  });
});
