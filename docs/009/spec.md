# Feature 009: 과제 관리 (Instructor)

## Use Case Description
강사가 과제를 생성, 수정, 상태 전환하고 제출물을 관리하는 기능

## Primary Actor
Instructor (Registered User with instructor role)

## Trigger
Instructor accesses assignment management section

## Precondition
- User must be authenticated as an Instructor
- User must own the course where assignment is being managed
- System must be operational

## Main Flow
1. Instructor navigates to assignment management within a course
2. Instructor selects to create new assignment or edit existing assignment
3. For new assignment:
   - Instructor fills in assignment details (title, description, deadline)
   - Instructor sets scoring information (points, weight percentage)
   - Instructor configures policies (late submission, resubmission)
   - System saves assignment as draft
4. For existing assignment:
   - Instructor selects assignment to edit
   - System loads assignment details
   - Instructor modifies assignment information
   - System saves changes
5. Instructor can change assignment status (draft/published/closed)
6. System processes status changes:
   - draft → published: Assignment becomes visible to enrolled learners
   - Automatic status change: At midnight UTC daily, published assignments past deadline become closed
7. System displays submission filters (ungraded/late/resubmission required)
8. Instructor can view and manage submitted assignments

## Alternative Flows
### Publishing Assignment
- When changing from draft to published:
  - Assignment becomes visible to enrolled learners
  - Learners can view assignment details
  - Submission functionality becomes available if not past deadline

### Automatic Closing
- System runs cron job daily at midnight UTC
- Identifies published assignments with past deadlines
- Changes status to closed automatically
- Prevents further submissions but allows grading

### Status Validation
- If assignment is closed, learners cannot submit
- If assignment is draft, it's not visible to learners
- Published assignments are visible and accepting submissions (if not past deadline)

## Postcondition
- Assignment information is updated in the system
- Assignment status changes are reflected to learners
- Submission filtering options are available to instructor
- Assignment list is updated in course view

## Business Rules
- Only course owners can manage assignments within that course
- Assignment deadlines must be in the future when publishing
- Published assignments become visible to enrolled learners only
- Late submission policy is fixed once assignment is published
- Resubmission policy is fixed once assignment is published
- Assignment scores must be within valid range
- Weight percentages must add up to 100% for all assignments in a course
- Server scheduler automatically closes past-deadline assignments daily

## Error Conditions
- Not authenticated → Redirect to login
- Not course owner → Access denied
- Invalid deadline (past date when publishing published assignment) → Display error
- Invalid score values → Display validation error
- System failure → Display system error message
- Database unavailable → Display appropriate error message
- Missing required fields → Display specific field errors

## UI Elements
- Assignment creation form with fields for title, description, deadline
- Scoring configuration (points, weight percentage)
- Policy configuration (late submission, resubmission checkboxes)
- Assignment status selector (draft/published/closed)
- Save/Update buttons
- Assignment list with status indicators
- Submission filters (ungraded, late, resubmission required)
- Deadline calendar picker
- Automatic closing status indicator