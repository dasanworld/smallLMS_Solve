# Feature 004: 과제 상세 열람 (Learner)

## Use Case Description
학습자가 자신의 코스에 있는 과제를 클릭하여 과제 상세 정보를 열람하는 기능

## Primary Actor
Learner (Registered User with learner role)

## Trigger
Learner clicks on an assignment from their course list

## Precondition
- User must be authenticated as a Learner
- User must be enrolled in the course containing the assignment
- Assignment must exist and be accessible

## Main Flow
1. Learner accesses their dashboard and navigates to their enrolled courses
2. Learner selects a course from their course list
3. Learner views the assignment list within the course
4. Learner clicks on a specific assignment to view details
5. System validates the assignment status and user enrollment
6. System displays assignment details including:
   - Assignment description
   - Deadline
   - Score weight
   - Submission policy (late submission allowed/penalty)
   - Resubmission policy (allowed/not allowed)
   - Submission UI (text input + link input fields)

## Alternative Flows
### Assignment Not Published
- If assignment status is not 'published', system displays error message
- Learner cannot access assignment details

### Assignment Closed
- If assignment status is 'closed', submission button is disabled
- Learner can still view assignment details but cannot submit

### Not Enrolled in Course
- If learner is not enrolled in the course, access is denied
- System redirects to course catalog or displays error

## Postcondition
- Learner can view assignment details
- Submission UI is available if assignment is open for submission
- Assignment access may be logged for analytics

## Business Rules
- Only published assignments are visible to learners
- Closed assignments show details but disable submission functionality
- Only enrolled learners can access course assignments
- Assignment details include all relevant submission policies

## Error Conditions
- Assignment does not exist → Display "Assignment not found" error
- Not enrolled in course → Display "Access denied" error
- Assignment not published → Display "Assignment not available" error
- System unavailable → Display system error message

## UI Elements
- Assignment title and description
- Deadline information
- Score weight percentage
- Submission policy information
- Text input field (required)
- Link input field (optional, with URL validation)
- Submit button (enabled/disabled based on assignment status)