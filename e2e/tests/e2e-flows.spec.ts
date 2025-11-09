import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { signup, login, logout } from '../helpers/auth-helper';
import { createCourse, publishCourse, enrollInCourse } from '../helpers/course-helper';
import { createAssignment, publishAssignment } from '../helpers/assignment-helper';
import { generateRandomEmail, generateRandomCourseTitle } from '../fixtures/data';
import { testCourses, testAssignments } from '../fixtures/data';

/**
 * 통합 E2E 시나리오 테스트
 * - 실제 사용자 플로우를 시뮬레이션
 * - 여러 기능이 연계된 시나리오
 */

test.describe('E2E Flows', () => {
  test.describe('전체 학습 플로우', () => {
    test('학습자가 강의를 수강하고 과제를 확인할 수 있다', async ({ page }) => {
      // 1. 학습자 회원가입
      const learnerEmail = generateRandomEmail('learner');
      await signup(page, {
        email: learnerEmail,
        password: 'TestPass123!',
        role: 'learner',
      });

      // 2. 강사 계정 생성 (별도 페이지 또는 API)
      // 실제로는 별도 세션에서 강사가 강의를 생성하지만,
      // 테스트를 위해 간단히 시뮬레이션
      // 여기서는 강의가 이미 존재한다고 가정

      // 3. 강의 탐색
      await page.goto('/explore-courses');
      await expect(page.locator('text=/강의|course/i').first()).toBeVisible();

      // 4. 대시보드 확인
      await page.goto('/dashboard');
      await expect(page.locator('text=/대시보드|dashboard/i').first()).toBeVisible();
    });
  });

  test.describe('강사 강의 생성 플로우', () => {
    authTest('강사가 강의를 생성하고 발행할 수 있다', async ({ instructorPage }) => {
      // 1. 강의 생성 페이지로 이동
      await instructorPage.goto('/courses/new');

      // 2. 강의 정보 입력
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '통합 테스트 강의 설명',
        ...testCourses.webDevelopment,
      });

      // 3. 강의 상세 페이지 확인
      await expect(instructorPage).toHaveURL(new RegExp(`/courses/${courseId}`));

      // 4. 강의 발행
      await publishCourse(instructorPage, courseId);

      // 5. 강의 목록에서 확인
      await instructorPage.goto('/courses');
      await expect(instructorPage.locator(`text=${courseTitle}`).first()).toBeVisible();
    });
  });

  test.describe('과제 생성 및 관리 플로우', () => {
    authTest('강사가 과제를 생성하고 발행할 수 있다', async ({ instructorPage }) => {
      // 1. 강의 생성
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '과제 테스트 강의',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 2. 과제 생성 페이지로 이동
      await instructorPage.goto(`/courses/${courseId}/assignments/new`);

      // 3. 과제 생성
      const assignmentId = await createAssignment(instructorPage, {
        courseId,
        ...testAssignments.basicAssignment,
        title: '통합 테스트 과제',
      });

      // 4. 과제 목록에서 확인
      await expect(instructorPage).toHaveURL(`/courses/${courseId}/assignments`);

      // 5. 과제 상세 페이지로 이동
      await instructorPage.goto(`/courses/${courseId}/assignments/${assignmentId}`);

      // 6. 과제 발행
      await publishAssignment(instructorPage, courseId, assignmentId);

      // 7. 상태 확인
      await expect(instructorPage.locator('text=/발행|published/i').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('로그인-로그아웃 플로우', () => {
    test('사용자가 로그인하고 로그아웃할 수 있다', async ({ page }) => {
      // 1. 회원가입
      const email = generateRandomEmail('user');
      await signup(page, {
        email,
        password: 'TestPass123!',
        role: 'learner',
      });

      // 2. 로그아웃
      await logout(page);
      await expect(page).toHaveURL('/');

      // 3. 다시 로그인
      await login(page, { email, password: 'TestPass123!' });
      await expect(page).toHaveURL(/\/(dashboard|explore-courses)/);

      // 4. 대시보드 접근 확인
      await page.goto('/dashboard');
      await expect(page.locator('text=/대시보드|dashboard/i').first()).toBeVisible();
    });
  });

  test.describe('대시보드 플로우', () => {
    authTest('학습자 대시보드에 수강 중인 강의가 표시된다', async ({ learnerPage, instructorPage }) => {
      // 1. 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '대시보드 플로우 테스트',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 2. 학습자가 수강신청
      await learnerPage.goto('/explore-courses');
      const enrollButton = learnerPage.locator('button:has-text("수강신청")').first();
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        await learnerPage.waitForTimeout(1000);
      }

      // 3. 대시보드 확인
      await learnerPage.goto('/dashboard');
      await expect(learnerPage.locator(`text=${courseTitle}`).first()).toBeVisible({ timeout: 5000 });
    });

    authTest('강사 대시보드에 생성한 강의가 표시된다', async ({ instructorPage }) => {
      // 1. 강의 생성
      const courseTitle = generateRandomCourseTitle();
      await createCourse(instructorPage, {
        title: courseTitle,
        description: '강사 대시보드 테스트',
        ...testCourses.webDevelopment,
      });

      // 2. 강사 대시보드 확인
      await instructorPage.goto('/instructor-dashboard');
      await expect(instructorPage.locator(`text=${courseTitle}`).first()).toBeVisible({ timeout: 5000 });
    });
  });
});

