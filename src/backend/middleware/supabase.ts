import { createMiddleware } from 'hono/factory';
import {
  contextKeys,
  type AppEnv,
  getAuthUser,
} from '@/backend/hono/context';
import { createServiceClient } from '@/backend/supabase/client';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    const client = createServiceClient(config.supabase);

    c.set(contextKeys.supabase, client);

    // ✅ Authorization 헤더에서 사용자 정보 추출 및 컨텍스트에 설정
    try {
      const user = await getAuthUser(c);
      if (user) {
        c.set(contextKeys.user, user);
      }
    } catch (error) {
      // 사용자 정보 추출 실패는 무시하고 계속 진행
      // (공개 엔드포인트가 있을 수 있음)
    }

    await next();
  });
