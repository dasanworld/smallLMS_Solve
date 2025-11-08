# Course Management Feature Implementation Plan for Instructors

## 1. Overview

This plan outlines the implementation of the Course Management feature for instructors, allowing them to create, edit, and manage the status of their courses. The feature includes creating new courses, modifying existing courses, and changing course status (draft/published/archived).

## 2. Architecture Overview

The implementation will follow the existing project structure with:
- Frontend components in `/src/features/course/components`
- Backend API routes in `/src/features/course/backend`
- Service logic in `/src/features/course/backend/service.ts`
- Data transfer objects in `/src/features/course/lib/dto.ts`
- React hooks in `/src/features/course/hooks`

## 3. Database Schema Considerations

The existing `courses` table already supports the required functionality:
- `owner_id` - foreign key to identify course owner (instructor)
- `status` - enum field with values 'draft', 'published', 'archived'
- `deleted_at` - for soft deletion
- `published_at` and `archived_at` - timestamps for audit purposes
- `title`, `description`, `category_id`, `difficulty_id` - course details

## 4. Backend Implementation

### 4.1. New API Endpoints

1. **GET `/api/courses/my`** - Retrieve instructor's courses
2. **POST `/api/courses`** - Create new course
3. **GET `/api/courses/:id`** - Get specific course details
4. **PUT `/api/courses/:id`** - Update course details
5. **PATCH `/api/courses/:id/status`** - Update course status
6. **DELETE `/api/courses/:id`** - Soft delete course

### 4.2. Backend Schema Updates

Add new Zod schemas for course management:

```typescript
// Create course request schema
export const createCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category_id: z.number().nullable(),
  difficulty_id: z.number().nullable(),
});

// Update course request schema  
export const updateCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().optional(),
  category_id: z.number().nullable().optional(),
  difficulty_id: z.number().nullable().optional(),
});

// Update course status request schema
export const updateCourseStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});
```

### 4.3. Service Layer Implementation

Add new service functions to handle course management:

1. `getInstructorCoursesService` - Retrieve courses owned by instructor
2. `createCourseService` - Create new course with draft status
3. `getCourseByIdService` - Get specific course with validation
4. `updateCourseService` - Update course details
5. `updateCourseStatusService` - Handle status transitions with business rules
6. `deleteCourseService` - Soft delete course with validation

### 4.4. Business Logic Implementation

#### Course Status Transitions
- `draft` → `published`: Validate required fields, set `published_at`
- `published` → `archived`: Close all assignments, block new enrollments, set `archived_at`
- `archived` → `published`: Not allowed directly (must go through draft)
- `archived` → `draft`: Allow reactivation with warning

#### Validation Rules
- Only course owner can modify course
- Course titles must be unique per instructor
- Required fields validation before publishing
- Prevent deletion of courses with active enrollments

## 5. Frontend Implementation

### 5.1. New Components

1. **CourseManagementPage** - Main page for course management
2. **CourseForm** - Form for creating/editing courses
3. **CourseCardInstructor** - Enhanced course card for instructor view
4. **CourseStatusBadge** - Visual indicator for course status
5. **CourseListInstructor** - List of instructor's courses

### 5.2. React Hooks

1. `useInstructorCoursesQuery` - Fetch instructor's courses
2. `useCreateCourseMutation` - Create new course
3. `useUpdateCourseMutation` - Update course details
4. `useUpdateCourseStatusMutation` - Change course status
5. `useDeleteCourseMutation` - Delete course
6. `useCourseQuery` - Fetch specific course details

### 5.3. UI Implementation

#### Course Management Page
- Tabbed interface for "My Courses", "Create New"
- Responsive grid layout for course cards
- Status filters and sorting options
- Empty state handling

#### Course Form
- Title and description fields
- Category and difficulty selection
- Status selection with validation
- Save and preview functionality
- Validation error display

## 6. Implementation Steps

### Phase 1: Backend API Implementation

1. **Update schema.ts**
   - Add new Zod schemas for course management
   - Update Course type with additional fields if needed

2. **Update service.ts**
   - Implement `getInstructorCoursesService`
   - Implement `createCourseService`
   - Implement `getCourseByIdService`
   - Implement `updateCourseService`
   - Implement `updateCourseStatusService`
   - Implement `deleteCourseService`
   - Add comprehensive validation and error handling

3. **Update route.ts**
   - Register new API routes for course management
   - Add authentication and authorization middleware
   - Ensure only instructors can access endpoints
   - Add proper error handling and logging

### Phase 2: Frontend Components

1. **Create CourseListInstructor component**
   - Display courses with status indicators
   - Add filtering and sorting options
   - Implement responsive design

2. **Create CourseForm component**
   - Implement form with validation
   - Add category and difficulty selection
   - Implement status selection with business logic
   - Add error handling and user feedback

3. **Create CourseManagementPage**
   - Implement main page layout
   - Add navigation between sections
   - Implement responsive design

### Phase 3: Data Layer

1. **Create React Query hooks**
   - Implement data fetching hooks
   - Add caching and refetching logic
   - Implement optimistic updates where appropriate

2. **Update DTO**
   - Ensure Course type includes all necessary fields
   - Add any additional types needed for course management

### Phase 4: Integration and Testing

1. **Integrate components with backend**
   - Connect forms to API endpoints
   - Implement proper error handling
   - Add loading states

2. **Add validation and error handling**
   - Frontend validation
   - Backend validation
   - Error boundary implementation

3. **Testing**
   - Unit tests for service functions
   - Integration tests for API endpoints
   - Component tests for UI components

## 7. Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Verify user is instructor and course owner
3. **Input Validation**: Use Zod schemas for all inputs
4. **SQL Injection Prevention**: Use parameterized queries
5. **XSS Prevention**: Sanitize user inputs where appropriate

## 8. Error Handling

### Backend Error Codes
- `COURSE_NOT_FOUND` - Course doesn't exist
- `INSUFFICIENT_PERMISSIONS` - User doesn't own course
- `COURSE_TITLE_DUPLICATE` - Duplicate title for instructor
- `COURSE_CREATION_ERROR` - Failed to create course
- `COURSE_UPDATE_ERROR` - Failed to update course
- `COURSE_STATUS_CHANGE_ERROR` - Failed to change status
- `COURSE_DELETE_ERROR` - Failed to delete course
- `VALIDATION_ERROR` - Input validation failed

### Frontend Error Handling
- Display user-friendly error messages
- Implement error boundaries
- Provide retry functionality
- Show loading states

## 9. UI/UX Considerations

1. **Responsive Design**: Ensure functionality on all device sizes
2. **Loading States**: Show appropriate loading indicators
3. **Validation Feedback**: Clear error messages for invalid inputs
4. **Status Indicators**: Visual indicators for course status
5. **Accessibility**: Follow WCAG guidelines for accessibility
6. **User Guidance**: Tooltips and help text where needed

## 10. Future Enhancements

1. **Curriculum Management**: Add ability to define course curriculum/assignments
2. **Bulk Operations**: Batch status updates for multiple courses
3. **Course Analytics**: View enrollment statistics and performance
4. **Preview Mode**: Preview course before publishing
5. **Course Templates**: Save and reuse course templates
6. **Image Upload**: Add course cover images
7. **SEO Optimization**: Add meta tags and structured data for published courses