-- Migration: Fix assignments and submissions schema
-- Description: Add missing instructor_id to assignments and fix submissions schema

-- 1. Add instructor_id to assignments table
ALTER TABLE assignments
ADD COLUMN instructor_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 2. Create index for instructor_id
CREATE INDEX idx_assignments_instructor_id ON assignments(instructor_id);

-- 3. Update submissions table to allow content to be nullable
-- First, we need to handle any existing NOT NULL constraint if present
-- PostgreSQL doesn't have a direct ALTER COLUMN NOT NULL to NULL in older versions
-- So we'll check if there's actually a NOT NULL constraint to remove

-- Try to alter the constraint
DO $$
BEGIN
  ALTER TABLE submissions ALTER COLUMN content DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  -- If it fails, the constraint might not exist
  NULL;
END $$;

-- 4. Add course_id to submissions if it doesn't exist
-- (checking if column exists first)
DO $$
BEGIN
  ALTER TABLE submissions ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
EXCEPTION WHEN DUPLICATE_COLUMN THEN
  NULL;
END $$;

-- 5. Create index for course_id in submissions
CREATE INDEX IF NOT EXISTS idx_submissions_course_id ON submissions(course_id);

-- 6. Add instructions column to assignments if it doesn't exist
DO $$
BEGIN
  ALTER TABLE assignments ADD COLUMN instructions TEXT;
EXCEPTION WHEN DUPLICATE_COLUMN THEN
  NULL;
END $$;
