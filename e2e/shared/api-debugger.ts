import { type Page, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FetchOptions = Parameters<APIRequestContext['fetch']>[1];

export interface APICallResult<TData = unknown> {
  status: number;
  ok: boolean;
  data: TData | null;
  error?: string;
  rawBody?: string;
}

function buildUrl(url: string) {
  if (/^https?:/i.test(url)) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }

  return `${BASE_URL}/${url}`;
}

export class APIDebugger {
  static async callAndLog<T>(
    page: Page,
    method: HttpMethod,
    url: string,
    options: FetchOptions = {}
  ): Promise<APICallResult<T>> {
    const targetUrl = buildUrl(url);

    try {
      const response = await page.request.fetch(targetUrl, {
        method,
        ...options,
      });

      const status = response.status();
      const rawBody = await response.text();
      let parsed: T | null = null;

      try {
        parsed = rawBody ? (JSON.parse(rawBody) as T) : null;
      } catch {
        parsed = null;
      }

      if (!response.ok()) {
        console.warn(`[APIDebugger] ${method} ${targetUrl} failed`, {
          status,
          body: rawBody,
        });
      }

      return {
        status,
        ok: response.ok(),
        data: parsed,
        rawBody,
        error: response.ok() ? undefined : rawBody || 'Unknown error',
      };
    } catch (error) {
      console.error(`[APIDebugger] ${method} ${targetUrl} threw`, error);
      return {
        status: 0,
        ok: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static extractCourseId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const maybe = payload as Record<string, unknown>;

    const candidates = [
      maybe.courseId,
      maybe.course_id,
      maybe.id,
      maybe.course && (maybe.course as Record<string, unknown>).id,
      maybe.data && (maybe.data as Record<string, unknown>).id,
      maybe.data && (maybe.data as Record<string, unknown>).courseId,
      maybe.data && (maybe.data as Record<string, unknown>).course_id,
      maybe.data && (maybe.data as Record<string, unknown>).course && (maybe.data as Record<string, unknown>).course?.id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    return null;
  }

  static extractError(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const maybe = payload as Record<string, unknown>;

    if (typeof maybe.error === 'string') {
      return maybe.error;
    }

    if (typeof maybe.message === 'string') {
      return maybe.message;
    }

    if (typeof maybe.error === 'object' && maybe.error && 'message' in maybe.error) {
      const nested = (maybe.error as Record<string, unknown>).message;
      if (typeof nested === 'string') {
        return nested;
      }
    }

    return null;
  }

  static normalizeResponse<T>(result: APICallResult<T>) {
    return {
      status: result.status,
      ok: result.ok,
      data: result.data,
      error: result.error ?? null,
    };
  }
}
