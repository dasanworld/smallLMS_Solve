'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LogOut } from 'lucide-react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export const LandingHeader = () => {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace('/');
  }, [refresh, router]);

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="text-2xl font-bold text-slate-900">
          SmartLMS
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-slate-500">로딩 중...</span>
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                대시보드
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
