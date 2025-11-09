import { APIRequestContext } from '@playwright/test';

/**
 * API 요청을 위한 헬퍼 함수들
 */
export class ApiHelper {
  private request: APIRequestContext;
  private baseURL: string;

  constructor(request: APIRequestContext, baseURL: string = 'http://localhost:3000') {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * GET 요청
   */
  async get(endpoint: string, options?: any) {
    return this.request.get(`${this.baseURL}${endpoint}`, options);
  }

  /**
   * POST 요청
   */
  async post(endpoint: string, options?: any) {
    return this.request.post(`${this.baseURL}${endpoint}`, options);
  }

  /**
   * PUT 요청
   */
  async put(endpoint: string, options?: any) {
    return this.request.put(`${this.baseURL}${endpoint}`, options);
  }

  /**
   * DELETE 요청
   */
  async delete(endpoint: string, options?: any) {
    return this.request.delete(`${this.baseURL}${endpoint}`, options);
  }

  /**
   * PATCH 요청
   */
  async patch(endpoint: string, options?: any) {
    return this.request.patch(`${this.baseURL}${endpoint}`, options);
  }
}
