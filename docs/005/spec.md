# Feature 005: 과제 제출/재제출 (Learner)

## Use Case Description
학습자가 과제를 제출하거나 재제출하는 기능

## Primary Actor
Learner (Registered User with learner role)

## Trigger
Learner clicks the submit button after filling in assignment content

## Precondition
- User must be authenticated as a Learner
- User must be enrolled in the course containing the assignment
- Assignment must be in 'published' state and not 'closed'
- Assignment must allow submissions based on deadline and policies

## Main Flow
1. Learner fills in the text field (required) and link field (optional)
2. Learner clicks the submit button
3. System validates input (text field required, link field must be valid URL format)
4. System checks assignment deadline and submission policies
5. If before deadline:
   - System creates/updates submission record with status 'submitted'
   - System sets late flag to false
6. If after deadline:
   - If late submission is allowed:
     - System creates/updates submission record with status 'submitted'
     - System sets late flag to true
   - If late submission is not allowed:
     - System blocks submission and displays error message
7. System updates learner dashboard with submission status
8. System displays success message to learner

## Alternative Flows
### For Resubmission
- If instructor has set status to 'resubmission_required'
- Learner can resubmit by updating the same submission record
- System updates content and link fields in existing record
- System recalculates late status based on current time vs deadline
- Status changes back to 'submitted'

### Validation Failure
- If text field is empty, display "Text content is required"
- If link field is not valid URL format, display "Please enter a valid URL"
- Submission is not processed

## Postcondition
- Submission record is created or updated in the database
- Learner's dashboard reflects the submission status
- Assignment progress is updated
- System logs submission event

## Business Rules
- Submissions before deadline are marked as not late
- Late submissions are allowed only if assignment policy permits
- Resubmissions are only allowed for assignments with 'resubmission_required' status
- When resubmitting, the same record is updated rather than creating a new one
- Link field must conform to URL format if provided
- Text field is mandatory for all submissions

## Error Conditions
- Assignment closed for submissions → Display deadline error
- Late submission not allowed → Display policy violation error
- Invalid input format → Display validation error
- Not enrolled in course → Display access error
- System failure → Display system error message

## UI Elements
- Text input field (required)
- Link input field (optional, with URL validation)
- Submit button
- Success/error messages
- Submission status indicator
- Deadline information
- Late submission policy information