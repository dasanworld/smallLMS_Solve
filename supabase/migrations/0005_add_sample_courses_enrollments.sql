-- Add sample data for courses, categories, difficulties, and enrollments
-- This migration creates sample data for testing the course enrollment functionality
-- Note: To fully test enrollment functionality, you'll need to create auth users 
-- and corresponding records in the users table before running this migration.

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
  ('Programming', 'Programming and Development courses'),
  ('Data Science', 'Data Analysis, Machine Learning, and AI courses'),
  ('Design', 'UI/UX and Graphic Design courses'),
  ('Business', 'Business and Management courses'),
  ('Marketing', 'Digital Marketing and Strategy courses')
ON CONFLICT (name) DO NOTHING;

-- Insert sample difficulties
INSERT INTO difficulties (name, description, sort_order) VALUES
  ('Beginner', 'Suitable for beginners with no prior experience', 1),
  ('Intermediate', 'Requires basic understanding of the subject', 2),
  ('Advanced', 'For experienced individuals with deep knowledge', 3),
  ('Expert', 'For experts and professionals', 4)
ON CONFLICT (name) DO NOTHING;

-- Sample courses SQL (uncomment and adjust user IDs when you have existing users in the system)
/*
INSERT INTO courses (id, owner_id, title, description, category_id, difficulty_id, status, enrollment_count, published_at) VALUES
  ('223e4567-e89b-12d3-a456-426614175000', '<USER_ID_HERE>', 'Introduction to React', 'Learn the basics of React framework and component-based architecture', 1, 1, 'published', 2, NOW()),
  ('223e4567-e89b-12d3-a456-426614175001', '<USER_ID_HERE>', 'Advanced JavaScript Patterns', 'Deep dive into advanced JavaScript concepts and design patterns', 1, 3, 'published', 1, NOW()),
  ('223e4567-e89b-12d3-a456-426614175002', '<USER_ID_HERE>', 'Data Science Fundamentals', 'Comprehensive introduction to data science methodologies', 2, 1, 'published', 1, NOW()),
  ('223e4567-e89b-12d3-a456-426614175003', '<USER_ID_HERE>', 'UX Design for Beginners', 'Learn principles of user experience design', 3, 1, 'published', 0, NOW()),
  ('223e4567-e89b-12d3-a456-426614175004', '<USER_ID_HERE>', 'Python for Data Analysis', 'Using Python for data manipulation and visualization', 2, 2, 'published', 0, NOW()),
  ('223e4567-e89b-12d3-a456-426614175005', '<USER_ID_HERE>', 'Advanced TypeScript', 'Deep dive into TypeScript advanced features and best practices', 1, 3, 'draft', 0, NULL),
  ('223e4567-e89b-12d3-a456-426614175006', '<USER_ID_HERE>', 'Marketing Strategy', 'Develop effective marketing strategies for digital businesses', 5, 2, 'archived', 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- Sample enrollments SQL (uncomment and adjust user IDs when you have existing users in the system)
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, status) VALUES
  ('323e4567-e89b-12d3-a456-426614176000', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175000', NOW() - INTERVAL '2 days', 'active'),
  ('323e4567-e89b-12d3-a456-426614176001', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175000', NOW() - INTERVAL '1 day', 'active'),
  ('323e4567-e89b-12d3-a456-426614176002', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175001', NOW() - INTERVAL '3 days', 'active'),
  ('323e4567-e89b-12d3-a456-426614176003', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175002', NOW() - INTERVAL '4 days', 'active'),
  ('323e4567-e89b-12d3-a456-426614176004', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175000', NOW() - INTERVAL '5 days', 'cancelled'),
  ('323e4567-e89b-12d3-a456-426614176005', '<USER_ID_HERE>', '223e4567-e89b-12d3-a456-426614175004', NOW(), 'active')
ON CONFLICT (id) DO NOTHING;

-- Update enrollment counts in courses based on active enrollments
UPDATE courses 
SET enrollment_count = (
  SELECT COUNT(*) 
  FROM enrollments 
  WHERE enrollments.course_id = courses.id 
  AND enrollments.status = 'active'
)
WHERE id IN (
  SELECT DISTINCT course_id 
  FROM enrollments 
  WHERE status = 'active'
);
*/