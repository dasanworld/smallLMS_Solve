'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssignmentFilterBarProps {
  courses: Array<{ id: string; title: string }>;
  selectedCourseId: string | null;
  onCourseChange: (courseId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function AssignmentFilterBar({
  courses,
  selectedCourseId,
  onCourseChange,
  searchQuery,
  onSearchChange,
}: AssignmentFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-end md:gap-3">
      {/* 코스 필터 */}
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">코스</label>
        <Select value={selectedCourseId || 'all'} onValueChange={(v) => onCourseChange(v === 'all' ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="모든 코스" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 코스</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 검색 */}
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">검색</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="과제명 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 초기화 버튼 */}
      {(selectedCourseId || searchQuery) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onCourseChange(null);
            onSearchChange('');
          }}
          className="self-end md:self-auto"
        >
          초기화
        </Button>
      )}
    </div>
  );
}
