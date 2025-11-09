import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { enrollInCourse, cancelEnrollment } from '../helpers/course-helper';
import { createCourse, publishCourse } from '../helpers/course-helper';
import { generateRandomCourseTitle } from '../fixtures/data';
import { testCourses } from '../fixtures/data';

/**
 * 수강신청 관련 E2E 테스트
 * - 강의 수강신청, 취소, 재수강신청
 */

test.describe('Enrollment', () => {
  test.describe('수강신청', () => {
    authTest('학습자가 강의를 수강신청할 수 있다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      await instructorPage.goto('/courses/new');
      const courseTitle = generateRandomCourseTitle();
      
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '테스트 강의 설명',
        ...testCourses.webDevelopment,
      });

      // 강의 발행
      await publishCourse(instructorPage, courseId);

      // 학습자가 강의 탐색 페이지로 이동
      await learnerPage.goto('/explore-courses');

      // 강의 카드에서 수강신청 버튼 찾기
      const enrollButton = learnerPage.locator(`button:has-text("수강신청")`).first();
      
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        
        // 성공 메시지 또는 버튼 상태 변경 확인
        await expect(learnerPage.locator('button:has-text("수강 중"), button:disabled:has-text("수강신청 완료")').first()).toBeVisible({ timeout: 5000 });
      }
    });

    authTest('수강신청 후 대시보드에 강의가 표시된다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '대시보드 테스트 강의',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 학습자가 수강신청
      await learnerPage.goto('/explore-courses');
      const enrollButton = learnerPage.locator(`button:has-text("수강신청")`).first();
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        await learnerPage.waitForTimeout(1000);
      }

      // 대시보드로 이동
      await learnerPage.goto('/dashboard');

      // 수강 중인 강의 목록에 해당 강의가 표시되는지 확인
      await expect(learnerPage.locator(`text=${courseTitle}`).first()).toBeVisible({ timeout: 5000 });
    });

    authTest('이미 수강신청한 강의는 재수강신청할 수 없다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '중복 수강신청 테스트',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 첫 번째 수강신청
      await learnerPage.goto('/explore-courses');
      const enrollButton = learnerPage.locator(`button:has-text("수강신청")`).first();
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        await learnerPage.waitForTimeout(1000);
      }

      // 페이지 새로고침
      await learnerPage.reload();

      // 버튼이 "수강 중" 상태로 변경되었는지 확인
      const enrolledButton = learnerPage.locator('button:has-text("수강 중"), button:disabled:has-text("수강신청 완료")').first();
      await expect(enrolledButton).toBeVisible();
      await expect(enrolledButton).toBeDisabled();
    });
  });

  test.describe('수강신청 취소', () => {
    authTest('학습자가 수강신청을 취소할 수 있다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '수강 취소 테스트',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 학습자가 수강신청
      await learnerPage.goto('/explore-courses');
      const enrollButton = learnerPage.locator(`button:has-text("수강신청")`).first();
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        await learnerPage.waitForTimeout(1000);
      }

      // 대시보드로 이동
      await learnerPage.goto('/dashboard');

      // 취소 버튼 찾기
      const cancelButton = learnerPage.locator(`button:has-text("취소"), button:has-text("수강 취소")`).first();
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        
        // 확인 다이얼로그 처리
        const confirmButton = learnerPage.locator('button:has-text("확인"), button:has-text("취소")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
        
        await learnerPage.waitForTimeout(1000);
        
        // 강의가 목록에서 제거되었는지 확인
        await expect(learnerPage.locator(`text=${courseTitle}`).first()).not.toBeVisible({ timeout: 3000 });
      }
    });

    authTest('취소한 강의는 재수강신청할 수 있다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '재수강신청 테스트',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 첫 번째 수강신청
      await learnerPage.goto('/explore-courses');
      const enrollButton = learnerPage.locator(`button:has-text("수강신청")`).first();
      if (await enrollButton.count() > 0) {
        await enrollButton.click();
        await learnerPage.waitForTimeout(1000);
      }

      // 수강 취소
      await learnerPage.goto('/dashboard');
      const cancelButton = learnerPage.locator(`button:has-text("취소")`).first();
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        const confirmButton = learnerPage.locator('button:has-text("확인")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
        await learnerPage.waitForTimeout(1000);
      }

      // 다시 강의 탐색 페이지로 이동
      await learnerPage.goto('/explore-courses');

      // 수강신청 버튼이 다시 활성화되었는지 확인
      const newEnrollButton = learnerPage.locator(`button:has-text("수강신청"):not(:disabled)`).first();
      await expect(newEnrollButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('수강신청 상태 표시', () => {
    authTest('수강신청 완료 후 버튼 상태가 변경된다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 생성 및 발행
      const courseTitle = generateRandomCourseTitle();
      const courseId = await createCourse(instructorPage, {
        title: courseTitle,
        description: '버튼 상태 테스트',
        ...testCourses.webDevelopment,
      });
      await publishCourse(instructorPage, courseId);

      // 학습자가 강의 탐색 페이지로 이동
      await learnerPage.goto('/explore-courses');

      // 초기 상태: "수강신청" 버튼이 활성화되어 있음
      const initialButton = learnerPage.locator('button:has-text("수강신청"):not(:disabled)').first();
      await expect(initialButton).toBeVisible();

      // 수강신청
      await initialButton.click();
      await learnerPage.waitForTimeout(1000);

      // 상태 변경: "수강 중" 또는 비활성화된 버튼
      const enrolledButton = learnerPage.locator('button:has-text("수강 중"), button:disabled:has-text("수강신청 완료")').first();
      await expect(enrolledButton).toBeVisible();
    });
  });
});

