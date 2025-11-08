# Feature 006: 성적 & 피드백 열람 (Learner)

## Use Case Description
학습자가 자신의 성적과 피드백을 조회하는 기능

## Primary Actor
Learner (Registered User with learner role)

## Trigger
Learner accesses the grades page

## Precondition
- User must be authenticated as a Learner
- User must have submitted assignments that have been graded
- Assignments must have been processed by instructors

## Main Flow
1. Learner navigates to the grades page
2. System validates learner's authentication and role
3. System retrieves all assignments submitted by the learner
4. System filters assignments to show only those with grades available
5. System calculates course totals based on assignment scores and weights
6. System displays:
   - Assignment titles and descriptions
   - Individual assignment scores (0-100 scale)
   - Late submission status
   - Resubmission status
   - Instructor feedback
   - Course total scores calculated as (assignment score × weight)
7. Learner can view detailed feedback for each assignment

## Alternative Flows
### No Graded Assignments
- If no assignments have been graded yet, display "No grades available"
- Show assignments that are pending grading

### Partial Course Completion
- If learner has multiple courses, show grades for each course separately
- Calculate totals per course independently

## Postcondition
- Learner can view all their grades and feedback
- Course totals are accurately calculated based on assignment weights
- Grade information is presented in an organized format

## Business Rules
- Only learner's own submissions are displayed
- Scores must be within 0-100 range
- Course totals are calculated as sum of (assignment score × weight percentage)
- Late submission status is indicated for each assignment
- Resubmission status is indicated for each assignment
- Feedback from instructors is displayed alongside scores
- Ungraded assignments show as "Pending" or "Not Graded"

## Error Conditions
- No authentication → Redirect to login
- Invalid user role → Access denied
- No submissions found → Display "No assignments submitted"
- System failure → Display system error message
- Database unavailable → Display appropriate error message

## UI Elements
- Course list with grade summaries
- Assignment list with individual scores
- Score values (0-100 scale)
- Late submission indicators
- Resubmission indicators
- Instructor feedback text
- Course total calculation
- Status indicators (graded/pending)
- Assignment titles and descriptions