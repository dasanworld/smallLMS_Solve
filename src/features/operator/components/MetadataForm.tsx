'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetadataFormProps {
  type: 'category' | 'difficulty';
  onSubmit: (name: string, description?: string, sort_order?: number) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ type, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    if (type === 'difficulty') {
      onSubmit(name, description || undefined, parseInt(sortOrder));
    } else {
      onSubmit(name, description || undefined);
    }
    
    // Reset form
    setName('');
    setDescription('');
    setSortOrder('0');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === 'category' ? '카테고리' : '난이도'} 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{type === 'category' ? '카테고리' : '난이도'} 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${type === 'category' ? '카테고리' : '난이도'} 이름`}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
            />
          </div>
          
          {type === 'difficulty' && (
            <div className="space-y-2">
              <Label htmlFor="sortOrder">순서</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="순서 (기본: 0)"
              />
            </div>
          )}
          
          <Button type="submit">추가</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MetadataForm;