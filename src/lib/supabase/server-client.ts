import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = (await cookies()) as WritableCookieStore;

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Next.js 15 수정: Server Component (Layout/Page)에서는 쿠키를 수정할 수 없음
        // setAll 콜백에서 쿠키 설정 시도 시 에러가 발생하므로 조용히 무시
        // Supabase는 세션 갱신을 시도하지만, Server Component에서는 이를 처리할 수 없음
        setAll() {
          // 의도적으로 비워둠: Server Component에서 쿠키 수정 불가
          // 쿠키 갱신이 필요한 경우 Route Handler에서 처리해야 함
        },
      },
    }
  );
};
