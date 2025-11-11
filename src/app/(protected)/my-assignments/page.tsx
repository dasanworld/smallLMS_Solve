import type { Metadata } from 'next';
import LearnerAssignmentManagementPage from '@/features/assignment/components/LearnerAssignmentManagementPage';

export const metadata: Metadata = {
  title: '과제 관리',
  description: '학습자의 과제를 관리하는 페이지',
};

export default async function MyAssignmentsPage() {
  return <LearnerAssignmentManagementPage />;
}
