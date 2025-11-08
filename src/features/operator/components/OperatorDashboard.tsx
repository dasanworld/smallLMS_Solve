'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OperatorDashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">운영자 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/operator/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>신고 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p>신고된 콘텐츠 및 사용자 관리</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/operator/metadata">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>메타데이터 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p>카테고리 및 난이도 관리</p>
            </CardContent>
          </Card>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>대시보드 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <p>신고 수: 0건</p>
            <p>처리 대기: 0건</p>
            <p>카테고리: 0개</p>
            <p>난이도: 0개</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
        <p>최근 활동 내역이 없습니다.</p>
      </div>
    </div>
  );
};

export default OperatorDashboard;