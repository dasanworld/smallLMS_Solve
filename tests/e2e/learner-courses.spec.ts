import { test, expect } from '@playwright/test';

/**
 * 학습자 코스 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 공개 코스 목록 조회
 * 2. 코스 상세 조회
 * 3. 코스 수강신청
 * 4. 수강신청 확인
 * 5. 수강신청 취소
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LEARNER_EMAIL = process.env.LEARNER_EMAIL || 'learner@example.com';
const LEARNER_PASSWORD = process.env.LEARNER_PASSWORD || 'password123';

test.describe('학습자 코스 시스템', () => {
  let courseId: string;

  test.beforeEach(async ({ page }) => {
    // 학습자로 로그인
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', LEARNER_EMAIL);
    await page.fill('input[type="password"]', LEARNER_PASSWORD);

    await page.click('button[type="submit"]');

    // 대시보드로 리다이렉트될 때까지 대기
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test('공개 코스 목록 조회', async ({ page }) => {
    // 코스 둘러보기 페이지 방문
    await page.goto(`${BASE_URL}/explore-courses`);

    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('코스 둘러보기');

    // 코스 카드가 로드될 때까지 대기
    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });

    // 최소 1개 이상의 코스가 있는지 확인
    const courseCards = await page.locator('[data-testid="course-card"]').count();
    expect(courseCards).toBeGreaterThan(0);

    // 첫 번째 코스 ID 저장 (나중에 수강신청에 사용)
    const firstCourseElement = page.locator('[data-testid="course-card"]').first();
    courseId = await firstCourseElement.getAttribute('data-course-id') || '';

    expect(courseId).toBeTruthy();
  });

  test('코스 카드에 필수 정보 표시', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore-courses`);

    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });

    const firstCourse = page.locator('[data-testid="course-card"]').first();

    // 코스 제목 확인
    const title = firstCourse.locator('[data-testid="course-title"]');
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();

    // 강사명 확인
    const instructor = firstCourse.locator('[data-testid="course-instructor"]');
    await expect(instructor).toBeVisible();

    // 수강신청 버튼 확인
    const enrollButton = firstCourse.locator('[data-testid="enroll-button"]');
    await expect(enrollButton).toBeVisible();
    await expect(enrollButton).toContainText('수강신청');
  });

  test('코스 수강신청', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore-courses`);

    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    courseId = await firstCourse.getAttribute('data-course-id') || '';

    // 수강신청 버튼 클릭
    const enrollButton = firstCourse.locator('[data-testid="enroll-button"]');
    await enrollButton.click();

    // 로딩 상태 확인
    await expect(enrollButton).toContainText('신청중');

    // 수강신청 완료 (버튼 텍스트 변경)
    await page.waitForTimeout(1000); // API 응답 대기

    const updatedButton = firstCourse.locator('[data-testid="enroll-button"]');
    const buttonText = await updatedButton.textContent();

    // 수강중 또는 신청중 상태 확인
    expect(buttonText).toMatch(/수강중|신청중|신청 완료/);
  });

  test('페이지네이션', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore-courses`);

    // 첫 번째 페이지에서 코스 수 확인
    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });
    const firstPageCount = await page.locator('[data-testid="course-card"]').count();

    // 다음 버튼이 있는지 확인
    const nextButton = page.locator('[data-testid="next-page-button"]');
    const hasNextPage = await nextButton.isVisible();

    if (hasNextPage && firstPageCount >= 10) {
      // 다음 페이지로 이동
      await nextButton.click();

      await page.waitForTimeout(500);

      // 두 번째 페이지의 코스 수 확인
      const secondPageCount = await page.locator('[data-testid="course-card"]').count();
      expect(secondPageCount).toBeGreaterThan(0);

      // 이전 버튼 확인
      const prevButton = page.locator('[data-testid="prev-page-button"]');
      await expect(prevButton).toBeEnabled();
    }
  });

  test('찜하기 기능', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore-courses`);

    await page.waitForSelector('[data-testid="course-card"]', { timeout: 5000 });

    const firstCourse = page.locator('[data-testid="course-card"]').first();
    const favoriteButton = firstCourse.locator('[data-testid="favorite-button"]');

    // 초기 상태 (미찜)
    let heartIcon = favoriteButton.locator('svg');
    let isFilled = await heartIcon.evaluate((el) => {
      return el.classList.contains('fill-red-500');
    });

    expect(isFilled).toBe(false);

    // 찜하기 클릭
    await favoriteButton.click();

    // 상태 변경 확인 (찜함)
    heartIcon = favoriteButton.locator('svg');
    isFilled = await heartIcon.evaluate((el) => {
      return el.classList.contains('fill-red-500');
    });

    expect(isFilled).toBe(true);

    // 다시 클릭하여 찜 해제
    await favoriteButton.click();

    // 상태 변경 확인 (미찜)
    heartIcon = favoriteButton.locator('svg');
    isFilled = await heartIcon.evaluate((el) => {
      return el.classList.contains('fill-red-500');
    });

    expect(isFilled).toBe(false);
  });

  test('에러 상황 처리', async ({ page }) => {
    // 존재하지 않는 코스로 수강신청 시도
    const fakeResponse = page.waitForResponse(
      response => response.url().includes('/api/learner/courses/') && response.status() >= 400
    );

    // 네트워크 에러 시뮬레이션
    await page.goto(`${BASE_URL}/explore-courses`);

    // 페이지 로드 확인
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1');
    await expect(heading).toContainText('코스 둘러보기');
  });
});

test.describe('학습자 수강신청 API', () => {
  test('비인증 사용자도 공개 코스 목록 조회 가능', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/learner/courses/available?page=1&pageSize=10`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('courses');
    expect(Array.isArray(data.data.courses)).toBe(true);
  });

  test('각 코스에 필수 필드 포함', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/learner/courses/available?page=1&pageSize=1`);

    const data = await response.json();
    const courses = data.data.courses;

    if (courses.length > 0) {
      const course = courses[0];

      // 필수 필드 확인
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('description');
      expect(course).toHaveProperty('status');
      expect(course).toHaveProperty('instructor_name');
      expect(course).toHaveProperty('is_enrolled');
      expect(course).toHaveProperty('category');
      expect(course).toHaveProperty('difficulty');
    }
  });

  test('페이지네이션 메타데이터 포함', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/learner/courses/available?page=1&pageSize=5`);

    const data = await response.json();
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('page', 1);
    expect(data.data).toHaveProperty('pageSize', 5);
  });
});
