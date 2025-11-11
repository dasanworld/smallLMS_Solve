import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * 러너(학습자) 페이지 테스트 헬퍼 함수 모음
 * 반복적인 작업을 단순화하고 테스트 코드 재사용성을 높입니다
 */

/**
 * 대시보드 관련 헬퍼
 */
export const DashboardHelper = {
  /**
   * 대시보드 페이지로 이동
   */
  async navigate(page: Page) {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 대시보드가 정상 로드되었는지 확인
   */
  async isLoaded(page: Page) {
    const heading = page.locator('text=/대시보드|dashboard/i');
    return (await heading.count()) > 0;
  },

  /**
   * 수강 중인 강좌 섹션 확인
   */
  async getEnrolledCoursesSection(page: Page) {
    const courseSection = page.locator('text=/수강 중인 강좌|enrolled/i');
    return courseSection;
  },

  /**
   * 다가오는 과제 섹션 확인
   */
  async getUpcomingAssignmentsSection(page: Page) {
    const assignmentSection = page.locator('text=/과제|assignment/i');
    return assignmentSection;
  },

  /**
   * 메트릭 카드 개수 확인
   */
  async getMetricsCount(page: Page) {
    const metrics = page.locator('[class*="metric"], [class*="card"]');
    return await metrics.count();
  },
};

/**
 * 강좌 관련 헬퍼
 */
export const CourseHelper = {
  /**
   * 강좌 목록 페이지로 이동
   */
  async navigate(page: Page, explore = false) {
    const path = explore ? '/explore-courses' : '/courses';
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 강좌 목록 개수 조회
   */
  async getCourseCount(page: Page) {
    const courses = page.locator('[class*="course"]');
    return await courses.count();
  },

  /**
   * 검색으로 강좌 찾기
   */
  async searchCourse(page: Page, keyword: string) {
    const searchInput = page.locator('input[type="text"], input[placeholder*="검색"]');

    if ((await searchInput.count()) > 0) {
      await searchInput.fill(keyword);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 강좌 상세 페이지 접근
   */
  async navigateToDetail(page: Page, courseId: string) {
    await page.goto(`${BASE_URL}/courses/${courseId}`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 강좌 수강신청
   */
  async enroll(page: Page) {
    const enrollButton = page.locator('button:has-text(/수강신청|enroll/i)');

    if ((await enrollButton.count()) > 0) {
      await enrollButton.first().click();
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 수강신청 성공 메시지 확인
   */
  async isEnrollmentSuccessful(page: Page) {
    const successMessage = page.locator(
      'text=/성공|완료|신청|등록|enrolled/i'
    );
    return (await successMessage.count()) > 0;
  },

  /**
   * 카테고리 필터링
   */
  async filterByCategory(page: Page, categoryIndex = 1) {
    const categoryFilter = page.locator('select[name*="category"]');

    if ((await categoryFilter.count()) > 0) {
      await categoryFilter.selectOption({ index: categoryIndex }).catch(() => {
        // 선택 실패 무시
      });
      await page.waitForTimeout(500);
      return true;
    }

    return false;
  },

  /**
   * 첫 번째 강좌의 강좌 ID 추출
   */
  async getFirstCourseId(page: Page) {
    const courseLink = page.locator('a').filter({
      has: page.locator('text=/강좌|course/i'),
    }).first();

    if ((await courseLink.count()) > 0) {
      const href = await courseLink.getAttribute('href');
      const match = href?.match(/\/courses\/([^/]+)/);
      return match ? match[1] : null;
    }

    return null;
  },
};

/**
 * 과제 관련 헬퍼
 */
export const AssignmentHelper = {
  /**
   * 나의 과제 페이지로 이동
   */
  async navigate(page: Page) {
    await page.goto(`${BASE_URL}/my-assignments`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 강좌별 과제 페이지로 이동
   */
  async navigateToCourseAssignments(page: Page, courseId: string) {
    await page.goto(`${BASE_URL}/courses/${courseId}/assignments`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 과제 목록 개수 조회
   */
  async getAssignmentCount(page: Page) {
    const assignments = page.locator('[class*="assignment"]');
    return await assignments.count();
  },

  /**
   * 상태별 탭 전환
   */
  async switchStatusTab(page: Page, tabIndex = 0) {
    const statusTabs = page.locator('button[role="tab"]');

    if ((await statusTabs.count()) > tabIndex) {
      const tabs = await statusTabs.all();
      await tabs[tabIndex].click();
      await page.waitForTimeout(500);
      return true;
    }

    return false;
  },

  /**
   * 과제 상세 정보 조회
   */
  async openAssignmentDetail(page: Page) {
    const assignmentLink = page.locator('a, button').filter({
      has: page.locator('text=/과제|assignment/i'),
    }).first();

    if ((await assignmentLink.count()) > 0) {
      await assignmentLink.click();
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 과제 제출
   */
  async submitAssignment(page: Page, content: string) {
    const submitButton = page.locator('button:has-text(/제출|submit/i)');

    if ((await submitButton.count()) > 0) {
      // 제출 양식 찾기 (텍스트 영역 또는 입력창)
      const textarea = page.locator('textarea');
      if ((await textarea.count()) > 0) {
        await textarea.first().fill(content);
      }

      await submitButton.first().click();
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 과제 마감일 확인
   */
  async getDueDate(page: Page) {
    const dueDateElement = page.locator('text=/마감일|due|deadline/i');

    if ((await dueDateElement.count()) > 0) {
      const text = await dueDateElement.first().textContent();
      return text;
    }

    return null;
  },

  /**
   * 과제 배점 확인
   */
  async getPoints(page: Page) {
    const pointsElement = page.locator('text=/점수|배점|point/i');

    if ((await pointsElement.count()) > 0) {
      const text = await pointsElement.first().textContent();
      return text;
    }

    return null;
  },

  /**
   * 제출 상태 확인
   */
  async getSubmissionStatus(page: Page) {
    const statusElement = page.locator(
      'text=/제출됨|미제출|대기|채점중|채점완료/i'
    );

    if ((await statusElement.count()) > 0) {
      const text = await statusElement.first().textContent();
      return text;
    }

    return null;
  },
};

/**
 * 성적 관련 헬퍼
 */
export const GradeHelper = {
  /**
   * 성적 페이지로 이동
   */
  async navigate(page: Page) {
    await page.goto(`${BASE_URL}/grades`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // 타임아웃 무시
    });
  },

  /**
   * 성적 항목 개수 조회
   */
  async getGradeCount(page: Page) {
    const grades = page.locator('[class*="grade"]');
    return await grades.count();
  },

  /**
   * 강좌별 성적 조회
   */
  async getCourseGrades(page: Page) {
    const courseGrades = page.locator('text=/강좌|course/i');
    return await courseGrades.count();
  },

  /**
   * 성적 상세 조회
   */
  async openGradeDetail(page: Page) {
    const gradeLink = page.locator('a, button').filter({
      has: page.locator('text=/성적|grade/i'),
    }).first();

    if ((await gradeLink.count()) > 0) {
      await gradeLink.click();
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 성적 점수 추출
   */
  async getScore(page: Page) {
    const scoreElement = page.locator('text=/\\d+(\\.\\d+)?\\s*(점|\/100|%)?/');

    if ((await scoreElement.count()) > 0) {
      const text = await scoreElement.first().textContent();
      return text;
    }

    return null;
  },

  /**
   * 피드백 확인
   */
  async getFeedback(page: Page) {
    const feedbackElement = page.locator(
      'text=/피드백|feedback|코멘트|comment/i'
    );

    if ((await feedbackElement.count()) > 0) {
      const text = await feedbackElement.first().textContent();
      return text;
    }

    return null;
  },

  /**
   * 강좌별 성적 통계 (평균, 최고점 등)
   */
  async getCourseStatistics(page: Page) {
    const stats = page.locator('text=/평균|최고|최저|average|highest|lowest/i');

    if ((await stats.count()) > 0) {
      const text = await stats.first().textContent();
      return text;
    }

    return null;
  },
};

/**
 * 네비게이션 관련 헬퍼
 */
export const NavigationHelper = {
  /**
   * 메인 메뉴 링크 확인
   */
  async getMainMenuLinks(page: Page) {
    const menuLinks = page.locator('[role="navigation"] a, nav a');
    return await menuLinks.count();
  },

  /**
   * 특정 페이지로 네비게이션
   */
  async goToPage(
    page: Page,
    pageName: string
  ) {
    const pageLinks: Record<string, string> = {
      dashboard: '/dashboard',
      courses: '/courses',
      'explore-courses': '/explore-courses',
      'my-assignments': '/my-assignments',
      grades: '/grades',
    };

    const path = pageLinks[pageName.toLowerCase()];

    if (path) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle', {
        timeout: 5000,
      }).catch(() => {
        // 타임아웃 무시
      });
      return true;
    }

    return false;
  },

  /**
   * 로그아웃
   */
  async logout(page: Page) {
    const logoutButton = page.locator(
      'button:has-text(/로그아웃|logout|sign out/i)'
    );

    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(1000);
      return true;
    }

    return false;
  },

  /**
   * 프로필 메뉴 열기
   */
  async openProfileMenu(page: Page) {
    const profileMenu = page.locator('button, [class*="profile"]').filter({
      has: page.locator('text=/프로필|profile|사용자|user/i'),
    }).first();

    if ((await profileMenu.count()) > 0) {
      await profileMenu.click();
      await page.waitForTimeout(500);
      return true;
    }

    return false;
  },
};

/**
 * 검증 헬퍼
 */
export const ValidationHelper = {
  /**
   * 페이지가 로드되었는지 확인
   */
  async isPageLoaded(page: Page, timeout = 5000) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 에러 메시지 확인
   */
  async hasErrorMessage(page: Page) {
    const errorMessage = page.locator(
      'text=/오류|에러|error|실패|failed/i'
    );
    return (await errorMessage.count()) > 0;
  },

  /**
   * 성공 메시지 확인
   */
  async hasSuccessMessage(page: Page) {
    const successMessage = page.locator(
      'text=/성공|완료|success|complete/i'
    );
    return (await successMessage.count()) > 0;
  },

  /**
   * 특정 텍스트 포함 여부 확인
   */
  async hasText(page: Page, text: string) {
    const element = page.locator(`text=${text}`);
    return (await element.count()) > 0;
  },

  /**
   * 페이지 제목 확인
   */
  async getPageTitle(page: Page) {
    return await page.title();
  },

  /**
   * URL 확인
   */
  async getPageUrl(page: Page) {
    return page.url();
  },

  /**
   * 로딩 인디케이터 확인
   */
  async isLoading(page: Page) {
    const loadingIndicator = page.locator(
      '[class*="loading"], [class*="spinner"], .loader'
    );
    return (await loadingIndicator.count()) > 0;
  },

  /**
   * 데이터가 있는지 확인
   */
  async hasData(page: Page) {
    const mainContent = page.locator('[role="main"]');
    return (await mainContent.count()) > 0 && (await page.content()).length > 100;
  },
};

/**
 * 성능 관련 헬퍼
 */
export const PerformanceHelper = {
  /**
   * 페이지 로드 시간 측정
   */
  async measurePageLoadTime(page: Page, path: string) {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(
      () => {
        // 타임아웃 무시
      }
    );

    return Date.now() - startTime;
  },

  /**
   * 여러 페이지 로드 시간 측정
   */
  async measureMultiplePageLoadTimes(page: Page, paths: string[]) {
    const results: Record<string, number> = {};

    for (const path of paths) {
      results[path] = await this.measurePageLoadTime(page, path);
    }

    return results;
  },

  /**
   * 성능 메트릭 출력
   */
  printPerformanceMetrics(metrics: Record<string, number>) {
    console.log('\n=== 성능 메트릭 ===');

    for (const [page, time] of Object.entries(metrics)) {
      console.log(`${page}: ${time}ms`);
    }

    const avgTime =
      Object.values(metrics).reduce((a, b) => a + b, 0) /
      Object.keys(metrics).length;

    console.log(`평균: ${Math.round(avgTime)}ms`);
    console.log('==================\n');
  },
};
