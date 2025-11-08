# Implementation Plan: Submission Grading & Feedback Feature

## Overview
This document outlines the implementation plan for the Submission Grading & Feedback feature for Instructors, based on the specification in `/docs/010/spec.md`. The feature allows instructors to grade submissions and provide feedback or request resubmission.

## Current State Analysis
Based on codebase analysis, there's already some implementation for submission grading:
- `/src/app/submissions/[submissionId]/grade/page.tsx` - Existing grading page
- `/src/features/assignment/management/components/grade-submission-form.tsx` - Existing form component
- `/src/features/assignment/management/backend/route.ts` - Existing API routes
- `/src/features/assignment/management/backend/submission-service.ts` - Existing service functions
- `/src/features/assignment/management/backend/schemas.ts` - Existing validation schemas

However, the current implementation appears to be incomplete or needs updates to match the specification requirements.

## Implementation Plan

### Phase 1: Backend Implementation

#### 1.1 Update Database Schema (if needed)
- The existing schema already supports grading with `score`, `feedback`, and `graded_at` fields in the `submissions` table
- The `status` field supports `submitted`, `graded`, `resubmission_required` values
- No schema changes needed based on the specification

#### 1.2 Create New Backend Service for Grading
Location: `/src/features/grade/backend/service.ts`

**Functions to implement:**
```typescript
// Grade a submission with score and feedback
gradeSubmissionService(
  client: SupabaseClient,
  instructorId: string,
  submissionId: string,
  score: number,
  feedback: string,
  action: 'grade' | 'resubmission_required'
): Promise<HandlerResult<SubmissionData, GradeServiceError, unknown>>

// Get submission details for grading
getSubmissionForGradingService(
  client: SupabaseClient,
  instructorId: string,
  submissionId: string
): Promise<HandlerResult<SubmissionGradingData, GradeServiceError, unknown>>

// Get submissions list for assignment
getAssignmentSubmissionsService(
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string
): Promise<HandlerResult<SubmissionListData, GradeServiceError, unknown>>
```

#### 1.3 Create New Backend Schema
Location: `/src/features/grade/backend/schema.ts`

**Schemas to define:**
```typescript
// Request schema for grading
export const GradeSubmissionRequestSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1).max(1000),
  action: z.enum(['grade', 'resubmission_required'])
});

// Response schema for submission details
export const SubmissionGradingSchema = z.object({
  id: z.string(),
  assignment_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  content: z.string(),
  link: z.string().nullable(),
  submitted_at: z.string(),
  is_late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  assignment_title: z.string(),
  course_title: z.string()
});

// Response schema for submissions list
export const SubmissionsListSchema = z.array(SubmissionGradingSchema);
```

#### 1.4 Create New Backend Error Handling
Location: `/src/features/grade/backend/error.ts`

**Error codes to define:**
```typescript
export const gradeErrorCodes = {
  ...existingCodes,
  SUBMISSION_NOT_FOUND: 'SUBMISSION_NOT_FOUND',
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  INVALID_SCORE_RANGE: 'INVALID_SCORE_RANGE',
  MISSING_FEEDBACK: 'MISSING_FEEDBACK',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SUBMISSION_ALREADY_GRADED: 'SUBMISSION_ALREADY_GRADED'
} as const;
```

#### 1.5 Create New Backend API Routes
Location: `/src/features/grade/backend/route.ts`

**API endpoints to implement:**
- `GET /api/submissions/:id` - Get submission details for grading
- `PUT /api/submissions/:id/grade` - Grade submission with score and feedback
- `GET /api/assignments/:id/submissions` - Get all submissions for assignment

### Phase 2: Frontend Implementation

#### 2.1 Update Grading Form Component
Location: `/src/features/grade/components/grade-submission-form.tsx`

**Features to implement:**
- Score input with validation (0-100 range)
- Feedback text area with validation (required)
- Action buttons: "Grade" and "Request Resubmission"
- Validation error messages
- Loading states
- Success/error feedback

#### 2.2 Create Submission Details View Component
Location: `/src/features/grade/components/submission-details.tsx`

**Features to implement:**
- Display learner information
- Display submission content
- Display submission link if provided
- Display submission timestamp
- Display late submission indicator

#### 2.3 Create Submissions List Component
Location: `/src/features/grade/components/submissions-list.tsx`

**Features to implement:**
- List all submissions for an assignment
- Show submission status indicators
- Show learner names
- Show submission timestamps
- Navigation to individual grading page

#### 2.4 Update Grading Page
Location: `/src/app/submissions/[submissionId]/grade/page.tsx`

**Features to implement:**
- Fetch submission details for grading
- Integrate submission details and grading form components
- Handle form submission with proper error handling
- Navigation after successful grading
- Loading and error states

#### 2.5 Create Assignment Submissions Page
Location: `/src/app/courses/[courseId]/assignments/[assignmentId]/submissions/page.tsx`

**Features to implement:**
- Fetch and display all submissions for assignment
- List submissions with status indicators
- Navigation to individual grading page
- Assignment title and course information

### Phase 3: Integration and Testing

#### 3.1 Register New API Routes
Location: `/src/backend/hono/app.ts`

- Import and register the new grade routes

#### 3.2 Update Navigation
Location: `/src/features/assignment/management/components/assignment-actions.tsx`

- Add navigation to submissions grading page from assignment details

#### 3.3 Add Notification System Integration
Location: `/src/features/notification/lib/notification-service.ts`

- Send notification to learner when grade/feedback is provided or resubmission is requested

### Implementation Steps

#### Step 1: Backend Service Layer
1. Create `/src/features/grade/backend/service.ts` with grading functions
2. Implement `gradeSubmissionService` with validation and business logic
3. Implement `getSubmissionForGradingService` to fetch submission details
4. Implement `getAssignmentSubmissionsService` to fetch submissions list
5. Add proper error handling and logging

#### Step 2: Backend Validation Schema
1. Create `/src/features/grade/backend/schema.ts` with proper validation schemas
2. Define request and response schemas for grading operations
3. Include validation for score range (0-100) and feedback requirements

#### Step 3: Backend Error Handling
1. Create `/src/features/grade/backend/error.ts` with appropriate error codes
2. Define error messages for different failure scenarios
3. Include business rule violations in error definitions

#### Step 4: Backend API Routes
1. Create `/src/features/grade/backend/route.ts` with Hono routes
2. Implement authentication and authorization middleware
3. Connect routes to service functions
4. Add proper response formatting

#### Step 5: Frontend Components
1. Create `/src/features/grade/components/submission-details.tsx`
2. Create `/src/features/grade/components/grade-submission-form.tsx` (enhanced)
3. Create `/src/features/grade/components/submissions-list.tsx`
4. Implement proper validation and error handling in components

#### Step 6: Frontend Pages
1. Update `/src/app/submissions/[submissionId]/grade/page.tsx`
2. Create `/src/app/courses/[courseId]/assignments/[assignmentId]/submissions/page.tsx`
3. Add proper loading and error states
4. Implement navigation between pages

#### Step 7: Integration
1. Register new routes in the main Hono app
2. Add navigation links in assignment management pages
3. Test authentication and authorization flows
4. Verify database transactions work properly

#### Step 8: Testing
1. Unit test service functions
2. Integration test API endpoints
3. Test frontend components with mock data
4. End-to-end test the complete grading flow

## Technical Considerations

### Security
- Ensure only course instructors can grade submissions
- Validate user permissions at both API and UI levels
- Implement proper authentication using existing middleware
- Validate assignment ownership before allowing grading

### Data Integrity
- Use database transactions for grading operations
- Ensure score validation at both API and database levels
- Maintain audit trail for grading actions (future enhancement)

### Performance
- Implement proper indexing for submission queries
- Use pagination for large submissions lists
- Optimize database queries to minimize round trips

### Error Handling
- Provide clear error messages to users
- Log errors appropriately for debugging
- Handle edge cases like concurrent grading attempts

## Dependencies
- Supabase client for database operations
- Zod for input validation
- Hono for API routing
- React Hook Form for form management
- Existing authentication middleware

## Testing Strategy
1. Unit tests for service functions
2. Integration tests for API endpoints
3. Component tests for UI elements
4. End-to-end tests for complete user flows
5. Edge case testing for invalid inputs and permissions