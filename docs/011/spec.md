# Feature 011: Assignment 게시/마감 (Instructor)

## Use Case Description
강사가 과제를 게시하거나 마감하는 기능

## Primary Actor
Instructor (Registered User with instructor role)

## Trigger
Instructor changes assignment status from draft to published or manually closes an assignment

## Precondition
- User must be authenticated as an Instructor
- User must own the course containing the assignment
- Assignment must exist in the system
- Assignment must be in a state that allows status changes

## Main Flow
1. Instructor navigates to assignment management
2. Instructor selects an assignment to change status
3. For publishing:
   - Instructor changes status from draft to published
   - System validates assignment has required fields completed
   - System updates assignment status to published
   - Assignment becomes visible to enrolled learners
   - Learners can now view assignment details and submit if not past deadline
4. For manual closing:
   - Instructor changes status from published to closed
   - System updates assignment status to closed
   - Learners can no longer submit to this assignment
   - Instructor can still view and grade existing submissions
5. System updates all relevant UI elements to reflect status change
6. System logs the status change with timestamp and instructor information

## Alternative Flows
### Auto-Closing Process
- System runs daily cron job at midnight UTC
- Identifies published assignments with past deadlines
- Automatically changes their status to closed
- No further submissions are accepted for these assignments
- Instructors can still grade existing submissions

### Validation Failure During Publishing
- If required fields are incomplete, display validation errors
- Assignment status remains unchanged
- Require instructor to complete all required fields before publishing

### Attempting to Close Already Closed Assignment
- System displays warning that assignment is already closed
- No status change occurs
- Instructor is informed of current status

## Postcondition
- Assignment status is updated in the database
- Learner interfaces reflect the new assignment status
- Assignment visibility changes based on status
- Submission functionality is enabled/disabled based on status
- Instructor dashboard reflects current assignment status

## Business Rules
- Only course owners can change assignment status
- Draft assignments are not visible to learners
- Published assignments are visible to enrolled learners
- Closed assignments accept no new submissions but allow grading
- Auto-closing happens daily at midnight UTC regardless of instructor action
- Status changes are logged for audit purposes
- Required fields must be completed before publishing an assignment
- Assignment status changes are reflected immediately across the system

## Error Conditions
- Not authenticated → Redirect to login
- Not course owner → Access denied
- Invalid status transition → Display error message
- Missing required fields → Display validation errors
- System failure → Display system error message
- Database unavailable → Display appropriate error message
- Attempting to publish assignment with past deadline → Display warning

## UI Elements
- Assignment status selector/publish button
- Status indicator showing current assignment state
- Validation error messages for incomplete fields
- Confirmation dialog for status changes
- Assignment list with status badges
- Deadline information display
- Publish/Closed status toggle
- Status change history log