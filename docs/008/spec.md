# Feature 008: 코스 관리 (Instructor)

## Use Case Description
강사가 자신의 코스를 생성, 수정, 상태 전환하는 기능

## Primary Actor
Instructor (Registered User with instructor role)

## Trigger
Instructor accesses course management section

## Precondition
- User must be authenticated as an Instructor
- User must have permission to create/manage courses
- System must be operational

## Main Flow
1. Instructor navigates to course management section
2. Instructor selects to create new course or edit existing course
3. For new course:
   - Instructor fills in course details (title, introduction, category, difficulty)
   - Instructor defines curriculum/assignments
   - System saves course as draft
4. For existing course:
   - Instructor selects course to edit
   - System loads course details
   - Instructor modifies course information
   - System saves changes
5. Instructor can change course status (draft/published/archived)
6. System validates and processes status changes:
   - draft → published: Course becomes publicly visible
   - published → archived: New enrollments blocked
7. System updates course information in database

## Alternative Flows
### Publishing Course
- When changing from draft to published:
  - System validates all required fields are completed
  - Course becomes visible to learners in catalog
  - Enrollment becomes available

### Archiving Course
- When changing from published to archived:
  - System blocks new enrollments
  - Existing learners can still access content
  - Course remains visible to enrolled learners

### Validation Failures
- If required fields are missing, display validation errors
- If invalid data is entered, display specific error messages

## Postcondition
- Course information is updated in the system
- Course status changes are reflected in the UI
- Learners see appropriate changes based on status
- Course metrics are updated accordingly

## Business Rules
- Only course owners can edit course details
- Course titles must be unique per instructor
- Categories and difficulty levels must be from predefined lists
- Published courses are visible to all learners
- Archived courses block new enrollments but maintain existing ones
- Course status changes are logged for audit purposes
- Required fields must be filled before publishing

## Error Conditions
- Not authenticated → Redirect to login
- Not course owner → Access denied
- Invalid data format → Display validation errors
- System failure → Display system error message
- Database unavailable → Display appropriate error message
- Missing required fields → Display specific field errors

## UI Elements
- Course creation form with fields for title, introduction, category, difficulty
- Curriculum/assignment management section
- Course status selector (draft/published/archived)
- Save/Update buttons
- Course preview functionality
- Validation error messages
- Course list with status indicators
- Edit/Delete actions for courses