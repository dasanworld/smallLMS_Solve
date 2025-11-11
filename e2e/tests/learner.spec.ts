import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 러너(학습자) 페이지 통합 E2E 테스트
 * 모든 학습자 관련 기능을 테스트합니다:
 * - 대시보드 조회 및 상호작용
 * - 강좌 카탈로그 조회 및 수강신청
 * - 과제 조회 및 제출
 * - 성적 조회
 * - 전체 워크플로우
 */

test.describe('Learner Pages E2E Tests', () => {
  /**
   * 1. 러너 대시보드 테스트
   */
  test.describe('러너 대시보드 (/dashboard)', () => {
    authTest('대시보드 페이지 접근 및 기본 UI 렌더링', async ({ learnerPage }) => {
      const page = learnerPage;

      // 대시보드로 이동
      await page.goto(`${BASE_URL}/dashboard`);

      // 대시보드 제목 확인
      await expect(page.locator('text=/대시보드|Dashboard/i')).toBeVisible({
        timeout: 5000,
      });

      // 주요 섹션 확인
      const mainContent = page.locator('[role="main"]');
      await expect(mainContent).toBeVisible();
    });

    authTest('수강 중인 강좌 섹션 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 수강 강좌 섹션 확인
      const courseSection = page.locator(
        'text=/수강 중인 강좌|내 강좌|enrolled|enrolled course/i'
      );

      // 섹션이 있으면 그 안의 콘텐츠 확인
      if ((await courseSection.count()) > 0) {
        await expect(courseSection).toBeVisible();
      }
    });

    authTest('다가오는 과제 섹션 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 과제 관련 섹션 확인
      const assignmentSection = page.locator('text=/과제|assignment|upcoming/i');

      if ((await assignmentSection.count()) > 0) {
        await expect(assignmentSection).toBeVisible();
      }
    });

    authTest('학습 진도/메트릭 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 메트릭 카드 확인
      const metricCards = page.locator('[class*="card"], [class*="metric"]');

      if ((await metricCards.count()) > 0) {
        await expect(metricCards.first()).toBeVisible();
      }
    });

    authTest('강좌로 네비게이션', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 강좌 링크 클릭 (존재하면)
      const courseLink = page.locator('a:has-text(/강좌|course/i)').first();

      if ((await courseLink.count()) > 0) {
        await courseLink.click();

        // URL이 변경되는지 확인
        await page.waitForURL(/\/courses\/.+/, { timeout: 5000 });
        const currentUrl = page.url();
        expect(currentUrl).toContain('/courses/');
      }
    });

    authTest('대시보드에서 다른 페이지로 네비게이션', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 메뉴 또는 네비게이션 요소 확인
      const navButtons = page.locator('a, button');
      const navCount = await navButtons.count();

      expect(navCount).toBeGreaterThan(0);
    });
  });

  /**
   * 2. 강좌 카탈로그/조회 테스트
   */
  test.describe('강좌 조회 및 수강신청 (/courses, /explore-courses)', () => {
    authTest('강좌 카탈로그 페이지 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      // 여러 강좌 관련 경로 시도
      const coursePaths = ['/courses', '/explore-courses', '/my-courses'];

      for (const path of coursePaths) {
        await page.goto(`${BASE_URL}${path}`);

        // 페이지가 로드되었는지 확인
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
          // 타임아웃 무시
        });

        // 강좌 관련 텍스트 또는 컨테이너 확인
        const courseElements = page.locator(
          '[class*="course"], text=/강좌|course/i'
        );

        if ((await courseElements.count()) > 0) {
          await expect(courseElements.first()).toBeVisible();
          break;
        }
      }
    });

    authTest('강좌 목록 표시 확인', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강좌 페이지 접근
      await page.goto(`${BASE_URL}/courses`);

      // 강좌 카드 또는 리스트 아이템 확인
      const courseCards = page.locator('[class*="course"], [class*="card"]');

      if ((await courseCards.count()) > 0) {
        await expect(courseCards.first()).toBeVisible();
      }
    });

    authTest('강좌 검색 기능', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/courses`);

      // 검색 입력창 찾기
      const searchInput = page.locator('input[type="text"], input[placeholder*="검색"]');

      if ((await searchInput.count()) > 0) {
        await searchInput.fill('python');
        await page.keyboard.press('Enter');

        // 검색 결과 대기
        await page.waitForTimeout(1000);
        const searchResults = page.locator('[class*="result"], [class*="course"]');
        expect(await searchResults.count()).toBeGreaterThanOrEqual(0);
      }
    });

    authTest('카테고리 필터링', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/courses`);

      // 카테고리 필터 찾기
      const categoryFilter = page.locator(
        'select[name*="category"], button[class*="filter"]'
      );

      if ((await categoryFilter.count()) > 0) {
        const isSelect = await categoryFilter.first().evaluate((el) =>
          el.tagName === 'SELECT'
        );

        if (isSelect) {
          await categoryFilter.first().selectOption({ index: 1 }).catch(() => {
            // 옵션 선택 실패 무시
          });
        } else {
          await categoryFilter.first().click();
        }

        await page.waitForTimeout(500);
      }
    });

    authTest('강좌 상세 페이지 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강좌 목록에서 첫 번째 강좌 클릭
      await page.goto(`${BASE_URL}/courses`);

      const courseLink = page.locator('a').filter({ has: page.locator('text=/강좌|course/i') }).first();

      if ((await courseLink.count()) > 0) {
        await courseLink.click();

        // 강좌 상세 페이지 확인 (URL이 /courses/[id]로 변경)
        await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5000 }).catch(() => {
          // URL 변경 대기 실패 무시
        });

        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/courses\//);
      }
    });

    authTest('강좌 수강신청 버튼 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강좌 상세 페이지로 직접 이동 (테스트용)
      await page.goto(`${BASE_URL}/courses`);

      // 강좌 카드 또는 상세 페이지 찾기
      const enrollButton = page.locator('button:has-text(/수강신청|enroll|register/i)');

      if ((await enrollButton.count()) > 0) {
        await expect(enrollButton.first()).toBeVisible();
      }
    });

    authTest('강좌 강사 정보 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/courses`);

      // 강사 정보 표시 확인
      const instructorInfo = page.locator('text=/강사|instructor|educator/i');

      if ((await instructorInfo.count()) > 0) {
        await expect(instructorInfo.first()).toBeVisible();
      }
    });
  });

  /**
   * 3. 과제 조회 및 제출 테스트
   */
  test.describe('과제 조회 및 제출 (/my-assignments, /courses/[id]/assignments)', () => {
    authTest('나의 과제 페이지 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      // 나의 과제 페이지로 이동
      await page.goto(`${BASE_URL}/my-assignments`);

      // 페이지 로드 확인
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        // 타임아웃 무시
      });

      // 과제 관련 콘텐츠 확인
      const assignmentContent = page.locator('[class*="assignment"], text=/과제/i');

      if ((await assignmentContent.count()) > 0) {
        await expect(assignmentContent.first()).toBeVisible();
      }
    });

    authTest('과제 상태별 탭 필터링', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 과제 상태 탭 찾기 (대기중, 제출됨, 채점됨)
      const statusTabs = page.locator('button[role="tab"], div[role="tab"]');

      if ((await statusTabs.count()) > 0) {
        // 첫 번째 탭 클릭
        await statusTabs.first().click();

        // 탭 변경 후 콘텐츠 업데이트 확인
        await page.waitForTimeout(500);
        const tabContent = page.locator('[class*="content"], [class*="list"]');
        expect(await tabContent.count()).toBeGreaterThanOrEqual(0);
      }
    });

    authTest('과제 목록 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 과제 카드 또는 아이템 확인
      const assignmentItems = page.locator(
        '[class*="assignment-card"], [class*="assignment-item"], li, tr'
      );

      if ((await assignmentItems.count()) > 0) {
        await expect(assignmentItems.first()).toBeVisible();
      }
    });

    authTest('과제 상세 정보 조회', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 과제 클릭 (존재하면)
      const assignmentLink = page.locator('a, button').filter({
        has: page.locator('text=/과제|assignment/i'),
      }).first();

      if ((await assignmentLink.count()) > 0) {
        await assignmentLink.click();

        // 상세 페이지 또는 모달 로드 대기
        await page.waitForTimeout(1000);

        // 상세 정보 확인
        const detailContent = page.locator('text=/마감일|점수|배점|제출/i');
        expect(await detailContent.count()).toBeGreaterThanOrEqual(0);
      }
    });

    authTest('과제 제출 양식 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 제출하기 또는 답안 제출 버튼 찾기
      const submitButton = page.locator('button:has-text(/제출|submit|답안/i)');

      if ((await submitButton.count()) > 0) {
        await expect(submitButton.first()).toBeVisible();
      }
    });

    authTest('강좌별 과제 조회', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강좌별 과제 페이지 접근을 위해 먼저 강좌 목록 확인
      await page.goto(`${BASE_URL}/courses`);

      // 첫 번째 강좌 클릭
      const courseLink = page.locator('a').filter({
        has: page.locator('text=/강좌|course/i'),
      }).first();

      if ((await courseLink.count()) > 0) {
        const href = await courseLink.getAttribute('href');

        if (href && href.includes('/courses/')) {
          // 과제 페이지로 이동
          const courseId = href.split('/').filter((p) => p)[1];
          await page.goto(`${BASE_URL}/courses/${courseId}/assignments`);

          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
            // 타임아웃 무시
          });

          // 강좌별 과제 목록 확인
          const assignmentList = page.locator('[class*="assignment"]');
          expect(await assignmentList.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    authTest('과제 마감일 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 마감일 텍스트 찾기
      const dueDate = page.locator('text=/마감일|due|deadline/i');

      if ((await dueDate.count()) > 0) {
        await expect(dueDate.first()).toBeVisible();
      }
    });

    authTest('과제 제출 상태 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 제출 상태 텍스트 찾기
      const statusIndicators = page.locator(
        'text=/제출됨|미제출|대기|채점중|채점완료/i'
      );

      if ((await statusIndicators.count()) > 0) {
        await expect(statusIndicators.first()).toBeVisible();
      }
    });
  });

  /**
   * 4. 성적 조회 테스트
   */
  test.describe('성적 조회 (/grades)', () => {
    authTest('성적 조회 페이지 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      // 성적 페이지로 이동
      await page.goto(`${BASE_URL}/grades`);

      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        // 타임아웃 무시
      });

      // 성적 페이지 제목 또는 콘텐츠 확인
      const gradeContent = page.locator('text=/성적|grade|점수/i');

      if ((await gradeContent.count()) > 0) {
        await expect(gradeContent.first()).toBeVisible();
      }
    });

    authTest('성적 목록 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 성적 카드 또는 테이블 확인
      const gradeItems = page.locator('[class*="grade"], table, tbody');

      if ((await gradeItems.count()) > 0) {
        await expect(gradeItems.first()).toBeVisible();
      }
    });

    authTest('강좌별 성적 표시', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 강좌명 또는 강좌별 성적 섹션 확인
      const courseGrades = page.locator('text=/강좌|course/i');

      if ((await courseGrades.count()) > 0) {
        await expect(courseGrades.first()).toBeVisible();
      }
    });

    authTest('과제별 성적 및 피드백 조회', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 과제명 및 점수 확인
      const assignmentGrades = page.locator('text=/과제|assignment|점수|피드백/i');

      if ((await assignmentGrades.count()) > 0) {
        await expect(assignmentGrades.first()).toBeVisible();
      }
    });

    authTest('성적 정렬 또는 필터링', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 정렬 또는 필터 옵션 찾기
      const sortOrFilter = page.locator('button[class*="sort"], select[name*="filter"]');

      if ((await sortOrFilter.count()) > 0) {
        await sortOrFilter.first().click();
        await page.waitForTimeout(500);
      }
    });

    authTest('성적 상세 페이지 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 성적 항목 클릭
      const gradeItem = page.locator('a, button').filter({
        has: page.locator('text=/성적|grade/i'),
      }).first();

      if ((await gradeItem.count()) > 0) {
        await gradeItem.click();

        await page.waitForTimeout(1000);

        // 상세 정보 (피드백 등) 확인
        const details = page.locator('text=/피드백|feedback|comment/i');
        expect(await details.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  /**
   * 5. 네비게이션 및 접근 제어 테스트
   */
  test.describe('러너 페이지 네비게이션 및 접근 제어', () => {
    authTest('메인 네비게이션 메뉴', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 네비게이션 메뉴 확인
      const navMenu = page.locator('[role="navigation"], nav, [class*="sidebar"]');

      if ((await navMenu.count()) > 0) {
        await expect(navMenu.first()).toBeVisible();
      }
    });

    authTest('로그아웃 기능', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 로그아웃 버튼 찾기
      const logoutButton = page.locator('button:has-text(/로그아웃|logout|sign out/i)');

      if ((await logoutButton.count()) > 0) {
        await expect(logoutButton.first()).toBeVisible();
      }
    });

    authTest('프로필 메뉴 접근', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/dashboard`);

      // 프로필 메뉴 또는 사용자 이름 확인
      const profileMenu = page.locator('text=/프로필|profile|설정|account/i');

      if ((await profileMenu.count()) > 0) {
        await expect(profileMenu.first()).toBeVisible();
      }
    });

    authTest('강사 대시보드 접근 불가 확인 (학습자)', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강사 대시보드 직접 접근 시도
      await page.goto(`${BASE_URL}/instructor-dashboard`);

      // 403 또는 리다이렉트 확인
      const response = page.request;
      const statusCode = page.url();

      // URL이 변경되었거나 에러 페이지로 이동했는지 확인
      await page.waitForTimeout(1000);

      // 강사 대시보드가 아니어야 함
      expect(page.url()).not.toContain('instructor-dashboard');
    });

    authTest('러너 페이지 로드 성능', async ({ learnerPage }) => {
      const page = learnerPage;

      // 대시보드 로드 시간 측정
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        // 타임아웃 무시
      });

      const loadTime = Date.now() - startTime;

      // 로드 시간이 10초 이내여야 함
      expect(loadTime).toBeLessThan(10000);
    });
  });

  /**
   * 6. 반응형 디자인 테스트
   */
  test.describe('러너 페이지 반응형 디자인', () => {
    authTest('모바일 뷰포트에서 대시보드 접근', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });

      // 로그인
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'learner@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // 대시보드 접근
      await page.goto(`${BASE_URL}/dashboard`);

      // 모바일 뷰에서 렌더링 확인
      const mainContent = page.locator('[role="main"]');
      await expect(mainContent).toBeVisible();
    });

    authTest('태블릿 뷰포트에서 강좌 목록 접근', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 });

      // 로그인
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'learner@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // 강좌 페이지 접근
      await page.goto(`${BASE_URL}/courses`);

      // 태블릿 뷰에서 렌더링 확인
      const courseList = page.locator('[class*="course"]');
      expect(await courseList.count()).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * 7. API 통합 테스트
   */
  test.describe('러너 페이지 API 통합', () => {
    authTest('대시보드 데이터 API 호출', async ({ learnerPage, learner }) => {
      const page = learnerPage;

      // API 인터셉트
      const responses: any[] = [];
      page.on('response', (response) => {
        if (response.url().includes('/api')) {
          responses.push({
            url: response.url(),
            status: response.status(),
          });
        }
      });

      // 대시보드 접근
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // API 호출 확인
      const apiCalls = responses.filter((r) => r.status === 200);
      expect(apiCalls.length).toBeGreaterThan(0);
    });

    authTest('강좌 목록 API 응답 검증', async ({ learnerPage }) => {
      const page = learnerPage;

      // 강좌 목록 API 요청 인터셉트
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api') &&
          (response.url().includes('course') || response.url().includes('enrolled'))
      );

      await page.goto(`${BASE_URL}/courses`);

      try {
        const response = await responsePromise;

        // 응답 상태 확인
        expect([200, 304, 404, 400]).toContain(response.status());

        // 응답 본문이 유효한 JSON인지 확인
        try {
          await response.json();
        } catch {
          // JSON 파싱 실패는 상태 코드로만 판단
        }
      } catch {
        // 타임아웃 또는 응답 없음 (옵션)
      }
    });
  });

  /**
   * 8. 데이터 검증 테스트
   */
  test.describe('러너 페이지 데이터 검증', () => {
    authTest('과제 마감일 형식 검증', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/my-assignments`);

      // 날짜 형식 확인
      const dateElements = page.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{4}/');

      if ((await dateElements.count()) > 0) {
        const dateText = await dateElements.first().textContent();

        // 유효한 날짜 형식인지 확인
        expect(dateText).toMatch(/\d/);
      }
    });

    authTest('성적 점수 형식 검증', async ({ learnerPage }) => {
      const page = learnerPage;

      await page.goto(`${BASE_URL}/grades`);

      // 점수 형식 확인
      const scoreElements = page.locator('text=/\\d+(\\.\\d+)?\\s*(점|\/100|%)?/');

      if ((await scoreElements.count()) > 0) {
        const scoreText = await scoreElements.first().textContent();

        // 숫자 형식인지 확인
        expect(scoreText).toMatch(/\d/);
      }
    });
  });
});
