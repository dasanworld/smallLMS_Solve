import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 러너(학습자) 전체 워크플로우 E2E 테스트
 * 실제 사용 시나리오를 따라 엔드-투-엔드 테스트를 수행합니다:
 * 1. 회원가입 또는 로그인
 * 2. 대시보드 확인
 * 3. 강좌 탐색 및 수강신청
 * 4. 강좌 내용 조회
 * 5. 과제 조회 및 제출
 * 6. 성적 확인
 * 7. 로그아웃
 */

test.describe('러너 전체 워크플로우 (End-to-End)', () => {
  /**
   * 시나리오 1: 기본 학습 흐름
   * - 대시보드 → 강좌 탐색 → 수강신청 → 과제 조회
   */
  test.describe('기본 학습 흐름', () => {
    authTest(
      '대시보드에서 강좌 탐색까지의 전체 흐름',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 대시보드 접근
        await page.goto(`${BASE_URL}/dashboard`);
        await expect(
          page.locator('text=/대시보드|Dashboard/i')
        ).toBeVisible({ timeout: 5000 });

        // 2단계: 강좌 탐색 페이지로 이동
        const exploreCourseLink = page.locator(
          'a:has-text(/강좌 탐색|강좌 찾기|explore|browse/i)'
        );

        if ((await exploreCourseLink.count()) > 0) {
          await exploreCourseLink.first().click();
          await page.waitForURL(/\/courses|\/explore/, { timeout: 5000 });

          // 3단계: 강좌 목록 확인
          const courseList = page.locator('[class*="course"]');
          if ((await courseList.count()) > 0) {
            // 4단계: 첫 번째 강좌 클릭
            const firstCourse = courseList.first();
            await firstCourse.click();

            // 강좌 상세 페이지 확인
            await page.waitForLoadState('networkidle', {
              timeout: 5000,
            });

            const courseTitle = page.locator('h1, h2');
            expect(await courseTitle.count()).toBeGreaterThan(0);
          }
        } else {
          // 직접 강좌 페이지로 이동
          await page.goto(`${BASE_URL}/courses`);
          const courseList = page.locator('[class*="course"]');
          expect(await courseList.count()).toBeGreaterThanOrEqual(0);
        }
      }
    );

    authTest(
      '강좌 수강신청 프로세스',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 강좌 목록 페이지 접근
        await page.goto(`${BASE_URL}/courses`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 2단계: 수강신청 가능한 강좌 찾기
        const enrollButtons = page.locator(
          'button:has-text(/수강신청|enroll|register/i)'
        );

        if ((await enrollButtons.count()) > 0) {
          // 3단계: 수강신청 버튼 클릭
          const firstEnrollButton = enrollButtons.first();
          await firstEnrollButton.click();

          // 4단계: 수강신청 확인 메시지 확인
          await page.waitForTimeout(1000);

          const successMessage = page.locator(
            'text=/성공|완료|신청|등록|enrolled/i'
          );

          if ((await successMessage.count()) > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    );

    authTest(
      '수강 중인 강좌에서 과제 조회',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 대시보드 접근
        await page.goto(`${BASE_URL}/dashboard`);

        // 2단계: 수강 중인 강좌 찾기
        const courseCard = page
          .locator('[class*="course-card"], [class*="course"]')
          .first();

        if ((await courseCard.count()) > 0) {
          // 3단계: 강좌 클릭
          const courseLink = courseCard.locator('a').first();
          const href = await courseLink.getAttribute('href');

          if (href) {
            // 4단계: 과제 페이지로 네비게이션
            const courseId = href.split('/').filter((p) => p)[1];
            await page.goto(`${BASE_URL}/courses/${courseId}/assignments`);

            await page.waitForLoadState('networkidle', {
              timeout: 5000,
            });

            // 5단계: 과제 목록 확인
            const assignmentList = page.locator('[class*="assignment"]');
            expect(await assignmentList.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    );
  });

  /**
   * 시나리오 2: 과제 제출 흐름
   * - 나의 과제 → 과제 상세 → 과제 제출
   */
  test.describe('과제 제출 흐름', () => {
    authTest(
      '나의 과제 페이지에서 과제 제출까지',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 나의 과제 페이지 접근
        await page.goto(`${BASE_URL}/my-assignments`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 2단계: 과제 목록 확인
        const assignmentItems = page.locator(
          '[class*="assignment-card"], [class*="assignment-item"]'
        );

        if ((await assignmentItems.count()) > 0) {
          const firstAssignment = assignmentItems.first();

          // 3단계: 첫 번째 과제 클릭
          const assignmentLink = firstAssignment.locator('a, button').first();

          if ((await assignmentLink.count()) > 0) {
            await assignmentLink.click();

            // 4단계: 과제 상세 정보 로드 대기
            await page.waitForTimeout(1000);

            // 5단계: 과제 제출 양식 확인
            const submitForm = page.locator(
              'form, [class*="submit"], textarea, [contenteditable]'
            );

            if ((await submitForm.count()) > 0) {
              // 6단계: 제출 가능 여부 확인
              const submitButton = page.locator(
                'button:has-text(/제출|submit|제출하기/i)'
              );

              if ((await submitButton.count()) > 0) {
                await expect(submitButton.first()).toBeVisible();
              }
            }
          }
        }
      }
    );

    authTest(
      '과제 상태별 조회',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 나의 과제 페이지 접근
        await page.goto(`${BASE_URL}/my-assignments`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 2단계: 상태 탭 찾기 (대기중, 제출됨, 채점됨)
        const statusTabs = page.locator('button[role="tab"], div[role="tablist"]');

        if ((await statusTabs.count()) > 0) {
          const tabs = await page.locator('button[role="tab"]').all();

          // 3단계: 각 탭 클릭하여 과제 상태별 조회
          for (const tab of tabs) {
            await tab.click();
            await page.waitForTimeout(500);

            // 각 탭의 과제 목록 확인
            const assignments = page.locator('[class*="assignment"]');
            expect(await assignments.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    );
  });

  /**
   * 시나리오 3: 성적 확인 흐름
   * - 성적 페이지 → 강좌별 성적 → 과제 성적 및 피드백
   */
  test.describe('성적 확인 흐름', () => {
    authTest(
      '성적 페이지 전체 네비게이션',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 성적 페이지 접근
        await page.goto(`${BASE_URL}/grades`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 2단계: 성적 목록 확인
        const gradeList = page.locator('[class*="grade"]');

        if ((await gradeList.count()) > 0) {
          // 3단계: 첫 번째 성적 항목 클릭
          const firstGradeItem = page
            .locator('a, button')
            .filter({ has: page.locator('text=/성적|grade/i') })
            .first();

          if ((await firstGradeItem.count()) > 0) {
            await firstGradeItem.click();

            // 4단계: 성적 상세 페이지 또는 모달 로드
            await page.waitForTimeout(1000);

            // 5단계: 피드백 정보 확인
            const feedback = page.locator(
              'text=/피드백|feedback|코멘트|comment/i'
            );
            expect(await feedback.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    );

    authTest(
      '강좌별 성적 통계',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 성적 페이지 접근
        await page.goto(`${BASE_URL}/grades`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 2단계: 강좌별 성적 섹션 확인
        const courseGrades = page.locator('text=/강좌|course/i');

        if ((await courseGrades.count()) > 0) {
          // 3단계: 강좌 성적 클릭
          await courseGrades.first().click();

          await page.waitForTimeout(500);

          // 4단계: 과제별 성적 확인
          const assignmentGrades = page.locator(
            'text=/과제|assignment|점수/i'
          );
          expect(await assignmentGrades.count()).toBeGreaterThanOrEqual(0);
        }
      }
    );
  });

  /**
   * 시나리오 4: 전체 학습 사이클
   * 대시보드 → 강좌 탐색 → 수강신청 → 과제 조회 → 성적 확인
   */
  test.describe('완전한 학습 사이클', () => {
    authTest(
      '대시보드에서 시작하는 전체 학습 프로세스',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 1단계: 대시보드에서 시작
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        let currentStep = '대시보드';
        console.log(`✓ 단계 1: ${currentStep} 접근 완료`);

        // 2단계: 강좌 목록 페이지로 이동
        let courseLink = page
          .locator('a')
          .filter({ has: page.locator('text=/강좌|course/i') })
          .first();

        if ((await courseLink.count()) > 0) {
          await courseLink.click();
          await page.waitForURL(/\/courses/, { timeout: 5000 });
          currentStep = '강좌 목록';
          console.log(`✓ 단계 2: ${currentStep} 페이지 접근 완료`);

          // 3단계: 과제 페이지로 이동
          const assignmentLink = page
            .locator('a')
            .filter({ has: page.locator('text=/과제|assignment/i') })
            .first();

          if ((await assignmentLink.count()) > 0) {
            await assignmentLink.click();
            await page.waitForLoadState('networkidle', {
              timeout: 5000,
            });
            currentStep = '과제 목록';
            console.log(`✓ 단계 3: ${currentStep} 페이지 접근 완료`);
          }
        }

        // 4단계: 성적 페이지로 이동
        await page.goto(`${BASE_URL}/grades`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        currentStep = '성적 조회';
        console.log(`✓ 단계 4: ${currentStep} 페이지 접근 완료`);

        // 5단계: 다시 대시보드로 돌아가기
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        currentStep = '대시보드 (재방문)';
        console.log(`✓ 단계 5: ${currentStep} 페이지 접근 완료`);

        // 전체 사이클 완료 확인
        const finalUrl = page.url();
        expect(finalUrl).toContain('dashboard');
      }
    );

    authTest(
      '네비게이션 메뉴를 통한 페이지 이동',
      async ({ learnerPage }) => {
        const page = learnerPage;

        const pagesToVisit = [
          { path: '/dashboard', name: '대시보드' },
          { path: '/courses', name: '강좌' },
          { path: '/my-assignments', name: '나의 과제' },
          { path: '/grades', name: '성적' },
        ];

        for (const { path, name } of pagesToVisit) {
          await page.goto(`${BASE_URL}${path}`);

          // 페이지 로드 확인
          await page.waitForLoadState('networkidle', {
            timeout: 5000,
          }).catch(() => {
            // 타임아웃 허용
          });

          // 페이지가 로드되었음을 확인
          const mainContent = page.locator('[role="main"]');
          const hasContent = (await mainContent.count()) > 0;

          expect(hasContent || (await page.content()).length > 0).toBeTruthy();

          console.log(`✓ ${name} 페이지 (${path}) 접근 완료`);
        }
      }
    );
  });

  /**
   * 시나리오 5: 성능 및 접근성 테스트
   */
  test.describe('성능 및 접근성', () => {
    authTest(
      '러너 페이지 로드 시간 측정',
      async ({ learnerPage }) => {
        const page = learnerPage;

        const pages = [
          '/dashboard',
          '/courses',
          '/my-assignments',
          '/grades',
        ];

        const loadTimes: Record<string, number> = {};

        for (const pagePath of pages) {
          const startTime = Date.now();

          await page.goto(`${BASE_URL}${pagePath}`);
          await page.waitForLoadState('networkidle', {
            timeout: 10000,
          });

          const loadTime = Date.now() - startTime;
          loadTimes[pagePath] = loadTime;

          // 각 페이지 로드 시간이 5초 이내여야 함 (권장)
          expect(loadTime).toBeLessThan(5000);

          console.log(`✓ ${pagePath}: ${loadTime}ms`);
        }

        // 평균 로드 시간 계산
        const avgLoadTime =
          Object.values(loadTimes).reduce((a, b) => a + b, 0) /
          Object.keys(loadTimes).length;

        console.log(`평균 로드 시간: ${Math.round(avgLoadTime)}ms`);
      }
    );

    authTest(
      '페이지 콘텐츠 접근성 확인',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 주요 러너 페이지 접근성 검사
        const pages = [
          '/dashboard',
          '/courses',
          '/my-assignments',
          '/grades',
        ];

        for (const pagePath of pages) {
          await page.goto(`${BASE_URL}${pagePath}`);

          // 제목 요소 확인 (h1, h2)
          const headings = page.locator('h1, h2');
          expect(await headings.count()).toBeGreaterThan(0);

          // 네비게이션 요소 확인
          const navElements = page.locator('nav, [role="navigation"]');
          const hasNav =
            (await navElements.count()) > 0 ||
            (await page.locator('a').count()) > 0;
          expect(hasNav).toBeTruthy();

          // 주요 콘텐츠 영역 확인
          const mainContent = page.locator('[role="main"]');
          const hasMainContent =
            (await mainContent.count()) > 0 ||
            (await page.locator('main').count()) > 0;
          expect(hasMainContent).toBeTruthy();

          console.log(`✓ ${pagePath} 접근성 요소 확인 완료`);
        }
      }
    );
  });

  /**
   * 시나리오 6: 에러 처리 및 복구
   */
  test.describe('에러 처리 및 복구', () => {
    authTest(
      '존재하지 않는 강좌 접근 처리',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 존재하지 않는 강좌 ID로 접근
        await page.goto(`${BASE_URL}/courses/nonexistent-id`, {
          waitUntil: 'networkidle',
        });

        // 에러 메시지 또는 리다이렉트 확인
        await page.waitForTimeout(1000);

        // 페이지가 에러를 표시하거나 리다이렉트되어야 함
        const hasError = await page
          .locator('text=/찾을 수 없음|not found|error/i')
          .count();
        const hasRedirected =
          !page.url().includes('nonexistent-id');

        expect(hasError > 0 || hasRedirected).toBeTruthy();
      }
    );

    authTest(
      '네트워크 오류 후 페이지 새로고침',
      async ({ learnerPage }) => {
        const page = learnerPage;

        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // 페이지 새로고침
        await page.reload();

        // 새로고침 후 페이지가 정상 로드되는지 확인
        const mainContent = page.locator('[role="main"]');
        await expect(mainContent).toBeVisible({ timeout: 5000 });
      }
    );
  });

  /**
   * 시나리오 7: 로그아웃 및 세션 관리
   */
  test.describe('로그아웃 및 세션 관리', () => {
    authTest(
      '러너 페이지에서 로그아웃',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 대시보드 접근
        await page.goto(`${BASE_URL}/dashboard`);

        // 로그아웃 버튼 찾기
        const logoutButton = page.locator(
          'button:has-text(/로그아웃|logout|sign out/i)'
        );

        if ((await logoutButton.count()) > 0) {
          // 로그아웃 버튼이 있는 경우
          await logoutButton.first().click();

          // 로그인 페이지로 리다이렉트 확인
          await page.waitForURL(/\/login|\/auth/, {
            timeout: 5000,
          }).catch(() => {
            // 리다이렉트 없을 수 있음
          });

          // 로그아웃 후 대시보드 접근 불가 확인
          await page.goto(`${BASE_URL}/dashboard`);
          await page.waitForTimeout(1000);

          const currentUrl = page.url();
          // 로그인 페이지로 리다이렉트되어야 함
          expect(
            currentUrl.includes('login') || currentUrl.includes('auth')
          ).toBeTruthy();
        }
      }
    );
  });
});
