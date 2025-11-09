'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, BookOpen, ClipboardList, LogOut, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalNavigation() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return null;
  }

  // 인증되지 않은 사용자는 네비게이션 표시 안 함
  if (!user) {
    return null;
  }

  const isInstructor = user.role === 'instructor';
  const isOperator = user.role === 'operator';
  const isLearner = user.role === 'learner';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고/홈 */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <BookOpen className="h-5 w-5" />
            <span>LMS</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-6">
            {/* 공통 메뉴 */}
            <Link
              href="/"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Home className="h-4 w-4" />
              홈
            </Link>

            {/* 강사 메뉴 */}
            {isInstructor && (
              <>
                <Link
                  href="/instructor-dashboard"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === '/instructor-dashboard'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  대시보드
                </Link>
                <Link
                  href="/courses"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname.startsWith('/courses') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  코스
                </Link>
                <Link
                  href="/courses/assignments"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === '/courses/assignments'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  모든 과제
                </Link>
              </>
            )}

            {/* 학습자 메뉴 */}
            {isLearner && (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  대시보드
                </Link>
                <Link
                  href="/explore-courses"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === '/explore-courses'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  강의 둘러보기
                </Link>
              </>
            )}

            {/* 운영자 메뉴 */}
            {isOperator && (
              <>
                <Link
                  href="/operator-dashboard"
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors',
                    pathname === '/operator-dashboard'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  관리자 대시보드
                </Link>
              </>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name || '사용자'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 모바일 메뉴 */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      홈
                    </Link>
                  </DropdownMenuItem>

                  {isInstructor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/instructor-dashboard" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          대시보드
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/courses" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          코스
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/courses/assignments" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          모든 과제
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isLearner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          대시보드
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/explore-courses" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          강의 둘러보기
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isOperator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/operator-dashboard" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          관리자 대시보드
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

