import fs from 'fs';
import path from 'path';
import { Page, type StorageState } from '@playwright/test';

export type UserRole = 'instructor' | 'learner';

export interface StoredToken {
  role: UserRole;
  raw: string;
  accessToken: string;
  email?: string;
  name?: string;
  updatedAt: string;
  storageState?: StorageState;
}

interface TokenStoreFile {
  [role: string]: StoredToken;
}

const TOKEN_STORE_PATH = path.resolve(__dirname, '../token-store.json');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function ensureStoreFile() {
  const dir = path.dirname(TOKEN_STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(TOKEN_STORE_PATH)) {
    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
}

function readStore(): TokenStoreFile {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(TOKEN_STORE_PATH, 'utf-8');
    return raw ? (JSON.parse(raw) as TokenStoreFile) : {};
  } catch {
    return {};
  }
}

function writeStore(store: TokenStoreFile) {
  ensureStoreFile();
  fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function normaliseAccessToken(rawValue: unknown): string {
  if (typeof rawValue === 'string') {
    return rawValue;
  }

  if (rawValue && typeof rawValue === 'object' && 'access_token' in rawValue) {
    const candidate = (rawValue as Record<string, unknown>).access_token;
    return typeof candidate === 'string' ? candidate : '';
  }

  return '';
}

export class TokenManager {
  static async extractToken(page: Page): Promise<Pick<StoredToken, 'raw' | 'accessToken'> | null> {
    const rawToken = await page.evaluate(() => {
      return window.localStorage.getItem('supabase.auth.token') || null;
    });

    if (!rawToken) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawToken);
      const directAccess = normaliseAccessToken(parsed);
      const nestedAccess = parsed?.currentSession?.access_token ?? parsed?.access_token ?? '';
      const accessToken = directAccess || (typeof nestedAccess === 'string' ? nestedAccess : '');

      if (!accessToken) {
        return null;
      }

      return {
        raw: rawToken,
        accessToken,
      };
    } catch (error) {
      console.warn('[TokenManager] Failed to parse Supabase token from localStorage', error);
      return null;
    }
  }

  static async saveToken(
    role: UserRole,
    token: Pick<StoredToken, 'raw' | 'accessToken'>,
    storageState?: StorageState,
    metadata?: { email?: string; name?: string }
  ) {
    const store = readStore();

    store[role] = {
      role,
      raw: token.raw,
      accessToken: token.accessToken,
      email: metadata?.email,
      name: metadata?.name,
      updatedAt: new Date().toISOString(),
      storageState,
    };

    writeStore(store);
  }

  static loadToken(role: UserRole): StoredToken | null {
    const store = readStore();
    return store[role] || null;
  }

  static clearToken(role: UserRole) {
    const store = readStore();
    if (store[role]) {
      delete store[role];
      writeStore(store);
    }
  }

  static clearAll() {
    writeStore({});
  }

  static async validateToken(page: Page, stored: StoredToken): Promise<boolean> {
    if (!stored?.accessToken) {
      return false;
    }

    try {
      const response = await page.request.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${stored.accessToken}`,
        },
      });

      return response.ok();
    } catch (error) {
      console.warn('[TokenManager] Failed to validate token', error);
      return false;
    }
  }

  static async restoreSession(page: Page, stored: StoredToken) {
    if (!stored?.raw) {
      return;
    }

    await page.addInitScript((rawValue) => {
      window.localStorage.setItem('supabase.auth.token', rawValue);
    }, stored.raw);

    if (stored.storageState) {
      const { cookies = [], origins = [] } = stored.storageState;

      if (cookies.length > 0) {
        await page.context().addCookies(cookies);
      }

      if (origins.length > 0) {
        await page.addInitScript((originEntries) => {
          const currentOrigin = window.location.origin;
          originEntries
            .filter((entry: { origin: string }) => entry.origin === currentOrigin)
            .forEach((entry: { localStorage: { name: string; value: string }[] }) => {
              entry.localStorage.forEach(({ name, value }) => {
                window.localStorage.setItem(name, value);
              });
            });
        }, origins);
      }
    }
  }
}

