# Feature 012: 운영 (Operator)

## Use Case Description
운영자가 시스템을 운영하고 관리하는 기능 (신고 처리, 메타데이터 관리)

## Primary Actor
Operator (System administrator with operator role)

## Trigger
Operator accesses the admin/operation panel

## Precondition
- User must be authenticated as an Operator
- User must have administrative privileges
- System must be operational

## Main Flow
1. Operator navigates to the admin/operation panel
2. System validates operator role and permissions
3. For Report Management:
   - System displays list of reports (courses/assignments/submissions/users)
   - Reports include reason and content provided by reporters
   - Reports are ordered by submission time (newest first)
   - Operator selects a report to process
   - Operator can filter reports by type (course/assignment/submission/user)
   - Operator can change report status: received → investigating → resolved
   - Operator can take actions: warning, invalidate submission, restrict account
4. For Metadata Management:
   - System displays current metadata (categories, difficulty levels)
   - Operator can create new metadata entries
   - Operator can modify existing metadata entries
   - Operator can deactivate metadata entries (recommended over deletion)
   - System validates that in-use metadata is not deleted
5. System logs all administrative actions
6. System sends notifications to affected users when appropriate

## Alternative Flows
### Report Processing
- If report is complex, operator can mark as "investigating" to indicate work in progress
- After investigation, operator can mark as "resolved" with resolution notes
- Operator can escalate reports that require higher-level attention

### Metadata Deactivation
- When deactivating metadata in use, system warns about impact
- System suggests alternatives before deactivation
- In-use metadata is typically deactivated rather than deleted to preserve historical data

### Bulk Actions
- Operator can process multiple reports of similar nature simultaneously
- Operator can apply same metadata changes to multiple entries

## Postcondition
- Reports are processed with appropriate status updates
- Administrative actions are logged for audit purposes
- Affected users are notified of actions taken
- System metadata is updated according to operator changes
- Operational metrics are updated

## Business Rules
- Only users with operator role can access administrative functions
- Report status follows the sequence: received → investigating → resolved
- Administrative actions must be logged for audit trail
- Notifications are sent to affected users when actions impact them
- In-use metadata should be deactivated rather than deleted
- All administrative actions require proper authorization
- Report handling should follow defined escalation procedures
- Sensitive user information should be protected during report processing

## Error Conditions
- Not authenticated → Redirect to login
- Insufficient privileges → Access denied
- Invalid action parameters → Display validation error
- System failure → Display system error message
- Database unavailable → Display appropriate error message
- Attempting to delete in-use metadata → Display warning and prevent action

## UI Elements
- Admin dashboard with report metrics
- Report list with filtering options (type, status, date)
- Report detail view with action buttons
- Report status change controls
- Administrative action options (warning, restriction, invalidation)
- Metadata management interface
- Create/modify metadata forms
- Metadata list with active/inactive indicators
- Action confirmation dialogs
- Audit log viewer
- Notification management