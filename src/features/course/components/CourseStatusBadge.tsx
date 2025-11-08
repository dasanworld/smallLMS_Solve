'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type CourseStatus = 'draft' | 'published' | 'archived';

interface CourseStatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const getStatusConfig = (status: CourseStatus) => {
    switch (status) {
      case 'draft':
        return {
          text: 'Draft',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
      case 'published':
        return {
          text: 'Published',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'archived':
        return {
          text: 'Archived',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          text: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.text}
    </span>
  );
};

export default CourseStatusBadge;