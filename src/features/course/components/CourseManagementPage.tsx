'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstructorCoursesQuery } from '../hooks/useInstructorCoursesQuery';
import { useCreateCourseMutation } from '../hooks/useCreateCourseMutation';
import { useUpdateCourseMutation } from '../hooks/useUpdateCourseMutation';
import { useUpdateCourseStatusMutation } from '../hooks/useUpdateCourseStatusMutation';
import { useDeleteCourseMutation } from '../hooks/useDeleteCourseMutation';
import { useActiveMetadataQuery } from '../hooks/useActiveMetadataQuery';
import CourseListInstructor from '../components/CourseListInstructor';
import CourseForm from '../components/CourseForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CourseManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  // Fetch instructor's courses
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrorMessage,
    refetch: refetchCourses
  } = useInstructorCoursesQuery();
  
  // Fetch categories and difficulties
  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
    error: metadataErrorMessage
  } = useActiveMetadataQuery();
  
  // Mutations
  const createCourseMutation = useCreateCourseMutation();
  const updateCourseMutation = useUpdateCourseMutation();
  const updateStatusMutation = useUpdateCourseStatusMutation();
  const deleteCourseMutation = useDeleteCourseMutation();
  
  // Derived data
  const courses = coursesData?.courses || [];
  const categories = metadata?.categories || [];
  const difficulties = metadata?.difficulties || [];
  
  // Handle form submission for creating/updating courses
  const handleFormSubmit = async (data: { 
    title: string; 
    description?: string; 
    category_id?: number | null; 
    difficulty_id?: number | null;
  }) => {
    if (editingCourseId) {
      // Update existing course
      await updateCourseMutation.mutateAsync({
        courseId: editingCourseId,
        data
      });
      setEditingCourseId(null);
      setActiveTab('list');
    } else {
      // Create new course
      await createCourseMutation.mutateAsync(data);
      setActiveTab('list');
    }
  };
  
  // Handle cancel form
  const handleFormCancel = () => {
    setEditingCourseId(null);
    setActiveTab('list');
  };
  
  // Handle course status change
  const handleStatusChange = (courseId: string, newStatus: 'draft' | 'published' | 'archived') => {
    updateStatusMutation.mutate({
      courseId,
      data: { status: newStatus }
    });
  };
  
  // Handle course deletion
  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteCourseMutation.mutate(courseId);
    }
  };
  
  // Handle edit course
  const handleEditCourse = (courseId: string) => {
    setEditingCourseId(courseId);
    setActiveTab('create');
  };
  
  // Handle view course
  const handleViewCourse = (courseId: string) => {
    // For now, we'll just show an alert
    // In a real implementation, this would navigate to the course detail page
    alert(`Viewing course: ${courseId}`);
  };
  
  // Loading state when metadata is loading
  if (metadataLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  // Error state when metadata fails to load
  if (metadataError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {metadataErrorMessage?.message || 'Failed to load course metadata. Please try again later.'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground mt-2">
          Create, edit, and manage your courses
        </p>
      </div>
      
      {coursesError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {coursesErrorMessage?.message || 'Failed to load courses. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {createCourseMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createCourseMutation.error?.message || 'Failed to create course. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {updateCourseMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {updateCourseMutation.error?.message || 'Failed to update course. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {updateStatusMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {updateStatusMutation.error?.message || 'Failed to update course status. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      {deleteCourseMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {deleteCourseMutation.error?.message || 'Failed to delete course. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'list' | 'create')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">My Courses</TabsTrigger>
          <TabsTrigger value="create">{editingCourseId ? 'Edit Course' : 'Create New'}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6 mt-6">
          <CourseListInstructor
            courses={courses}
            loading={coursesLoading}
            onCourseEdit={handleEditCourse}
            onCourseView={handleViewCourse}
            onCourseStatusChange={handleStatusChange}
            onAddNewCourse={() => {
              setEditingCourseId(null);
              setActiveTab('create');
            }}
          />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingCourseId ? 'Edit Course' : 'Create New Course'}</CardTitle>
              <CardDescription>
                {editingCourseId
                  ? 'Update your course details below'
                  : 'Fill in the details for your new course'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm
                course={editingCourseId ? courses.find(c => c.id === editingCourseId) : undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                loading={createCourseMutation.isPending || updateCourseMutation.isPending}
                error={
                  createCourseMutation.isError 
                    ? createCourseMutation.error?.message 
                    : updateCourseMutation.isError 
                      ? updateCourseMutation.error?.message 
                      : undefined
                }
                categories={categories}
                difficulties={difficulties}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseManagementPage;