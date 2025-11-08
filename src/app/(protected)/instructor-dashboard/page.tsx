'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import InstructorDashboard from '@/features/dashboard/components/InstructorDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const session = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user role from the backend or user profile
        // This would typically come from the session or a separate API call
        const userId = session.user.id;
        
        // In a real implementation, we would fetch the user's role from the backend
        // For now, we'll simulate fetching the role
        // You might have a profiles table in Supabase with user roles
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
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
          // If we can't get the user profile, we'll still show the dashboard
          // but with a warning that role couldn't be determined
          console.warn('Could not fetch user profile');
          setUserRole('unknown');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('unknown');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [session, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
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