'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface CategoryManagementProps {
  categories: Category[];
  onCategoryCreate: (name: string, description?: string) => void;
  onCategoryUpdate: (id: number, name: string, description?: string) => void;
  onCategoryDeactivate: (id: number) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDeactivate
}) => {
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryDescription, setNewCategoryDescription] = React.useState('');

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCategoryCreate(newCategoryName, newCategoryDescription || undefined);
      setNewCategoryName('');
      setNewCategoryDescription('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">카테고리 관리</h2>

      <Card>
        <CardHeader>
          <CardTitle>카테고리 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="categoryName">카테고리 이름</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">설명</Label>
              <Input
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="설명 (선택)"
              />
            </div>
          </div>
          <Button onClick={handleCreateCategory}>카테고리 추가</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {!category.is_active ? (
                      <span className="text-gray-500">비활성화됨</span>
                    ) : (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onCategoryDeactivate(category.id)}
                        >
                          비활성화
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;