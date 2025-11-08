'use client';

import React from 'react';
import MetadataManagement from '../components/MetadataManagement';
import { useMetadata } from '../hooks';

const MetadataManagementPage = () => {
  const { 
    categories, 
    difficulties, 
    loading, 
    error, 
    deactivateCategory, 
    deactivateDifficulty,
    createCategory,
    createDifficulty
  } = useMetadata();

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <MetadataManagement 
        categories={categories}
        difficulties={difficulties}
        onCategoryDeactivate={deactivateCategory}
        onDifficultyDeactivate={deactivateDifficulty}
        onCategoryCreate={createCategory}
        onDifficultyCreate={createDifficulty}
      />
    </div>
  );
};

export default MetadataManagementPage;