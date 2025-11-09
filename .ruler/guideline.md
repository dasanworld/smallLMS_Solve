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