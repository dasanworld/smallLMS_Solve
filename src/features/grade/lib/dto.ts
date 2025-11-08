// Grade assignment interface
export interface GradeAssignment {
  id: string; // submission ID
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  courseId: string;
  courseTitle: string;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null; // ISO date string
  isLate: boolean;
  isResubmission: boolean;
  status: 'submitted' | 'graded' | 'resubmission_required';
  pointsWeight: number; // Assignment weight percentage
}

// Course total interface
export interface CourseTotal {
  courseId: string;
  courseTitle: string;
  totalScore: number | null; // Calculated based on weighted scores
  assignmentsCount: number;
  gradedCount: number;
}

// Main grade response interface
export interface GradeResponse {
  assignments: GradeAssignment[];
  courseTotals: CourseTotal[];
}

// Request interface for query parameters
export interface GetGradesRequest {
  limit?: number;
  offset?: number;
  courseId?: string;
}