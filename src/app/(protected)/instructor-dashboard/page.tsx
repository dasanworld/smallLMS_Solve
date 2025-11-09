'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstructorDashboard from '@/features/dashboard/components/InstructorDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Get authorization token from localStorage
        const token = localStorage.getItem('supabase.auth.token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user role from the backend
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserRole(profile.role);

          // If user is not an instructor, redirect to appropriate dashboard
          if (profile.role !== 'instructor') {
            router.push('/dashboard');
          }
        } else {
          setError('Could not fetch user profile');
          setUserRole('unknown');
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUserRole('unknown');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>An error occurred while loading your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole !== 'instructor') {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the instructor dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must be an instructor to access this page. Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <InstructorDashboard />
    </div>
  );
}
