'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface Difficulty {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface MetadataManagementProps {
  categories: Category[];
  difficulties: Difficulty[];
  onCategoryDeactivate: (id: number) => void;
  onDifficultyDeactivate: (id: number) => void;
  onCategoryCreate: (name: string, description?: string) => void;
  onDifficultyCreate: (name: string, description?: string, sort_order?: number) => void;
}

const MetadataManagement: React.FC<MetadataManagementProps> = ({ 
  categories, 
  difficulties,
  onCategoryDeactivate,
  onDifficultyDeactivate,
  onCategoryCreate,
  onDifficultyCreate
}) => {
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryDescription, setNewCategoryDescription] = React.useState('');
  const [newDifficultyName, setNewDifficultyName] = React.useState('');
  const [newDifficultyDescription, setNewDifficultyDescription] = React.useState('');
  const [newDifficultyOrder, setNewDifficultyOrder] = React.useState('0');

  const handleCategoryCreate = () => {
    if (newCategoryName.trim()) {
      onCategoryCreate(newCategoryName, newCategoryDescription || undefined);
      setNewCategoryName('');
      setNewCategoryDescription('');
    }
  };

  const handleDifficultyCreate = () => {
    if (newDifficultyName.trim()) {
      onDifficultyCreate(newDifficultyName, newDifficultyDescription || undefined, parseInt(newDifficultyOrder));
      setNewDifficultyName('');
      setNewDifficultyDescription('');
      setNewDifficultyOrder('0');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">메타데이터 관리</h2>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="difficulties">난이도</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>카테고리 목록</CardTitle>
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
              <Button onClick={handleCategoryCreate}>카테고리 추가</Button>
              
              <Table className="mt-4">
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onCategoryDeactivate(category.id)}
                          >
                            비활성화
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulties">
          <Card>
            <CardHeader>
              <CardTitle>난이도 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="difficultyName">난이도 이름</Label>
                  <Input
                    id="difficultyName"
                    value={newDifficultyName}
                    onChange={(e) => setNewDifficultyName(e.target.value)}
                    placeholder="난이도 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficultyDescription">설명</Label>
                  <Input
                    id="difficultyDescription"
                    value={newDifficultyDescription}
                    onChange={(e) => setNewDifficultyDescription(e.target.value)}
                    placeholder="설명 (선택)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficultyOrder">순서</Label>
                  <Input
                    id="difficultyOrder"
                    type="number"
                    value={newDifficultyOrder}
                    onChange={(e) => setNewDifficultyOrder(e.target.value)}
                    placeholder="순서 (기본: 0)"
                  />
                </div>
              </div>
              <Button onClick={handleDifficultyCreate}>난이도 추가</Button>
              
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>순서</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {difficulties.map((difficulty) => (
                    <TableRow key={difficulty.id}>
                      <TableCell>{difficulty.id}</TableCell>
                      <TableCell>{difficulty.name}</TableCell>
                      <TableCell>{difficulty.description || '-'}</TableCell>
                      <TableCell>{difficulty.sort_order}</TableCell>
                      <TableCell>
                        <Badge variant={difficulty.is_active ? 'default' : 'secondary'}>
                          {difficulty.is_active ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(difficulty.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {!difficulty.is_active ? (
                          <span className="text-gray-500">비활성화됨</span>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onDifficultyDeactivate(difficulty.id)}
                          >
                            비활성화
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MetadataManagement;