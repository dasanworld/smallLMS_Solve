# Assignment Management Feature Implementation Plan

## 1. Overview

This plan outlines the implementation of the Assignment Management feature for Instructors. The feature allows instructors to create, edit, publish, and manage assignments within their courses, including status transitions and submission management.

## 2. Database Schema Enhancements

### 2.1 Existing Schema Analysis
The current schema already includes the `assignments` table with the following relevant fields:
- `id`: UUID primary key
- `course_id`: UUID foreign key to courses table
- `title`: VARCHAR(255) assignment title
- `description`: TEXT assignment description
- `due_date`: TIMESTAMP WITH TIME ZONE deadline
- `points_weight`: DECIMAL(5,2) score weight
- `status`: VARCHAR(20) status (draft, published, closed)
- `allow_late`: BOOLEAN for late submission policy
- `allow_resubmission`: BOOLEAN for resubmission policy
- `created_at`, `updated_at`, `published_at`: Timestamps
- `deleted_at`, `closed_at`: Soft delete and close timestamps

### 2.2 Schema Enhancements Required
1. **Weight Validation Function**: Create a database function to validate total weight percentage does not exceed 1.0 (100%) for assignments within a course
2. **Cron Job Setup**: Implement a daily job to automatically close past-deadline assignments

### 2.3 Migration Scripts
Create a new migration file: `supabase/migrations/0011_add_assignment_constraints.sql`

```sql
-- Migration: Add assignment constraints and validation
-- Description: Add weight validation function and automatic closing trigger

-- Function to validate assignment weights within a course
CREATE OR REPLACE FUNCTION validate_assignment_weights(course_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_weight DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(points_weight), 0) INTO total_weight
    FROM assignments
    WHERE course_id = course_id_param
    AND deleted_at IS NULL;

    -- Return true if total weight is within limit (100%)
    RETURN total_weight <= 1.0;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically close past-deadline assignments
CREATE OR REPLACE FUNCTION close_past_deadline_assignments()
RETURNS void AS $$
BEGIN
    UPDATE assignments
    SET 
        status = 'closed',
        closed_at = NOW()
    WHERE 
        status = 'published'
        AND due_date < NOW()
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to validate assignment before insert/update
CREATE OR REPLACE FUNCTION validate_assignment_insert_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate weight constraints
    IF NOT validate_assignment_weights(NEW.course_id) THEN
        RAISE EXCEPTION 'ASSIGNMENT_WEIGHT_EXCEEDED: Total assignment weights in course cannot exceed 100%';
    END IF;

    -- For published assignments, ensure deadline is in the future
    IF NEW.status = 'published' AND NEW.due_date <= NOW() THEN
        RAISE EXCEPTION 'ASSIGNMENT_PAST_DEADLINE: Published assignment deadline must be in the future';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assignment validation
CREATE TRIGGER assignment_validation_trigger
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_insert_update();

-- Create index for efficient automatic closing
CREATE INDEX idx_assignments_publishable 
ON assignments(course_id, status, due_date) 
WHERE status = 'published' AND deleted_at IS NULL;

-- Create index for efficient weight validation
CREATE INDEX idx_assignments_course_weight 
ON assignments(course_id, points_weight) 
WHERE deleted_at IS NULL;
```

## 3. Backend Implementation

### 3.1 New API Endpoints

#### 3.1.1 Assignment Management Endpoints
- `GET /api/courses/:courseId/assignments` - List assignments for a course
- `POST /api/courses/:courseId/assignments` - Create new assignment
- `GET /api/assignments/:id` - Get assignment details (existing)
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment (soft delete)
- `PUT /api/assignments/:id/status` - Update assignment status
- `GET /api/courses/:courseId/assignments/stats` - Get assignment statistics for course

#### 3.1.2 Submission Management Endpoints
- `GET /api/assignments/:assignmentId/submissions` - List submissions for assignment
- `GET /api/assignments/:assignmentId/submissions/stats` - Get submission statistics
- `PUT /api/submissions/:id/status` - Update submission status (graded, resubmission required)
- `PUT /api/submissions/:id/grade` - Grade submission

### 3.2 Backend Service Structure

#### 3.2.1 Assignment Management Service
Create `/src/features/assignment/management/backend/service.ts`:
- `createAssignmentService` - Create new assignment with validation
- `updateAssignmentService` - Update assignment details
- `deleteAssignmentService` - Soft delete assignment
- `updateAssignmentStatusService` - Change assignment status with validation
- `getCourseAssignmentsService` - List assignments for a course
- `getAssignmentDetailsService` - Get detailed assignment information
- `validateAssignmentWeightsService` - Validate assignment weight constraints

#### 3.2.2 Submission Management Service
Create `/src/features/assignment/submission/backend/management-service.ts`:
- `getAssignmentSubmissionsService` - List submissions for an assignment
- `updateSubmissionStatusService` - Update submission status
- `gradeSubmissionService` - Grade a submission
- `getSubmissionStatsService` - Get submission statistics

### 3.3 Backend Route Implementation

#### 3.3.1 Assignment Management Routes
Create `/src/features/assignment/management/backend/route.ts`:
- Implement all the new API endpoints with proper validation
- Use Zod for request/response validation
- Apply authentication and authorization middleware
- Include proper error handling

#### 3.3.2 Middleware Requirements
- `verifyInstructorRole` - Verify user has instructor role
- `verifyCourseOwnership` - Verify user owns the course
- `validateAssignmentWeights` - Validate assignment weight constraints

### 3.4 Error Handling

#### 3.4.1 New Error Codes
- `ASSIGNMENT_WEIGHT_EXCEEDED` - When assignment weights exceed 100%
- `ASSIGNMENT_PAST_DEADLINE` - When trying to publish assignment with past deadline
- `INSUFFICIENT_PERMISSIONS` - When user doesn't have permission to manage assignment
- `ASSIGNMENT_NOT_FOUND` - When assignment doesn't exist
- `COURSE_NOT_FOUND` - When course doesn't exist
- `SUBMISSION_NOT_FOUND` - When submission doesn't exist

## 4. Frontend Implementation

### 4.1 New React Components

#### 4.1.1 Assignment Management Components
- `AssignmentList` - List of assignments for a course with status indicators
- `AssignmentForm` - Form for creating/editing assignments
- `AssignmentCard` - Card component for individual assignments
- `AssignmentStatusBadge` - Visual indicator for assignment status
- `AssignmentStatsCard` - Display assignment statistics

#### 4.1.2 Submission Management Components
- `SubmissionList` - List of submissions for an assignment
- `SubmissionCard` - Card component for individual submissions
- `SubmissionStatusFilter` - Filter submissions by status
- `GradeSubmissionModal` - Modal for grading submissions
- `SubmissionStatsCard` - Display submission statistics

### 4.2 Page Structure

#### 4.2.1 Assignment Management Pages
- `/courses/[courseId]/assignments` - Main assignment management page
- `/courses/[courseId]/assignments/new` - Create new assignment page
- `/courses/[courseId]/assignments/[assignmentId]/edit` - Edit assignment page
- `/courses/[courseId]/assignments/[assignmentId]/submissions` - View submissions page

### 4.3 State Management

#### 4.3.1 New Store/Context
- `AssignmentManagementContext` - Context for assignment management state
- Redux/Zustand store for assignment management (if applicable)

### 4.4 Hooks

#### 4.4.1 New Custom Hooks
- `useAssignmentList` - Fetch and manage assignment list
- `useAssignmentForm` - Handle assignment form state and validation
- `useSubmissionList` - Fetch and manage submission list
- `useAssignmentStats` - Fetch assignment statistics
- `useSubmissionStats` - Fetch submission statistics

## 5. Implementation Steps

### 5.1 Phase 1: Backend Foundation (Week 1)
1. Create database migration for validation functions and triggers
2. Implement assignment management service
3. Implement submission management service
4. Create Zod schemas for new endpoints
5. Implement backend routes with validation
6. Add authentication and authorization middleware
7. Implement error handling with proper error codes

### 5.2 Phase 2: Frontend Components (Week 2)
1. Create assignment list component
2. Create assignment form component
3. Create assignment card component
4. Create submission list component
5. Create submission card component
6. Create status badge components
7. Implement assignment management pages

### 5.3 Phase 3: Integration and Features (Week 3)
1. Connect frontend components to backend APIs
2. Implement assignment creation workflow
3. Implement assignment editing workflow
4. Implement status transition functionality
5. Implement submission grading functionality
6. Add submission filtering and search
7. Implement assignment weight validation UI

### 5.4 Phase 4: Advanced Features and Testing (Week 4)
1. Implement assignment statistics dashboard
2. Add bulk operations for submissions
3. Implement automatic assignment closing scheduler
4. Write comprehensive unit tests
5. Write integration tests
6. Perform end-to-end testing
7. Implement error boundaries and user feedback

## 6. Data Validation and Business Rules

### 6.1 Client-Side Validation
- Form validation using Zod schemas
- Real-time weight calculation and validation
- Deadline validation (ensure future dates for published assignments)

### 6.2 Server-Side Validation
- Database-level constraints for weight validation
- Role-based access control
- Course ownership verification
- Deadline validation for published assignments

### 6.3 Business Rule Enforcement
- Only course owners can manage assignments
- Weight validation using database transaction
- Automatic status changes via cron job
- Soft delete for preserving submission history

## 7. Security Considerations

### 7.1 Authentication
- Verify user is authenticated as instructor
- Use JWT tokens for session management

### 7.2 Authorization
- Verify course ownership before allowing operations
- Implement role-based access control
- Prevent unauthorized access to assignments and submissions

### 7.3 Data Protection
- Implement soft deletes to preserve submission history
- Use parameterized queries to prevent SQL injection
- Sanitize user inputs before database operations

## 8. Performance Optimization

### 8.1 Database Optimization
- Proper indexing for assignment queries
- Efficient joins for assignment-submission relationships
- Use of database functions for weight validation

### 8.2 Frontend Optimization
- Implement pagination for assignment and submission lists
- Use React.memo for component optimization
- Implement lazy loading for large lists
- Optimize API calls with caching where appropriate

## 9. Testing Strategy

### 9.1 Unit Tests
- Test all service functions
- Test validation logic
- Test error handling

### 9.2 Integration Tests
- Test API endpoints
- Test database transactions
- Test authentication/authorization flows

### 9.3 End-to-End Tests
- Test complete assignment management workflow
- Test submission grading workflow
- Test edge cases and error conditions

## 10. Deployment Considerations

### 10.1 Database Migration
- Run database migration before deploying new code
- Ensure backward compatibility during deployment

### 10.2 Environment Configuration
- Set up cron job for automatic assignment closing
- Configure environment variables for scheduler

### 10.3 Monitoring
- Monitor API performance
- Track error rates
- Monitor database performance