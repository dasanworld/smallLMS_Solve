# Feature 007: Instructor 대시보드

## Use Case Description
강사가 자신의 대시보드에 접근하여 코스 및 제출물 상태를 확인하는 기능

## Primary Actor
Instructor (Registered User with instructor role)

## Trigger
Instructor accesses the instructor dashboard

## Precondition
- User must be authenticated as an Instructor
- User must have at least one course created or assigned
- System must be operational

## Main Flow
1. Instructor logs in with instructor credentials
2. System validates user role as instructor
3. System redirects to instructor dashboard
4. System retrieves and displays:
   - List of instructor's courses (draft/published/archived)
   - Count of pending grading assignments
   - List of recent submissions
5. Instructor can navigate to different sections of the dashboard
6. System updates dashboard metrics in real-time

## Alternative Flows
### No Courses Available
- If instructor has no courses, display "No courses available"
- Provide option to create a new course

### Multiple Courses
- Display all courses with their current status
- Show metrics for each course separately

## Postcondition
- Instructor can view all their courses and their statuses
- Pending grading count is displayed accurately
- Recent submissions are visible
- Dashboard reflects current system state

## Business Rules
- Only instructors can access instructor dashboard
- Dashboard shows only courses owned by the instructor
- Course statuses are displayed as draft/published/archived
- Pending grading count includes only ungraded submissions
- Recent submissions are ordered by submission date (newest first)
- Metrics are updated in real-time or with manual refresh

## Error Conditions
- Not authenticated → Redirect to login
- Invalid role → Access denied
- System failure → Display system error message
- Database unavailable → Display appropriate error message
- No courses found → Display "Create your first course" message

## UI Elements
- Course list with status indicators
- Pending grading counter
- Recent submissions list
- Course status filters
- Navigation menu to course management
- Quick actions (create course, view analytics)
- Dashboard metrics summary
- Course titles and basic information