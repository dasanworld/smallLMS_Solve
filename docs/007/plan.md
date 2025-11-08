# Instructor Dashboard Implementation Plan

## Overview
This document outlines the implementation plan for the Instructor Dashboard feature based on the specification in `spec.md`. The dashboard will allow instructors to view their courses, pending grading assignments, and recent submissions.

## Architecture Overview
- **Frontend**: Next.js 14 with App Router, React Query for data fetching, and TypeScript
- **Backend**: Hono.js API with Supabase integration
- **Database**: Supabase PostgreSQL with the existing schema
- **Authentication**: Supabase auth with role-based access control

## Implementation Steps

### 1. Backend Implementation

#### 1.1 Create Instructor Dashboard Service
**Location**: `src/features/dashboard/backend/instructor-service.ts`

**Components to implement**:
- `getInstructorDashboardService` - Fetches instructor dashboard data
  - Retrieves instructor's courses with status (draft/published/archived)
  - Counts pending grading assignments
  - Fetches recent submissions
  - Filters data by instructor's user ID
  - Implements pagination for courses

#### 1.2 Create Instructor Dashboard Schema
**Location**: `src/features/dashboard/backend/instructor-schema.ts`

**Schemas to define**:
- `InstructorDashboardResponseSchema` - Response format for instructor dashboard
  - `courses`: Array of course objects with status, title, enrollment count, etc.
  - `pendingGradingCount`: Number of ungraded submissions
  - `recentSubmissions`: Array of recent submission objects
- `InstructorDashboardRequestSchema` - Request validation schema with optional filters

#### 1.3 Create Instructor Dashboard Route
**Location**: `src/features/dashboard/backend/instructor-route.ts`

**Route to implement**:
- `GET /api/dashboard/instructor` - Protected endpoint for instructor dashboard data
  - Requires authentication and instructor role validation
  - Implements error handling with appropriate HTTP status codes
  - Returns standardized response format

#### 1.4 Create Role-Based Authorization Middleware
**Location**: `src/backend/middleware/auth.ts`

**Component to add**:
- `requireRole` middleware function to validate user roles
  - Checks if authenticated user has required role(s)
  - Returns 403 error for insufficient permissions

### 2. Frontend Implementation

#### 2.1 Create Instructor Dashboard Page
**Location**: `src/app/(protected)/instructor-dashboard/page.tsx`

**Components to implement**:
- Page component that checks user role
- Redirects to appropriate dashboard based on user role
- Displays instructor dashboard when user has instructor role
- Shows error/access denied when user doesn't have instructor role

#### 2.2 Create Instructor Dashboard Component
**Location**: `src/features/dashboard/components/InstructorDashboard.tsx`

**Components to implement**:
- Main dashboard layout with header and sections
- Course list section with status indicators
- Pending grading counter
- Recent submissions list
- Loading and error states
- Empty state handling when no courses exist

#### 2.3 Create Instructor Dashboard Query Hook
**Location**: `src/features/dashboard/hooks/useInstructorDashboardQuery.ts`

**Hook to implement**:
- `useInstructorDashboardQuery` - React Query hook for fetching dashboard data
- Implements caching with 5-minute stale time
- Handles loading and error states
- Parses response with Zod schema

#### 2.4 Create Dashboard UI Components
**Location**: `src/features/dashboard/components/`

**Components to create**:
- `CourseStatusCard.tsx` - Displays course information with status indicator
- `PendingGradingCounter.tsx` - Shows pending grading count with visual indicator
- `RecentSubmissionsList.tsx` - Lists recent submissions with quick actions
- `DashboardMetrics.tsx` - Summary cards for key metrics

### 3. Database Considerations

#### 3.1 Current Schema Compatibility
The existing Supabase schema supports the required functionality:
- `courses` table: Has `owner_id` to identify instructor's courses and `status` field
- `assignments` table: Links to courses
- `submissions` table: Links to assignments with `status` and grading fields

#### 3.2 Performance Optimization
- Add database indexes if needed for dashboard queries
- Use efficient queries with proper JOINs and WHERE clauses
- Implement pagination for courses when instructor has many courses

### 4. API Endpoints

#### 4.1 Main Dashboard Endpoint
- **Route**: `GET /api/dashboard/instructor`
- **Auth**: Bearer token required
- **Role**: Instructor role required
- **Response**:
  ```json
  {
    "courses": [
      {
        "id": "uuid",
        "title": "string",
        "status": "draft|published|archived",
        "enrollmentCount": "number",
        "assignmentCount": "number"
      }
    ],
    "pendingGradingCount": "number",
    "recentSubmissions": [
      {
        "id": "uuid",
        "assignmentId": "uuid",
        "assignmentTitle": "string",
        "courseId": "uuid",
        "courseTitle": "string",
        "studentName": "string",
        "submittedAt": "ISO date string",
        "status": "submitted|graded|resubmission_required"
      }
    ]
  }
  ```

#### 4.2 Error Handling
- `401 UNAUTHORIZED`: User not authenticated
- `403 INSUFFICIENT_PERMISSIONS`: User not an instructor
- `500 INTERNAL_SERVER_ERROR`: Server error
- `500 DATABASE_ERROR`: Database unavailable

### 5. Implementation Sequence

#### Phase 1: Backend Setup
1. Create instructor dashboard service (`instructor-service.ts`)
2. Create instructor dashboard schema (`instructor-schema.ts`)
3. Create role-based middleware (`requireRole` function in `auth.ts`)
4. Create instructor dashboard route (`instructor-route.ts`)
5. Register the route in the main route registration

#### Phase 2: Frontend Components
1. Create instructor dashboard page component
2. Create instructor dashboard UI component
3. Create query hook for fetching dashboard data
4. Create individual dashboard UI components

#### Phase 3: Integration and Testing
1. Integrate backend and frontend
2. Test authentication and role validation
3. Verify data fetching and display
4. Test error conditions
5. Test edge cases (no courses, no pending grading, etc.)

### 6. Security Considerations
- Ensure only instructors can access instructor dashboard
- Validate that instructors only see their own courses
- Implement proper authentication token validation
- Sanitize all user inputs and database outputs
- Use parameterized queries to prevent SQL injection

### 7. Performance Considerations
- Implement proper caching with React Query
- Use pagination for large datasets
- Optimize database queries with appropriate indexes
- Implement skeleton loading states for better UX
- Use proper data fetching strategies to minimize API calls

### 8. Error Handling
- Handle authentication failures gracefully
- Display appropriate error messages to users
- Implement fallback UI states
- Log server-side errors for debugging
- Implement retry mechanisms for failed API calls

### 9. Testing Strategy
- Unit tests for service functions
- Integration tests for API endpoints
- Component tests for UI components
- End-to-end tests for complete user flows
- Error condition testing