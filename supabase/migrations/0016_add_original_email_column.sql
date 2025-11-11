-- Add original_email column to users table for non-standard email formats
-- Migration to support non-standard email formats (e.g., 'test' instead of 'test@example.com')
-- The email column stores normalized format for Supabase compatibility
-- The original_email column stores the user's original input

BEGIN;

-- 이메일 검증을 비활성화하기 위해 원본 이메일을 별도로 저장
ALTER TABLE users
ADD COLUMN IF NOT EXISTS original_email VARCHAR(255) NULL;

-- original_email 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_original_email ON users(original_email);

-- Add comment for clarity
COMMENT ON COLUMN users.original_email IS 'Original email input from user (may not be in standard email format)';

COMMIT;

