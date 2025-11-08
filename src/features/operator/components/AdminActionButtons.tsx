'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface AdminActionButtonsProps {
  onAction: (action: 'resolve' | 'escalate' | 'dismiss' | 'contact_user') => void;
}

const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({ onAction }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="default" 
        onClick={() => onAction('resolve')}
      >
        해결
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onAction('escalate')}
      >
        상위 보고
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onAction('dismiss')}
      >
        기각
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onAction('contact_user')}
      >
        사용자 연락
      </Button>
    </div>
  );
};

export default AdminActionButtons;