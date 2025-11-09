'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, BookOpen, ClipboardList, LogOut, User, Menu, Award, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfileResponse } from '@/features/auth/backend/profile-service';

type UserRole = 'instructor' | 'learner' | 'operator';

export function GlobalNavigation() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // 사용자 프로필 조회 (role 포함)
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfileResponse | null>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await apiClient.get<UserProfileResponse>('/api/auth/profile');
        return response.data;
      } catch (err) {
        console.error('프로필 조회 실패:', extractApiErrorMessage(err, 'Failed to fetch profile'));
        return null;
      }
    },
    enabled: !!user?.id && mounted,
    retry: 1,
  });

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

  // 프로필이 로딩 중이면 표시하지 않음
  if (profileLoading || !profile) {
    return null;
  }

  const userRole = (profile.role as UserRole) || 'learner';

  // 역할별 네비게이션 메뉴 설정
  const getMenuItems = () => {
    switch (userRole) {
      case 'instructor':
        return [
          { label: '홈', href: '/', icon: 'home' },
          { label: '대시보드', href: '/instructor-dashboard', icon: 'clipboard' },
          { label: '코스관리', href: '/courses', icon: 'book' },
          { label: '과제관리', href: '/courses/assignments', icon: 'award' },
        ];
      case 'operator':
        return [
          { label: '홈', href: '/', icon: 'home' },
          { label: '대시보드', href: '/operator-dashboard', icon: 'clipboard' },
          { label: '통계', href: '/operator/statistics', icon: 'chart' },
        ];
      case 'learner':
      default:
        return [
          { label: '홈', href: '/', icon: 'home' },
          { label: '대시보드', href: '/dashboard', icon: 'clipboard' },
          { label: '강의 탐색', href: '/explore-courses', icon: 'book' },
        ];
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'instructor':
        return '강사';
      case 'operator':
        return '운영자';
      case 'learner':
      default:
        return '러너';
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-purple-100 text-purple-800';
      case 'learner':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const menuItems = getMenuItems();
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getIcon = (iconName: string) => {
    const iconProps = { className: 'h-4 w-4' };
    switch (iconName) {
      case 'home':
        return <Home {...iconProps} />;
      case 'clipboard':
        return <ClipboardList {...iconProps} />;
      case 'book':
        return <BookOpen {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'chart':
        return <BarChart3 {...iconProps} />;
      default:
        return null;
    }
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
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {getIcon(item.icon)}
                {item.label}
              </Link>
            ))}
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
                  <p className="text-xs font-medium text-gray-700">{profile?.name || '사용자'}</p>
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
                  {menuItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        {getIcon(item.icon)}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
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
