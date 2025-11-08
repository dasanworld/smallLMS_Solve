'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Difficulty {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface DifficultyManagementProps {
  difficulties: Difficulty[];
  onDifficultyCreate: (name: string, description?: string, sort_order?: number) => void;
  onDifficultyUpdate: (id: number, name: string, description?: string, sort_order?: number) => void;
  onDifficultyDeactivate: (id: number) => void;
}

const DifficultyManagement: React.FC<DifficultyManagementProps> = ({ 
  difficulties, 
  onDifficultyCreate,
  onDifficultyUpdate,
  onDifficultyDeactivate
}) => {
  const [newDifficultyName, setNewDifficultyName] = React.useState('');
  const [newDifficultyDescription, setNewDifficultyDescription] = React.useState('');
  const [newDifficultyOrder, setNewDifficultyOrder] = React.useState('0');

  const handleCreateDifficulty = () => {
    if (newDifficultyName.trim()) {
      onDifficultyCreate(newDifficultyName, newDifficultyDescription || undefined, parseInt(newDifficultyOrder));
      setNewDifficultyName('');
      setNewDifficultyDescription('');
      setNewDifficultyOrder('0');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">난이도 관리</h2>

      <Card>
        <CardHeader>
          <CardTitle>난이도 추가</CardTitle>
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
          <Button onClick={handleCreateDifficulty}>난이도 추가</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>난이도 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
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
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDifficultyDeactivate(difficulty.id)}
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

export default DifficultyManagement;