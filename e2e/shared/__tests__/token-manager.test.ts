import { test, expect, type Page } from '@playwright/test';
import { TokenManager, type StoredToken } from '../token-manager';

const SAMPLE_TOKEN_PAYLOAD = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
};

const TEST_BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function seedLocalStorage(page: Page, payload = SAMPLE_TOKEN_PAYLOAD) {
  await page.goto(TEST_BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => {
    const now = Date.now();
    const stored = {
      currentSession: {
        access_token: value.access_token,
        refresh_token: value.refresh_token,
        expires_in: value.expires_in,
        token_type: value.token_type,
      },
      access_token: value.access_token,
      refresh_token: value.refresh_token,
      expires_at: now + value.expires_in * 1000,
    };

    window.localStorage.setItem('supabase.auth.token', JSON.stringify(stored));
  }, payload);
}

test.describe('TokenManager', () => {
  test.beforeEach(async () => {
    TokenManager.clearAll();
  });

  test('extractToken returns access token from localStorage', async ({ page }) => {
    await seedLocalStorage(page);

    const token = await TokenManager.extractToken(page);

    expect(token).not.toBeNull();
    expect(token?.accessToken).toBe(SAMPLE_TOKEN_PAYLOAD.access_token);
  expect(token?.raw).toBeTruthy();
  });

  test('restoreSession repopulates localStorage', async ({ page }) => {
    const fakeStored: StoredToken = {
      role: 'instructor',
      raw: JSON.stringify({ access_token: 'restored-token' }),
      accessToken: 'restored-token',
      updatedAt: new Date().toISOString(),
      storageState: {
        cookies: [],
        origins: [
          {
            origin: TEST_BASE_URL,
            localStorage: [
              { name: 'supabase.auth.token', value: JSON.stringify({ access_token: 'restored-token' }) },
            ],
          },
        ],
      },
    };

    await TokenManager.restoreSession(page, fakeStored);
    await page.goto(TEST_BASE_URL, { waitUntil: 'domcontentloaded' });

    const restored = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    expect(restored).not.toBeNull();
    expect(restored).toContain('restored-token');
  });
});
