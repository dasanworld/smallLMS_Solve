import { Page } from '@playwright/test';

/**
 * 페이지 상호작용을 위한 헬퍼 함수들
 */
export class PageHelper {
  constructor(private page: Page) {}

  /**
   * 특정 텍스트를 찾아 클릭
   */
  async clickByText(text: string) {
    await this.page.getByText(text, { exact: true }).click();
  }

  /**
   * 특정 텍스트를 찾아 입력 필드에 입력
   */
  async fillByLabel(label: string, value: string) {
    const field = this.page.getByLabel(label);
    await field.fill(value);
  }

  /**
   * 특정 테스트 ID를 가진 요소 선택
   */
  async getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  /**
   * 페이지가 특정 URL로 네비게이션될 때까지 대기
   */
  async waitForNavigation(url: string | RegExp) {
    await this.page.waitForURL(url);
  }

  /**
   * 특정 요소가 보이길 대기
   */
  async waitForVisible(selector: string) {
    await this.page.locator(selector).waitFor({ state: 'visible' });
  }

  /**
   * 특정 요소가 숨겨질 때까지 대기
   */
  async waitForHidden(selector: string) {
    await this.page.locator(selector).waitFor({ state: 'hidden' });
  }
}
