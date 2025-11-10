import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/constants/env";
import {
  LOGIN_PATH,
  isAuthEntryPath,
  shouldProtectPath,
} from "@/constants/auth";
import { match } from "ts-pattern";

const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
    });
  });

  return to;
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 리다이렉트 정책 (docs/REDIRECT_POLICY.md 참고):
  // 1. 비로그인 사용자가 보호된 경로 접근 → /login?redirectedFrom=[originalPath]
  // 2. 비로그인 사용자가 공개 경로 접근 → 그대로 진행
  // 3. 로그인 사용자 → 페이지 단계의 역할 검증으로 진행 (pages에서 처리)
  const decision = match({ user, pathname: request.nextUrl.pathname })
    .when(
      ({ user: currentUser, pathname }) =>
        !currentUser && shouldProtectPath(pathname),
      ({ pathname }) => {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = LOGIN_PATH;
        loginUrl.searchParams.set("redirectedFrom", pathname);

        return copyCookies(response, NextResponse.redirect(loginUrl));
      }
    )
    .otherwise(() => response);

  return decision;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
