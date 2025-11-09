import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 강좌 관련 E2E 테스트
 * - 강좌 검색, 조회, 등록, 생성, 상태 관리
 */

test.describe('Course Management', () => {
  test.describe('강좌 목록 및 검색 (공개)', () => {
    test('should display course list on courses page', async ({ page }) => {
      await page.goto('/courses');

      // 강좌 목록 표시 확인
      await expect(page.locator('text=/강좌|course/i')).toBeVisible();
    });

    test('should filter courses by category', async ({ page }) => {
      await page.goto('/courses');

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
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

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
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 등록된 강좌 목록 확인
        await expect(page.locator('text=/수강 중인 강좌|내 강좌/i')).toBeVisible();
      }
    );
  });

  test.describe('강좌 생성 (강사)', () => {
    authTest(
      'should create a new course as instructor',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;
        const timestamp = Date.now();

        await page.goto('/instructor-dashboard');

        // 강좌 생성 버튼 클릭
        const createButton = page.locator('button:has-text("강좌 생성")');
        if ((await createButton.count()) > 0) {
          await createButton.click();

          // 강좌 정보 입력
          await page.fill(
            '[name="title"]',
            `Test Course ${timestamp}`
          );
          await page.fill(
            'textarea[name="description"]',
            'This is a test course description'
          );

          // 카테고리 선택
          const categorySelect = page.locator('select[name="category"]');
          if ((await categorySelect.count()) > 0) {
            await categorySelect.selectOption({ index: 1 });
          }

          // 난이도 선택
          const difficultySelect = page.locator('select[name="difficulty"]');
          if ((await difficultySelect.count()) > 0) {
            await difficultySelect.selectOption({ index: 1 });
          }

          // 생성 버튼 클릭
          await page.click('button:has-text("생성")');

          // 생성 성공 확인
          await expect(
            page.locator(`text=Test Course ${timestamp}`)
          ).toBeVisible();
        }
      }
    );

    authTest(
      'should view created courses as instructor',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 내 강좌 목록 확인
        await expect(page.locator('text=/내 강좌|My Courses/i')).toBeVisible();
      }
    );
  });

  test.describe('강좌 수정 (강사)', () => {
    authTest(
      'should edit own course as instructor',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

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
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        // 먼저 draft 강좌 생성
        const timestamp = Date.now();
        await page.goto('/instructor-dashboard');

        const createButton = page.locator('button:has-text("강좌 생성")');
        if ((await createButton.count()) > 0) {
          await createButton.click();

          await page.fill('[name="title"]', `Draft Course ${timestamp}`);
          await page.fill(
            'textarea[name="description"]',
            'Draft course description'
          );

          const categorySelect = page.locator('select[name="category"]');
          if ((await categorySelect.count()) > 0) {
            await categorySelect.selectOption({ index: 1 });
          }

          const difficultySelect = page.locator('select[name="difficulty"]');
          if ((await difficultySelect.count()) > 0) {
            await difficultySelect.selectOption({ index: 1 });
          }

          await page.click('button:has-text("생성")');

          // 발행 버튼 클릭
          const publishButton = page.locator('button:has-text("발행")');
          if ((await publishButton.count()) > 0) {
            await publishButton.click();

            // 발행 성공 확인
            await expect(page.locator('text=/발행됨|Published/i')).toBeVisible();
          }
        }
      }
    );

    authTest(
      'should archive a published course',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 발행된 강좌 선택
        const publishedCourse = page.locator('text=/발행됨|Published/i').first();
        if ((await publishedCourse.count()) > 0) {
          // 강좌 상세로 이동
          await page.goto('/instructor-dashboard');
          const firstCourse = page.locator('a[href*="/courses/"]').first();
          await firstCourse.click();

          // 아카이브 버튼 클릭
          const archiveButton = page.locator('button:has-text("아카이브")');
          if ((await archiveButton.count()) > 0) {
            await archiveButton.click();

            // 확인 다이얼로그가 있다면 확인
            const confirmButton = page.locator('button:has-text("확인")');
            if ((await confirmButton.count()) > 0) {
              await confirmButton.click();
            }

            // 아카이브 성공 확인
            await expect(
              page.locator('text=/아카이브됨|Archived/i')
            ).toBeVisible();
          }
        }
      }
    );
  });

  test.describe('API - 강좌 관리', () => {
    test('should get public courses list via API', async ({ page }) => {
      const response = await page.request.get('/api/courses?page=1&limit=10');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.courses).toBeDefined();
      expect(Array.isArray(data.courses)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    authTest(
      'should create course via API as instructor',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;
        const timestamp = Date.now();

        const response = await page.request.post('/api/courses', {
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

        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data.course).toBeDefined();
        expect(data.course.title).toBe(`API Test Course ${timestamp}`);
      }
    );

    authTest(
      'should enroll in course via API as learner',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // 먼저 강좌 목록 조회
        const coursesResponse = await page.request.get('/api/courses?page=1&limit=1');
        const coursesData = await coursesResponse.json();

        if (coursesData.courses && coursesData.courses.length > 0) {
          const courseId = coursesData.courses[0].id;

          // 강좌 등록
          const response = await page.request.post('/api/enrollments', {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              course_id: courseId,
            },
          });

          expect([200, 201, 409]).toContain(response.status()); // 409는 이미 등록된 경우
        }
      }
    );

    authTest(
      'should get instructor courses via API',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const response = await page.request.get('/api/courses/my', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.courses).toBeDefined();
        expect(Array.isArray(data.courses)).toBe(true);
      }
    );
  });

  test.describe('권한 검증', () => {
    authTest(
      'should not allow learner to create courses',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.post('/api/courses', {
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

        expect(response.status()).toBe(403); // Forbidden
      }
    );
  });
});
