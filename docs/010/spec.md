# Feature 010: 제출물 채점 & 피드백 (Instructor)

## Use Case Description
강사가 제출물을 채점하고 피드백을 제공하거나 재제출을 요청하는 기능

## Primary Actor
Instructor (Registered User with instructor role)

## Trigger
Instructor selects a submitted assignment to grade

## Precondition
- User must be authenticated as an Instructor
- User must own the course containing the assignment
- Assignment must have at least one submitted response from learners
- Submission must be in a gradable state (not already graded)

## Main Flow
1. Instructor navigates to the submissions list for an assignment
2. Instructor selects a specific submission to grade
3. System displays the submission details (learner info, content, link if provided)
4. Instructor enters a score (0-100 range)
5. Instructor writes feedback for the learner
6. Instructor selects grading action:
   - Enter score → Status changes to 'graded'
   - Request resubmission → Status changes to 'resubmission_required'
7. System validates score is within 0-100 range
8. System validates feedback is provided
9. System saves grade and feedback to database
10. System updates submission status based on instructor action
11. System notifies learner of grade/feedback or resubmission request
12. System updates instructor dashboard metrics

## Alternative Flows
### Resubmission Request
- Instructor selects "Request Resubmission" option
- System changes submission status to 'resubmission_required'
- Learner receives notification to resubmit
- Assignment becomes available for resubmission to learner

### Invalid Score Range
- If score is outside 0-100 range, display validation error
- Require instructor to enter valid score

### Missing Feedback
- If feedback is empty, display validation error
- Require instructor to provide feedback

## Postcondition
- Submission is assigned a grade (0-100)
- Feedback is recorded and associated with the submission
- Submission status is updated (graded or resubmission_required)
- Learner is notified of the grade/feedback or resubmission request
- Instructor dashboard metrics are updated
- Grade appears in learner's gradebook

## Business Rules
- Scores must be within 0-100 range
- Feedback is mandatory for all grading actions
- Only instructors of the course can grade submissions
- Submission status changes based on grading action
- Resubmission requests allow learners to submit again
- Previously graded submissions can be modified
- Grading actions are logged for audit purposes

## Error Conditions
- Not authenticated → Redirect to login (401, `UNAUTHORIZED`)
- Not course owner → Access denied (403, `INSUFFICIENT_PERMISSIONS`)
- Invalid score range → Display validation error (400, `INVALID_INPUT`)
- Empty feedback → Display validation error (400, `MISSING_REQUIRED_FIELD`)
- Submission not found → Display error (404, `SUBMISSION_NOT_FOUND`)
- System failure → Display system error message (500, `INTERNAL_SERVER_ERROR`)
- Database unavailable → Display appropriate error message (500, `DATABASE_ERROR`)

## API Requirements
- **Authentication**: Requires valid Supabase session token in `Authorization: Bearer <token>` header
- **Authorization**: User must be instructor and own the course containing the assignment
- **Input Validation**: Zod schema for score (0-100) and feedback (required string)
- **Transaction**: Grade update and status change within single transaction
- **Response Format**: Standard success format with updated submission data
- **Notification**: Trigger notification to learner (via future notification system)

## UI Elements
- Submission details view (content, link, submission time)
- Score input field (0-100 range with validation)
- Feedback text area (required)
- Grading action buttons (Grade, Request Resubmission)
- Submission status indicator
- Learner information display
- Validation error messages
- Save/Submit grading button
- Cancel button to abandon grading