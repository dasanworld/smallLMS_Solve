import { Page, expect } from '@playwright/test';

/**
 * 강의 관련 헬퍼 함수
 * 강의 생성, 조회, 수정, 수강신청 등의 기능을 간소화합니다.
 */

export interface CreateCourseOptions {
  title: string;
  description: string;
  categoryId?: number;
  difficultyId?: number;
  status?: 'draft' | 'published';
}

/**
 * 강의 생성 (강사용)
 */
export async function createCourse(page: Page, options: CreateCourseOptions): Promise<string> {
  // 강의 생성 페이지로 이동
  await page.goto('/courses/new');

  // 제목 입력
  const titleInput = page.locator('input[name="title"], input[placeholder*="제목"]').first();
  await titleInput.fill(options.title);

  // 설명 입력
  const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="설명"]').first();
  await descriptionInput.fill(options.description);

  // 카테고리 선택 (있는 경우)
  if (options.categoryId) {
    const categorySelect = page.locator('select[name="category"], select[name="category_id"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption(String(options.categoryId));
    }
  }

  // 난이도 선택 (있는 경우)
  if (options.difficultyId) {
    const difficultySelect = page.locator('select[name="difficulty"], select[name="difficulty_id"]');
    if (await difficultySelect.count() > 0) {
      await difficultySelect.selectOption(String(options.difficultyId));
    }
  }

  // 저장 버튼 클릭
  await page.click('button:has-text("저장"), button:has-text("생성"), button[type="submit"]');

  // 강의 상세 페이지로 리다이렉트 대기
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 10000 });

  // URL에서 강의 ID 추출
  const url = page.url();
  const match = url.match(/\/courses\/([^/]+)/);
  return match ? match[1] : '';
}

/**
 * 강의 수강신청 (학습자용)
 */
export async function enrollInCourse(page: Page, courseId: string): Promise<void> {
  // 강의 상세 페이지로 이동
  await page.goto(`/explore-courses`);
  
  // 강의 카드에서 수강신청 버튼 찾기
  const enrollButton = page.locator(`[data-course-id="${courseId}"] button:has-text("수강신청"), button:has-text("수강신청")`).first();
  
  if (await enrollButton.count() === 0) {
    // 대체 방법: 강의 상세 페이지에서
    await page.goto(`/courses/${courseId}`);
    const enrollBtn = page.locator('button:has-text("수강신청")').first();
    await enrollBtn.click();
  } else {
    await enrollButton.click();
  }

  // 성공 메시지 또는 버튼 상태 변경 대기
  await page.waitForTimeout(1000);
  
  // 버튼이 "수강 중"으로 변경되었는지 확인
  await expect(page.locator('button:has-text("수강 중"), button:disabled:has-text("수강신청 완료")').first()).toBeVisible({ timeout: 5000 });
}

/**
 * 강의 수강신청 취소 (학습자용)
 */
export async function cancelEnrollment(page: Page, courseId: string): Promise<void> {
  // 대시보드 또는 강의 상세 페이지로 이동
  await page.goto('/dashboard');
  
  // 해당 강의의 취소 버튼 찾기
  const cancelButton = page.locator(`[data-course-id="${courseId}"] button:has-text("취소"), button:has-text("수강 취소")`).first();
  
  if (await cancelButton.count() > 0) {
    await cancelButton.click();
    
    // 확인 다이얼로그 처리 (있는 경우)
    const confirmButton = page.locator('button:has-text("확인"), button:has-text("취소")').first();
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }
    
    await page.waitForTimeout(1000);
  }
}

/**
 * 강의 발행 (강사용)
 */
export async function publishCourse(page: Page, courseId: string): Promise<void> {
  // 강의 상세 페이지로 이동
  await page.goto(`/courses/${courseId}`);
  
  // 발행 버튼 찾기
  const publishButton = page.locator('button:has-text("발행"), button:has-text("Publish")').first();
  
  if (await publishButton.count() > 0) {
    await publishButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * 강의 수정 (강사용)
 */
export async function updateCourse(page: Page, courseId: string, updates: Partial<CreateCourseOptions>): Promise<void> {
  // 강의 수정 페이지로 이동
  await page.goto(`/courses/${courseId}/edit`);

  // 제목 수정
  if (updates.title) {
    const titleInput = page.locator('input[name="title"]').first();
    await titleInput.clear();
    await titleInput.fill(updates.title);
  }

  // 설명 수정
  if (updates.description) {
    const descriptionInput = page.locator('textarea[name="description"]').first();
    await descriptionInput.clear();
    await descriptionInput.fill(updates.description);
  }

  // 저장 버튼 클릭
  await page.click('button:has-text("저장"), button:has-text("수정"), button[type="submit"]');

  // 강의 상세 페이지로 리다이렉트 대기
  await page.waitForURL(`/courses/${courseId}`, { timeout: 10000 });
}

/**
 * 강의 검색
 */
export async function searchCourses(page: Page, keyword: string): Promise<void> {
  await page.goto('/explore-courses');
  
  // 검색 입력 필드 찾기
  const searchInput = page.locator('input[name="search"], input[placeholder*="검색"], input[type="search"]').first();
  
  if (await searchInput.count() > 0) {
    await searchInput.fill(keyword);
    
    // 검색 버튼 클릭 또는 Enter 키 입력
    const searchButton = page.locator('button:has-text("검색"), button[type="submit"]').first();
    if (await searchButton.count() > 0) {
      await searchButton.click();
    } else {
      await searchInput.press('Enter');
    }
    
    await page.waitForTimeout(1000);
  }
}

/**
 * 강의 목록에서 특정 강의 찾기
 */
export async function findCourseCard(page: Page, courseTitle: string): Promise<boolean> {
  const courseCard = page.locator(`text=${courseTitle}`).first();
  return (await courseCard.count()) > 0;
}

