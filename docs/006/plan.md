# Grade & Feedback View Implementation Plan

## Overview
This document outlines the implementation plan for the Grade & Feedback View feature for Learners. The feature will allow learners to view their assignment grades, instructor feedback, and course totals calculated from assignment scores and weights.

## Architecture Overview
- Frontend: Next.js App Router with React components
- Backend: Hono API routes with Supabase integration
- Database: Supabase PostgreSQL with existing submissions table
- Authentication: Supabase auth with role-based access control using existing middleware

## Implementation Steps

### 1. Database Schema Review
The database already includes the necessary columns for grading:
- `submissions` table has `score`, `feedback`, `graded_at`, and `status` columns
- `assignments` table has `points_weight` for calculating course totals
- All tables support soft deletes with `deleted_at` columns
- Proper filtering with `WHERE deleted_at IS NULL` is required

### 2. Backend Implementation

#### 2.1 Create Grade Feature Directory Structure
- `src/features/grade/backend/schema.ts` - Zod schemas for API validation
- `src/features/grade/backend/service.ts` - Business logic for grade retrieval
- `src/features/grade/backend/route.ts` - Hono API routes
- `src/features/grade/backend/error.ts` - Error codes specific to grade feature

#### 2.2 Define API Response Schema
```typescript
// Grade response schema
const GradeAssignmentSchema = z.object({
  id: z.string(), // submission ID
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  assignmentDescription: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(), // ISO date string
  isLate: z.boolean(),
  isResubmission: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  pointsWeight: z.number().min(0).max(100) // Assignment weight percentage
});

// Course total schema
const CourseTotalSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  totalScore: z.number().min(0).max(100).nullable(), // Calculated based on weighted scores
  assignmentsCount: z.number(),
  gradedCount: z.number()
});

// Main grade response schema
const GradeResponseSchema = z.object({
  assignments: z.array(GradeAssignmentSchema),
  courseTotals: z.array(CourseTotalSchema)
});

// Request schema for query parameters
const GetGradesRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  courseId: z.string().optional()
});
```

#### 2.3 Define Error Codes
Create `src/features/grade/backend/error.ts` with:
```typescript
export const gradeErrorCodes = {
  GRADES_FETCH_ERROR: 'GRADES_FETCH_ERROR',
  GRADES_VALIDATION_ERROR: 'GRADES_VALIDATION_ERROR',
  GRADES_NOT_FOUND: 'GRADES_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type GradeErrorCode = keyof typeof gradeErrorCodes;

export type GradeServiceError = {
  code: typeof gradeErrorCodes[GradeErrorCode];
  message: string;
};
```

#### 2.4 Implement Grade Service
- Create `src/features/grade/backend/service.ts`
- Implement function `getLearnerGradesService` to fetch learner's graded assignments
- Implement logic to calculate course totals based on assignment weights
- Apply proper filtering for deleted records (`deleted_at IS NULL`)
- Include pagination support
- Follow the same pattern as `getLearnerDashboardService` in dashboard service
- Use appropriate table joins to get assignment and course information
- Calculate course totals as sum of (assignment score × weight percentage)

#### 2.5 Create API Route
- Create `GET /api/grades` endpoint in `src/features/grade/backend/route.ts`
- Apply existing authentication middleware (similar to dashboard routes)
- Validate query parameters using Zod schemas
- Return standardized success response with grades and course totals
- Handle error cases (no grades, unauthorized access, etc.)
- Follow the same response pattern as other API endpoints using `respond()` and `failure()`

#### 2.6 Register Grade Routes
- Update `src/backend/hono/app.ts` to include grade routes
- Add `registerGradeRoutes(app)` function call
- Follow the same pattern as other feature route registrations

### 3. Frontend Implementation

#### 3.1 Create Grade Feature Directory Structure
- `src/features/grade/components/GradeOverview.tsx` - Main grade overview component
- `src/features/grade/components/CourseGrades.tsx` - Course-specific grade display
- `src/features/grade/components/AssignmentGradeCard.tsx` - Individual assignment display
- `src/features/grade/lib/dto.ts` - TypeScript interfaces for grade data
- `src/features/grade/hooks/useGrades.ts` - React Query hook for grade API

#### 3.2 Create Grade Page Route
- Create `src/app/(protected)/grades/page.tsx`
- Implement protected route for learners only
- Fetch grades data using the API hook
- Display loading, error, and empty states
- Follow the same pattern as dashboard page

#### 3.3 Implement Grade Components
- **GradeOverview**: Displays overall grade summary and course totals
- **CourseGrades**: Groups assignments by course with course total calculation
- **AssignmentGradeCard**: Shows individual assignment details (score, feedback, status)
- Include visual indicators for late submissions and resubmissions
- Display appropriate messages when no grades are available
- Follow the same UI patterns as existing dashboard components

#### 3.4 Create DTOs and React Query Hook
- Define TypeScript interfaces in `src/features/grade/lib/dto.ts` based on backend schemas
- Implement `useGrades` hook in `src/features/grade/hooks/useGrades.ts`
- Use React Query for caching and background updates
- Handle loading, error, and success states
- Include retry logic for failed requests

### 4. UI/UX Implementation

#### 4.1 Grade Dashboard Layout
- Create responsive layout for grade viewing
- Include navigation breadcrumbs
- Add filtering options (by course, by status)
- Implement search functionality for assignments
- Follow the same layout patterns as existing dashboard

#### 4.2 Visual Design
- Use consistent styling with existing UI components
- Implement color coding for different statuses (graded, pending, resubmission required)
- Add visual indicators for late submissions
- Ensure accessibility compliance
- Follow the same design system as existing components

#### 4.3 Grade Display Elements
- Show assignment titles and descriptions
- Display scores on 0-100 scale
- Include instructor feedback with proper text formatting
- Show late submission status indicators
- Show resubmission status indicators
- Calculate and display course totals based on assignment weights
- Display appropriate messages when no grades are available

### 5. API Implementation Details

#### 5.1 GET /api/grades
- **Method**: GET
- **Path**: `/api/grades`
- **Auth**: Required (learner role) using existing auth middleware
- **Query Parameters** (validated with Zod):
  - `limit` (optional, default: 20, max: 100)
  - `offset` (optional, default: 0)
  - `courseId` (optional, filter by specific course)
- **Response**:
  - Success: `200 OK` with grade data
  - Unauthorized: `401 UNAUTHORIZED`
  - Forbidden: `403 INSUFFICIENT_PERMISSIONS`
  - Server Error: `500 INTERNAL_SERVER_ERROR`

#### 5.2 Response Format
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "submission-uuid",
        "assignmentId": "assignment-uuid",
        "assignmentTitle": "Assignment Title",
        "assignmentDescription": "Assignment Description",
        "courseId": "course-uuid",
        "courseTitle": "Course Title",
        "score": 85.5,
        "feedback": "Great work on this assignment!",
        "gradedAt": "2024-01-15T10:30:00Z",
        "isLate": false,
        "isResubmission": false,
        "status": "graded",
        "pointsWeight": 20.0
      }
    ],
    "courseTotals": [
      {
        "courseId": "course-uuid",
        "courseTitle": "Course Title",
        "totalScore": 87.2,
        "assignmentsCount": 5,
        "gradedCount": 4
      }
    ]
  }
}
```

### 6. Error Handling
- Handle authentication failures gracefully using existing middleware
- Display appropriate messages when no grades are available
- Show error states for network failures
- Validate user permissions properly
- Follow the same error handling patterns as other features

### 7. Testing Strategy
- Unit tests for service layer functions
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for complete grade viewing flow

### 8. Security Considerations
- Ensure learners can only access their own grades
- Apply proper role-based access control using existing middleware
- Validate all input parameters
- Sanitize output data appropriately
- Follow the same security patterns as other features

### 9. Performance Optimization
- Implement proper pagination for large datasets
- Use React Query for efficient caching
- Optimize database queries with proper indexing
- Implement loading states to improve UX
- Follow the same performance patterns as existing features

### 10. Implementation Timeline

#### Phase 1: Backend API (Days 1-2)
- [ ] Create error codes definition
- [ ] Create schema definitions
- [ ] Implement grade service with proper database queries
- [ ] Create API route with authentication
- [ ] Register route in main application
- [ ] Test API endpoints manually

#### Phase 2: Frontend Components (Days 3-4)
- [ ] Create DTO definitions
- [ ] Implement React Query hook for grades
- [ ] Create grade page structure
- [ ] Create grade display components
- [ ] Add styling and responsive design

#### Phase 3: Integration & Testing (Days 5-6)
- [ ] Integrate backend and frontend
- [ ] Implement error handling
- [ ] Write tests for new functionality
- [ ] Perform end-to-end testing

#### Phase 4: Polish & Documentation (Day 7)
- [ ] Refine UI/UX elements
- [ ] Add loading states
- [ ] Update documentation
- [ ] Final testing and bug fixes