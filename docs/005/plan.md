# Assignment Submission/Resubmission Feature Implementation Plan

## Overview
This document outlines the implementation plan for the Assignment Submission/Resubmission feature for Learners based on the specification in `/docs/005/spec.md`. The feature allows learners to submit assignments and resubmit them when required by instructors.

## Architecture Overview
The feature follows the existing project architecture with:
- Frontend components in `/src/features/assignment/submission/components`
- Backend API routes using Hono in `/src/features/assignment/submission/backend`
- Service layer for business logic
- Zod validation schemas
- TypeScript DTOs for data transfer objects

## Database Schema Considerations
Based on the existing schema in `supabase/migrations/01_lms_schema.sql`, the submissions table already exists with the following relevant fields:
- `id`: UUID primary key
- `assignment_id`: Reference to assignments table
- `user_id`: Reference to users table (learner)
- `content`: Text content of the submission
- `link`: Optional URL link
- `status`: Status of the submission ('submitted', 'graded', 'resubmission_required')
- `is_late`: Boolean indicating if submission was late
- `submitted_at`: Timestamp of submission
- `updated_at`: Timestamp of last update

## Implementation Steps

### 1. Backend Implementation

#### 1.1 Create Authentication Middleware
- **File**: `/src/backend/middleware/auth.ts`
- **Purpose**: Create a reusable authentication middleware for verifying user sessions
- **Implementation**:
  - Extract token from Authorization header
  - Verify token with Supabase
  - Attach user information to context

#### 1.2 Create Submission Schema
- **File**: `/src/features/assignment/submission/backend/schema.ts`
- **Purpose**: Define Zod schemas for submission validation
- **Schemas to include**:
  - Submission request schema (content: required string, link: optional URL)
  - Submission response schema (success, submission_id, message, submitted_at)
  - Submission detail response schema

#### 1.3 Create Submission Error Types
- **File**: `/src/features/assignment/submission/backend/error.ts`
- **Purpose**: Define error codes and types for submission operations
- **Error codes**:
  - `ASSIGNMENT_NOT_FOUND`
  - `ASSIGNMENT_CLOSED`
  - `SUBMISSION_PAST_DUE_DATE`
  - `INVALID_INPUT`
  - `INSUFFICIENT_PERMISSIONS`
  - `UNAUTHORIZED`
  - `INTERNAL_SERVER_ERROR`

#### 1.4 Create Submission Service
- **File**: `/src/features/assignment/submission/backend/service.ts`
- **Purpose**: Implement business logic for assignment submission
- **Functions to implement**:
  - `submitAssignmentService`: Handle new submissions and resubmissions
  - `validateAssignmentSubmission`: Validate assignment state and policies
  - `checkSubmissionDeadline`: Check if submission is within deadline
  - `checkSubmissionPermissions`: Verify user enrollment and role
  - `createOrUpdateSubmission`: Create new submission or update existing one

#### 1.5 Create Submission Routes
- **File**: `/src/features/assignment/submission/backend/route.ts`
- **Purpose**: Define API endpoints for submission operations
- **Routes to implement**:
  - `POST /api/assignments/:id/submit`: Submit or resubmit assignment
  - Include authentication middleware
  - Validate input with Zod schemas
  - Handle success and error responses

#### 1.6 Register Submission Routes
- **File**: `/src/backend/hono/app.ts`
- **Purpose**: Register submission routes with the main Hono application
- **Implementation**: Import and call registration function

### 2. Frontend Implementation

#### 2.1 Create Submission DTOs
- **File**: `/src/features/assignment/submission/lib/dto.ts`
- **Purpose**: Define TypeScript interfaces for submission data
- **Interfaces to include**:
  - `AssignmentSubmissionRequest`
  - `AssignmentSubmissionResponse`
  - `AssignmentSubmissionDetail`

#### 2.2 Create Submission Hooks
- **File**: `/src/features/assignment/submission/hooks/useAssignmentSubmissionMutation.ts`
- **Purpose**: Create React Query mutation hook for submitting assignments
- **Implementation**:
  - Define mutation function that calls the API
  - Handle success and error cases
  - Invalidate related queries to refresh UI

#### 2.3 Create Submission Components
- **File**: `/src/features/assignment/submission/components/AssignmentSubmissionForm.tsx`
- **Purpose**: Create form component for assignment submission
- **Features**:
  - Text area for content (required)
  - Input field for link (optional, with URL validation)
  - Submit button with loading state
  - Validation error display
  - Success/error toast notifications
  - Display assignment deadline and late submission policy

#### 2.4 Update Assignment Detail Page
- **File**: `/src/features/assignment/detail/components/AssignmentDetail.tsx`
- **Purpose**: Integrate submission form with assignment detail page
- **Implementation**:
  - Import and render submission form
  - Pass assignment ID and submission policy to form
  - Handle submission status updates

### 3. Integration and Validation

#### 3.1 Update Assignment Detail Service
- **File**: `/src/features/assignment/detail/backend/service.ts`
- **Purpose**: Enhance service to support resubmission flow
- **Changes**:
  - Update `submitAssignmentService` to handle resubmissions
  - Add logic to check if assignment allows resubmission
  - Implement late submission handling
  - Update status based on instructor requirements

#### 3.2 Add Resubmission Logic
- **Implementation**:
  - When status is 'resubmission_required', allow updates to existing submission
  - Recalculate late status based on current time vs deadline
  - Update status back to 'submitted' after resubmission

#### 3.3 Add Input Validation
- **Implementation**:
  - Text field required validation
  - Link field URL format validation
  - Assignment deadline validation
  - User enrollment validation

### 4. Testing Considerations

#### 4.1 Unit Tests
- Create tests for service functions
- Test error handling scenarios
- Test validation logic

#### 4.2 Integration Tests
- Test API endpoints with different scenarios
- Test authentication and authorization
- Test submission and resubmission flows

### 5. Security Considerations

#### 5.1 Authorization
- Ensure only enrolled learners can submit to assignments
- Verify user roles and permissions
- Prevent unauthorized access to submission endpoints

#### 5.2 Input Validation
- Validate all input data using Zod schemas
- Sanitize content before storing in database
- Ensure URL format validation for link field

### 6. Error Handling

#### 6.1 API Error Responses
- Return appropriate HTTP status codes (400, 401, 403, 500)
- Include error codes and descriptive messages
- Follow standard error response format

#### 6.2 Client-Side Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Show appropriate feedback for different error conditions

### 7. Deployment Considerations

#### 7.1 Database Migrations
- If any schema changes are needed, create new migration files
- Ensure backward compatibility

#### 7.2 Environment Configuration
- Ensure Supabase configuration is properly set
- Verify API endpoint configurations

## Implementation Timeline

### Phase 1: Backend Infrastructure (Days 1-2)
1. Create authentication middleware
2. Define schemas and error types
3. Implement service layer
4. Create API routes
5. Register routes with main application

### Phase 2: Frontend Components (Days 2-3)
1. Create DTOs
2. Implement React Query hooks
3. Build submission form component
4. Integrate with assignment detail page

### Phase 3: Integration and Testing (Days 3-4)
1. Connect frontend to backend
2. Test submission flow
3. Test resubmission flow
4. Test error handling
5. Perform security validation

### Phase 4: Documentation and Deployment (Day 4)
1. Update documentation
2. Prepare for deployment
3. Final testing