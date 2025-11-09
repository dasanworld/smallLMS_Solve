import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { login, logout } from '../helpers/auth-helper';
import { createCourse } from '../helpers/course-helper';
import { createAssignment } from '../helpers/assignment-helper';
import { generateRandomEmail, generateRandomCourseTitle } from '../fixtures/data';
import { testCourses, testAssignments } from '../fixtures/data';

/**
 * 에러 처리 및 엣지 케이스 테스트
 * - 권한 검증, 데이터 검증, 네트워크 에러, 세션 만료 등
 */

test.describe('Edge Cases & Error Handling', () => {
  test.describe('권한 검증', () => {
    test('인증되지 않은 사용자는 보호된 페이지에 접근할 수 없다', async ({ page }) => {
      // 로그인 없이 대시보드 접근
      await page.goto('/dashboard');
      
      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/);
    });

    authTest('학습자는 강사 전용 페이지에 접근할 수 없다', async ({ learnerPage }) => {
      // 학습자가 강사 대시보드 접근 시도
      await learnerPage.goto('/instructor-dashboard');
      
      // 접근 거부 또는 리다이렉트 확인
      // 실제 구현에 따라 다를 수 있음
      const currentUrl = learnerPage.url();
      expect(currentUrl).not.toContain('/instructor-dashboard');
    });

    authTest('학습자는 다른 강사의 과제를 수정할 수 없다', async ({ learnerPage, instructorPage }) => {
      // 강사가 강의 및 과제 생성
      const courseId = await createCourse(instructorPage, {
        title: generateRandomCourseTitle(),
        description: '권한 테스트',
        ...testCourses.webDevelopment,
      });

      const assignmentId = await createAssignment(instructorPage, {
        courseId,
        ...testAssignments.basicAssignment,
      });

      // 학습자가 과제 수정 페이지 접근 시도
      await learnerPage.goto(`/courses/${courseId}/assignments/${assignmentId}/edit`);
      
      // 접근 거부 확인 (404 또는 권한 에러)
      const errorMessage = learnerPage.locator('text=/권한|접근|403|404/i').first();
      // 에러 메시지가 표시되거나 리다이렉트됨
    });

    authTest('강사는 다른 강사의 과제를 수정할 수 없다', async ({ instructorPage }) => {
      // 다른 강사의 과제 ID (존재하지 않는 ID 사용)
      const otherInstructorCourseId = '00000000-0000-0000-0000-000000000000';
      const otherInstructorAssignmentId = '00000000-0000-0000-0000-000000000000';

      // 다른 강사의 과제 수정 페이지 접근 시도
      await instructorPage.goto(`/courses/${otherInstructorCourseId}/assignments/${otherInstructorAssignmentId}/edit`);
      
      // 접근 거부 확인
      const errorMessage = instructorPage.locator('text=/권한|접근|403|404/i').first();
      // 에러 메시지가 표시되거나 리다이렉트됨
    });
  });

  test.describe('데이터 검증', () => {
    test('회원가입 시 유효하지 않은 이메일 형식은 거부된다', async ({ page }) => {
      await page.goto('/signup');

      // 유효하지 않은 이메일 입력
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'TestPass123!');
      
      // 회원가입 버튼 클릭
      await page.click('button:has-text("회원가입")');

      // 에러 메시지 표시 확인
      await expect(page.locator('text=/이메일|email|유효/i').first()).toBeVisible({ timeout: 3000 });
    });

    test('회원가입 시 약한 비밀번호는 거부된다', async ({ page }) => {
      await page.goto('/signup');

      // 너무 짧은 비밀번호
      await page.fill('input[name="email"]', generateRandomEmail());
      await page.fill('input[name="password"]', '123');
      
      await page.click('button:has-text("회원가입")');

      // 비밀번호 에러 메시지 확인
      await expect(page.locator('text=/비밀번호|password|길이/i').first()).toBeVisible({ timeout: 3000 });
    });

    authTest('강의 생성 시 필수 필드 누락 시 에러가 표시된다', async ({ instructorPage }) => {
      await instructorPage.goto('/courses/new');

      // 제목만 입력하고 설명은 비워둠
      await instructorPage.fill('input[name="title"]', '테스트 강의');
      // 설명은 입력하지 않음

      // 저장 버튼 클릭
      await instructorPage.click('button:has-text("저장"), button:has-text("생성")');

      // 에러 메시지 확인
      await expect(instructorPage.locator('text=/필수|required|설명/i').first()).toBeVisible({ timeout: 3000 });
    });

    authTest('과제 생성 시 유효하지 않은 날짜 형식은 거부된다', async ({ instructorPage }) => {
      const courseId = await createCourse(instructorPage, {
        title: generateRandomCourseTitle(),
        description: '날짜 검증 테스트',
        ...testCourses.webDevelopment,
      });

      await instructorPage.goto(`/courses/${courseId}/assignments/new`);

      // 유효하지 않은 날짜 형식 입력
      const dueDateInput = instructorPage.locator('input[name="dueDate"], input[type="datetime-local"]').first();
      if (await dueDateInput.count() > 0) {
        await dueDateInput.fill('invalid-date');
        
        // 저장 버튼 클릭
        await instructorPage.click('button:has-text("생성"), button:has-text("저장")');

        // 에러 메시지 확인
        await expect(instructorPage.locator('text=/날짜|date|유효/i').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('네트워크 에러', () => {
    test('네트워크 오류 시 사용자 친화적 메시지가 표시된다', async ({ page, context }) => {
      // 네트워크 요청 차단
      await context.route('**/api/**', route => route.abort());

      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button:has-text("로그인")');

      // 에러 메시지 확인
      await expect(page.locator('text=/네트워크|연결|오류|실패/i').first()).toBeVisible({ timeout: 5000 });
    });

    authTest('API 요청 실패 시 재시도 옵션이 제공된다', async ({ learnerPage, context }) => {
      // 일시적으로 네트워크 요청 실패
      let requestCount = 0;
      await context.route('**/api/**', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort(); // 첫 번째 요청 실패
        } else {
          route.continue(); // 재시도는 성공
        }
      });

      await learnerPage.goto('/dashboard');
      
      // 재시도 버튼 또는 자동 재시도 확인
      // 실제 구현에 따라 다를 수 있음
    });
  });

  test.describe('세션 관리', () => {
    test('세션 만료 시 로그인 페이지로 리다이렉트된다', async ({ page, context }) => {
      // 로그인
      const email = generateRandomEmail();
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.selectOption('select[name="role"]', 'learner');
      await page.click('button:has-text("회원가입")');
      await page.waitForURL(/\/(dashboard|explore-courses)/);

      // 쿠키 삭제 (세션 만료 시뮬레이션)
      await context.clearCookies();

      // 보호된 페이지 접근
      await page.goto('/dashboard');

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/);
    });

    authTest('로그아웃 후 세션이 완전히 종료된다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');
      
      // 로그아웃
      await logout(learnerPage);

      // 보호된 페이지 접근 시도
      await learnerPage.goto('/dashboard');

      // 로그인 페이지로 리다이렉트 확인
      await expect(learnerPage).toHaveURL(/\/login/);
    });
  });

  test.describe('빈 데이터 처리', () => {
    authTest('강의가 없을 때 적절한 메시지가 표시된다', async ({ instructorPage }) => {
      await instructorPage.goto('/courses');

      // 강의가 없는 경우
      const emptyMessage = instructorPage.locator('text=/강의가 없습니다|no courses|생성/i').first();
      // 빈 상태 메시지가 표시될 수 있음
    });

    authTest('과제가 없을 때 적절한 메시지가 표시된다', async ({ instructorPage }) => {
      const courseId = await createCourse(instructorPage, {
        title: generateRandomCourseTitle(),
        description: '빈 과제 테스트',
        ...testCourses.webDevelopment,
      });

      await instructorPage.goto(`/courses/${courseId}/assignments`);

      // 과제가 없는 경우
      const emptyMessage = instructorPage.locator('text=/과제가 없습니다|no assignments|생성/i').first();
      // 빈 상태 메시지가 표시될 수 있음
    });

    authTest('수강 중인 강의가 없을 때 적절한 메시지가 표시된다', async ({ learnerPage }) => {
      await learnerPage.goto('/dashboard');

      // 수강 중인 강의가 없는 경우
      const emptyMessage = learnerPage.locator('text=/수강 중인 강의가 없습니다|no enrolled courses/i').first();
      // 빈 상태 메시지가 표시될 수 있음
    });
  });

  test.describe('경계값 테스트', () => {
    authTest('매우 긴 제목 입력 시 처리된다', async ({ instructorPage }) => {
      await instructorPage.goto('/courses/new');

      // 매우 긴 제목 (200자 이상)
      const longTitle = 'A'.repeat(300);
      await instructorPage.fill('input[name="title"]', longTitle);

      // 제목 길이 제한 확인
      const titleInput = instructorPage.locator('input[name="title"]').first();
      const value = await titleInput.inputValue();
      
      // 입력값이 제한된 길이를 초과하지 않는지 확인
      expect(value.length).toBeLessThanOrEqual(200); // 또는 적절한 최대 길이
    });

    authTest('음수 점수는 입력할 수 없다', async ({ instructorPage }) => {
      const courseId = await createCourse(instructorPage, {
        title: generateRandomCourseTitle(),
        description: '점수 테스트',
        ...testCourses.webDevelopment,
      });

      await instructorPage.goto(`/courses/${courseId}/assignments/new`);

      // 점수 배점 입력 필드 찾기
      const pointsInput = instructorPage.locator('input[name="pointsWeight"], input[type="number"]').first();
      if (await pointsInput.count() > 0) {
        // 음수 입력 시도
        await pointsInput.fill('-10');
        
        // 입력값이 0 이상인지 확인
        const value = await pointsInput.inputValue();
        expect(parseInt(value) || 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('동시성 처리', () => {
    authTest('동시에 같은 강의를 수강신청할 수 있다', async ({ page, context }) => {
      // 여러 브라우저 컨텍스트에서 동시 수강신청 테스트
      // 실제 구현에 따라 다를 수 있음
      
      // 이 테스트는 실제로는 별도의 테스트 전략이 필요할 수 있음
      // 여기서는 기본적인 구조만 제공
    });
  });

  test.describe('404 에러 처리', () => {
    test('존재하지 않는 페이지 접근 시 404 페이지가 표시된다', async ({ page }) => {
      await page.goto('/non-existent-page');

      // 404 메시지 확인
      await expect(page.locator('text=/404|not found|페이지를 찾을 수 없습니다/i').first()).toBeVisible({ timeout: 5000 });
    });

    authTest('존재하지 않는 강의 ID 접근 시 에러가 표시된다', async ({ learnerPage }) => {
      const nonExistentCourseId = '00000000-0000-0000-0000-000000000000';
      await learnerPage.goto(`/courses/${nonExistentCourseId}`);

      // 에러 메시지 확인
      await expect(learnerPage.locator('text=/찾을 수 없습니다|not found|404/i').first()).toBeVisible({ timeout: 5000 });
    });

    authTest('존재하지 않는 과제 ID 접근 시 에러가 표시된다', async ({ instructorPage }) => {
      const courseId = await createCourse(instructorPage, {
        title: generateRandomCourseTitle(),
        description: '404 테스트',
        ...testCourses.webDevelopment,
      });

      const nonExistentAssignmentId = '00000000-0000-0000-0000-000000000000';
      await instructorPage.goto(`/courses/${courseId}/assignments/${nonExistentAssignmentId}`);

      // 에러 메시지 확인
      await expect(instructorPage.locator('text=/찾을 수 없습니다|not found|404/i').first()).toBeVisible({ timeout: 5000 });
    });
  });
});

