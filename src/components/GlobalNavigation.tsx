'use client';

import { useEffect, useState } from 'react';
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
import { Home, BookOpen, ClipboardList, LogOut, User, Menu, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalNavigation() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return null;
  }

  // 인증되지 않은 사용자는 네비게이션 표시 안 함
  if (!user) {
    return null;
  }

  // 경로를 기반으로 사용자 역할 판단
  // instructor-dashboard, courses, 과제관리 등의 경로에 접근 가능한 사용자 = 강사
  const isInstructor = pathname.includes('instructor-dashboard') || 
                       pathname.includes('/courses') || 
                       pathname.includes('/grades');

  // 강사만 네비게이션 표시
  if (!isInstructor) {
    return null;
  }

  const getRoleLabel = () => '강사';

  const getRoleColor = () => 'bg-blue-100 text-blue-800';

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
          <div className="hidden md:flex items-center gap-8">
            {/* 메뉴 1 - 홈 */}
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

            {/* 메뉴 2 - 대시보드 */}
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

            {/* 메뉴 3 - 코스관리 */}
            <Link
              href="/courses"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                pathname.startsWith('/courses')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <BookOpen className="h-4 w-4" />
              코스관리
            </Link>

            {/* 메뉴 4 - 과제관리 */}
            <Link
              href="/courses/assignments"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                pathname === '/courses/assignments' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Award className="h-4 w-4" />
              과제관리
            </Link>
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center gap-3">
            {/* 역할 배지 */}
            <div className={cn('px-3 py-1.5 rounded-full text-xs font-medium', getRoleColor())}>
              {getRoleLabel()}
            </div>

            {/* 사용자 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{user?.email || '사용자'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2 border-b">
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">역할: {getRoleLabel()}</p>
                </div>
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      홈
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* 대시보드 */}
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/instructor-dashboard"
                      className="flex items-center gap-2"
                    >
                      <ClipboardList className="h-4 w-4" />
                      대시보드
                    </Link>
                  </DropdownMenuItem>

                  {/* 코스관리 */}
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/courses"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      코스관리
                    </Link>
                  </DropdownMenuItem>

                  {/* 과제관리 */}
                  <DropdownMenuItem asChild>
                    <Link href="/courses/assignments" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      과제관리
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
