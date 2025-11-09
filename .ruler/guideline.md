# AI Coding Agent Guidelines

## TypeScript Error Prevention
Use proper type assertions when accessing Supabase query results with nested objects.
Handle asynchronous functions correctly for API routes that return Promises.
Check for null/undefined values before accessing object properties.
Never use async/await in React Client Components.
Always use specific values instead of empty strings for SelectItem components.

## Linting Error Prevention
Use `const` instead of `let` when variables are not reassigned.
Avoid async functions in React Client Components where possible.

## Supabase Query Handling
Avoid complex relational queries that return arrays instead of objects.
Fetch related data in separate queries for clearer type handling.
Use type assertions for nested object structures from database joins.

## Authentication Implementation
Include Supabase session tokens in API requests using axios interceptors.
Handle asynchronous authentication functions properly.
Use `await` when calling authentication helper functions.
Add Authorization headers with Bearer tokens for protected endpoints.

## Code Quality
Maintain consistent variable declaration patterns.
Use appropriate error handling for database operations.
Validate response data against defined schemas.

## Next.js App Router
Remove 'use client' directive when using async/await in page components.
Use Promise types for params and searchParams in Server Components.
Initialize state with non-empty string values for Select components.

## Component Design
Avoid empty string values in SelectItem components.
Use descriptive placeholder values like 'all', 'none', or 'default'.
Implement proper conditional rendering for UI state management.

## Hono API Routes
Always include `/api` prefix in Hono route paths.
Use proper error handling with `success`/`failure`/`respond` patterns.
Validate request data with zod schemas before processing.

## Environment Variables
Always validate environment variables with fallbacks.
Use `NEXT_PUBLIC_SUPABASE_URL` as fallback when `SUPABASE_URL` is not available.

## React Hooks and State Management
Follow React Query patterns for server state management.
Use proper cache keys that include relevant parameters.
Handle loading and error states appropriately in UI components.

## Foreign Key Constraints
Be aware of Supabase auth.users foreign key relationships.
Only insert records when referenced auth users exist.
Comment out code that would violate foreign key constraints with instructions.

## Zod Schema Validation
Validate all API inputs and outputs with zod schemas.
Use proper error handling when schema validation fails.
Apply transforms when necessary to convert data formats.

## Response Handler Functions
Always call `respond(c, result)` with context parameter, not `respond(status, data)`.
Use `respond()` function to convert HandlerResult to HTTP Response for Hono routes.
Apply `as any` type assertion when necessary for complex generic types.
Return `respond(c, result)` for all Hono route handlers to ensure proper HTTP responses.

## API Endpoint Routing
Use correct API endpoint paths consistently across application.
Update redirect paths to match actual route definitions after path changes.
Auto-login after signup using signInWithPassword for session establishment.

## Hono Route Handler Types
Always specify `Hono<AppEnv>` type for route registrars.
Use `c.get('supabase')`, `c.get('logger')`, `c.get('user')` instead of `c.get('dependencies')`.
Apply `zValidator` type assertions with `as any` when middleware order conflicts.
Manually parse request body with `c.req.json()` when zValidator has type issues.

## Supabase Nested Relationships
Handle Supabase nested query results as either objects or arrays.
Use conditional checks to determine if nested data is array or object: `Array.isArray(data) ? data[0] : data`.
Remove `!inner` operator from relationship selects to avoid forced array returns.
Access nested properties safely after type assertions for nested structures.

## Dashboard and Authentication
Unify profile fetching across all dashboard pages using same API endpoint.
Use `useCurrentUser()` hook consistently for authentication state.
Implement role-based access control by checking `user.role` against expected value.
Ensure auto-login after signup to establish session before dashboard redirect.

## Generic Type Constraints
Use `typeof errorCodes[keyof typeof errorCodes]` for error code generic types.
Never use custom error type unions when string literal type works.
Apply proper type constraints in HandlerResult<Data, ErrorCode, Details>.

## Compile Error Prevention
Ensure all imported functions are actually exported from modules.
Match function parameter types exactly with expected service function signatures.
Apply type assertions for Supabase query results due to schema inference limitations.
Test build before assuming all type errors are resolved.

## Variable Scope Management
Never declare variables with the same name in nested scopes (e.g., `supabase` in same function).
Check variable re-declaration before writing new code in existing blocks.

## Handler Result Type Safety
Use `.data` property for successful results, `.error` for failures in HandlerResult.
Never use `.value` when accessing HandlerResult contents.
Access error properties via `(result as any).error?.message` for error state handling.

## Error Code Format Consistency
Define error codes as string literals, not objects: `ERROR_CODE: 'ERROR_CODE'`.
Use `(typeof errorCodes)[keyof typeof errorCodes]` pattern for error code typing.
Standardize error code format across all feature modules (assignment, course, enrollment, etc).

## Failure Function Parameter Order
Call `failure(statusCode, errorCode, message, details?)` with correct parameter sequence.
Never swap status code and error code positions in failure calls.

## Domain Entity Status Enums
Verify schema-defined status values before using in code conditionals.
For course status: use `'published' | 'draft' | 'archived'`, never `'active'`.
Create separate type definitions for different status enums (CourseStatus, ReportStatus, etc).

## Logger Type Consistency
Use `AppLogger` type from `@/backend/hono/context` for all logger implementations.
Never import external logger libraries like `pino` without verification.
Use AppLogger methods: `info()`, `error()`, `warn()`, `debug()` only.

## API Response Schema Design
Distinguish between base entity schema (Course) and detailed schema (CourseDetailResponse).
Include additional fields in detail schemas (e.g., instructor_name, category object).
Fetch supplementary data in service layer before returning to client.

## Supabase Nested Query Handling
Split complex relational queries into separate sequential queries.
Avoid `.select('table(nested_field)')` patterns for type safety.
Query foreign key relationships separately: fetch parent, then child by ID.

## StatusCode Type Validation
Use only valid HTTP status codes from Hono's ContentfulStatusCode type.
Avoid non-standard codes like 204; use 200 for success responses.
Verify status code availability in type definitions before implementation.

## Dependency Module Imports
Check all imported modules exist before compilation.
Verify @/components/ui/* components are installed in project.
Use `shadcn-ui` CLI to install missing UI components before usage.

## Type Object vs Primitive Handling
Distinguish between object properties (e.g., `category: CategorySchema`) and IDs (e.g., `category_id: number`).
Handle rendering logic: check if property is object or string before accessing nested fields.
Use conditional rendering: `typeof field === 'string' ? field : field.name`.

## Cast Assertion Usage
Use `as const` for immutable literals in error code definitions.
Apply `as any` only when TypeScript inference fails; document reason.
Prefer explicit types over excessive type assertions.

## Datetime Input Form Handling
Always convert `datetime-local` input (YYYY-MM-DDTHH:mm) to ISO 8601 string format for API requests.
Use `getFullYear()`, `getMonth()`, `getDate()` (not UTC variants) for local timezone conversion.
Handle bidirectional conversion: local format for input display, ISO for form state and API.
Store date state in ISO 8601 format internally; convert to local on render with watched form values.

## Form Submission Data Integrity
Always explicitly include required fields from props in submit payload; don't rely on form state alone.
Pass prop values directly to override form state when field is external (e.g., courseId from URL param).
Create intermediate submitData object combining form data with prop overrides before mutation.
Verify all required fields exist in payload before sending to API.

## API Request Payload Construction
Include all required fields defined in Zod request schema within request body.
Don't assume fields in URL path are automatically in request body; include explicitly.
Verify payload structure matches backend schema with console logs before API call.
Log request endpoint, payload, and response for debugging API integration issues.

## React Hook Form with Complex Fields
Never rely on register() alone for non-standard input types; manually manage state with setValue().
Use watched form values for bidirectional binding with datetime-local inputs.
Apply onChange handlers to convert input formats (local ↔ ISO) at event level.
Handle form validation by passing complete data object to mutation, not form state alone.

## Component Props Passing
Pass required context data as props to child components that need it (courseId, etc).
Use prop values in component logic rather than deriving from URL params separately.
Accept prop in component and use it directly in data submission logic.
Avoid relying on URL params inside child components; use props for data flow.

## Form Component API Integration
Update AssignmentList component to accept assignments array directly as prop.
Remove duplicate API calls from child components; use data fetched in parent page component.
Pass pre-fetched data to child components via props instead of calling API again.
Render child components only after parent has successfully loaded data to avoid double-fetching.

## Calendar/Datetime Picker Implementation
Use native HTML5 `input[type="datetime-local"]` for cross-browser compatibility.
Never use double-click or blur handlers on datetime inputs; causes format errors.
Keep calendar open until form submission; don't auto-close on date selection.
Display today's date as reference in datetime picker (use defaultValue or value prop).
Convert input value format at onChange event, store ISO 8601 internally, display local format in UI.

## Error Messages and Debugging
Log complete API request details: endpoint, payload, headers for failed requests.
Extract error details from response.data.details array for specific field errors.
Display user-friendly error message extracted from Axios error response data.
Include error code and detailed error information in console logs for debugging.

## Query Data Undefined Prevention
Never return null from React Query queryFn without data; throw error instead.
React Query expects either data return or error throw; returning undefined causes crash.
Handle empty/null responses explicitly: return default data or throw Error with message.
Use enabled flag to prevent queries from running when dependencies are unavailable.
Set retry: 1 or retry: false to avoid repeated failed requests for non-retryable errors.

## Global Navigation and Authentication Context
Fetch user profile with role information only after authentication is confirmed.
Use conditional checks: return null while loading instead of rendering with missing data.
Load role-based menu items after profile data is available; never assume role.
Apply type-safe role checks: cast profile.role to UserRole type before switch statement.

## Hydration Mismatch Prevention
Ensure server and client render identical HTML; avoid conditional rendering based on state.
Use useState with useEffect to defer client-only rendering after mount.
Never render different content on server vs client (e.g., different role initially).
Check mounted state before rendering dynamic content that differs between server/client.

## Component Props Type Validation
Verify all component props are passed with correct types from parent components.
Ensure child components accept props that parent components provide (avoid prop mismatch).
Use TypeScript interface to define expected props; generate errors if props don't match.
Pass context data explicitly via props rather than deriving from components.

## Course Edit Page Props Integration
Pass initial form data via initialData prop, not course prop.
Use UpdateCourseRequestSchema for edit forms; CreateCourseRequestSchema for creation.
Implement handleFormSubmit callback that receives form data and sends to backend.
Extract courseId from URL params and pass to form submission handler explicitly.

## Supabase Query Result Handling
Use `.maybeSingle()` instead of `.single()` when query may return zero rows.
`.single()` throws error if result is not exactly one row; `.maybeSingle()` returns null safely.
Apply proper type assertions for nested query results: `as { data: Type; error: any }`.
Handle optional/nullable results with conditional checks before property access.