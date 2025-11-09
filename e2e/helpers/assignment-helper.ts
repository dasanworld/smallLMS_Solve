import { Page, expect } from '@playwright/test';

/**
 * 과제 관련 헬퍼 함수
 * 과제 생성, 수정, 상태 관리 등의 기능을 간소화합니다.
 */

export interface CreateAssignmentOptions {
  courseId: string;
  title: string;
  description: string;
  dueDate?: string; // ISO 8601 형식 또는 datetime-local 형식
  pointsWeight?: number;
  allowLate?: boolean;
  allowResubmission?: boolean;
}

/**
 * 과제 생성 (강사용)
 */
export async function createAssignment(page: Page, options: CreateAssignmentOptions): Promise<string> {
  // 과제 생성 페이지로 이동
  await page.goto(`/courses/${options.courseId}/assignments/new`);

  // 제목 입력
  const titleInput = page.locator('input[name="title"], input[placeholder*="제목"]').first();
  await titleInput.fill(options.title);

  // 설명 입력
  const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="설명"]').first();
  await descriptionInput.fill(options.description);

  // 마감일 입력 (있는 경우)
  if (options.dueDate) {
    const dueDateInput = page.locator('input[name="dueDate"], input[type="datetime-local"]').first();
    if (await dueDateInput.count() > 0) {
      // ISO 8601을 datetime-local 형식으로 변환
      const date = new Date(options.dueDate);
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      await dueDateInput.fill(localDate);
    }
  }

  // 점수 배점 입력 (있는 경우)
  if (options.pointsWeight !== undefined) {
    const pointsInput = page.locator('input[name="pointsWeight"], input[name="points"], input[type="number"]').first();
    if (await pointsInput.count() > 0) {
      await pointsInput.fill(String(options.pointsWeight));
    }
  }

  // 지각 제출 허용 체크박스 (있는 경우)
  if (options.allowLate !== undefined) {
    const allowLateCheckbox = page.locator('input[name="allowLate"], input[type="checkbox"]').first();
    if (await allowLateCheckbox.count() > 0) {
      const isChecked = await allowLateCheckbox.isChecked();
      if (options.allowLate !== isChecked) {
        await allowLateCheckbox.click();
      }
    }
  }

  // 재제출 허용 체크박스 (있는 경우)
  if (options.allowResubmission !== undefined) {
    const allowResubmissionCheckbox = page.locator('input[name="allowResubmission"]').first();
    if (await allowResubmissionCheckbox.count() > 0) {
      const isChecked = await allowResubmissionCheckbox.isChecked();
      if (options.allowResubmission !== isChecked) {
        await allowResubmissionCheckbox.click();
      }
    }
  }

  // 생성 버튼 클릭
  await page.click('button:has-text("생성"), button:has-text("저장"), button[type="submit"]');

  // 과제 목록 페이지로 리다이렉트 대기
  await page.waitForURL(`/courses/${options.courseId}/assignments`, { timeout: 10000 });

  // URL에서 과제 ID 추출 (과제 상세 페이지로 이동한 경우)
  const url = page.url();
  const match = url.match(/\/assignments\/([^/]+)/);
  return match ? match[1] : '';
}

/**
 * 과제 수정 (강사용)
 */
export async function updateAssignment(
  page: Page,
  courseId: string,
  assignmentId: string,
  updates: Partial<CreateAssignmentOptions>
): Promise<void> {
  // 과제 수정 페이지로 이동
  await page.goto(`/courses/${courseId}/assignments/${assignmentId}/edit`);

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

  // 마감일 수정
  if (updates.dueDate) {
    const dueDateInput = page.locator('input[name="dueDate"], input[type="datetime-local"]').first();
    if (await dueDateInput.count() > 0) {
      const date = new Date(updates.dueDate);
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      await dueDateInput.fill(localDate);
    }
  }

  // 저장 버튼 클릭
  await page.click('button:has-text("저장"), button:has-text("수정"), button[type="submit"]');

  // 과제 상세 페이지로 리다이렉트 대기
  await page.waitForURL(`/courses/${courseId}/assignments/${assignmentId}`, { timeout: 10000 });
}

/**
 * 과제 상태 변경: Draft → Published
 */
export async function publishAssignment(page: Page, courseId: string, assignmentId: string): Promise<void> {
  // 과제 상세 페이지로 이동
  await page.goto(`/courses/${courseId}/assignments/${assignmentId}`);

  // 발행 버튼 클릭
  const publishButton = page.locator('button:has-text("발행"), button:has-text("Publish")').first();
  
  if (await publishButton.count() > 0) {
    await publishButton.click();
    await page.waitForTimeout(1000);
    
    // 상태가 "발행"으로 변경되었는지 확인
    await expect(page.locator('text=발행, badge:has-text("발행")').first()).toBeVisible({ timeout: 5000 });
  }
}

/**
 * 과제 상태 변경: Published → Closed
 */
export async function closeAssignment(page: Page, courseId: string, assignmentId: string): Promise<void> {
  // 과제 상세 페이지로 이동
  await page.goto(`/courses/${courseId}/assignments/${assignmentId}`);

  // 마감 버튼 클릭
  const closeButton = page.locator('button:has-text("마감"), button:has-text("Close")').first();
  
  if (await closeButton.count() > 0) {
    await closeButton.click();
    await page.waitForTimeout(1000);
    
    // 상태가 "마감"으로 변경되었는지 확인
    await expect(page.locator('text=마감, badge:has-text("마감")').first()).toBeVisible({ timeout: 5000 });
  }
}

/**
 * 과제 삭제 (강사용)
 */
export async function deleteAssignment(page: Page, courseId: string, assignmentId: string): Promise<void> {
  // 과제 상세 페이지로 이동
  await page.goto(`/courses/${courseId}/assignments/${assignmentId}`);

  // 삭제 버튼 클릭
  const deleteButton = page.locator('button:has-text("삭제"), button:has-text("Delete")').first();
  
  if (await deleteButton.count() > 0) {
    await deleteButton.click();
    
    // 확인 다이얼로그 처리
    const confirmButton = page.locator('button:has-text("확인"), button:has-text("삭제")').first();
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }
    
    // 과제 목록 페이지로 리다이렉트 대기
    await page.waitForURL(`/courses/${courseId}/assignments`, { timeout: 10000 });
  }
}

/**
 * 과제 목록에서 특정 과제 찾기
 */
export async function findAssignmentCard(page: Page, assignmentTitle: string): Promise<boolean> {
  const assignmentCard = page.locator(`text=${assignmentTitle}`).first();
  return (await assignmentCard.count()) > 0;
}

/**
 * 과제 상세 정보 확인
 */
export async function verifyAssignmentDetails(
  page: Page,
  courseId: string,
  assignmentId: string,
  expectedTitle?: string,
  expectedDescription?: string
): Promise<void> {
  await page.goto(`/courses/${courseId}/assignments/${assignmentId}`);

  if (expectedTitle) {
    await expect(page.locator(`text=${expectedTitle}`).first()).toBeVisible();
  }

  if (expectedDescription) {
    await expect(page.locator(`text=${expectedDescription}`).first()).toBeVisible();
  }
}

