-- Migration: Add Soft Delete and Metadata Active Flags
-- Description: CTO 리뷰 반영 - 소프트 삭제 및 메타데이터 비활성화 정책 구현
-- Date: 2024-11-08

-- ============================================================================
-- 1. users 테이블에 deleted_at 추가
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

COMMENT ON COLUMN users.deleted_at IS '소프트 삭제 시각. NULL이면 활성, 값이 있으면 삭제됨';

-- ============================================================================
-- 2. courses 테이블에 deleted_at, archived_at 추가
-- ============================================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_courses_deleted_at ON courses(deleted_at);

COMMENT ON COLUMN courses.deleted_at IS '소프트 삭제 시각. 코스 삭제 시 관련 데이터 보존';
COMMENT ON COLUMN courses.archived_at IS '아카이브 시점 기록. published → archived 전환 시 설정';

-- ============================================================================
-- 3. assignments 테이블에 deleted_at, closed_at 추가
-- ============================================================================
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_assignments_deleted_at ON assignments(deleted_at);

COMMENT ON COLUMN assignments.deleted_at IS '소프트 삭제 시각. 제출물 이력 보존';
COMMENT ON COLUMN assignments.closed_at IS '마감 시점 기록 (자동/수동 마감)';

-- ============================================================================
-- 4. categories 테이블에 is_active 추가
-- ============================================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

COMMENT ON COLUMN categories.is_active IS '활성 상태. FALSE면 신규 코스 생성 시 선택 불가';

-- categories 테이블 updated_at 트리거 추가
CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON categories
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. difficulties 테이블에 is_active 추가
-- ============================================================================
ALTER TABLE difficulties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE difficulties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_difficulties_is_active ON difficulties(is_active);

COMMENT ON COLUMN difficulties.is_active IS '활성 상태. FALSE면 신규 코스 생성 시 선택 불가';

-- difficulties 테이블 updated_at 트리거 추가
CREATE TRIGGER update_difficulties_updated_at 
BEFORE UPDATE ON difficulties
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. courses 외래 키 제약 조건 변경 (CASCADE → RESTRICT)
-- ============================================================================
-- 기존 외래 키 제약 조건 삭제
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_owner_id_fkey;

-- 새로운 제약 조건 추가 (ON DELETE RESTRICT)
ALTER TABLE courses ADD CONSTRAINT courses_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES users(id) 
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT courses_owner_id_fkey ON courses IS 
  '강사 삭제 시 소유 코스 먼저 처리 필요. CASCADE 대신 RESTRICT 사용';

-- ============================================================================
-- 7. 기존 데이터 검증 (선택적)
-- ============================================================================
-- 기존 데이터는 모두 활성 상태로 간주
UPDATE categories SET is_active = TRUE WHERE is_active IS NULL;
UPDATE difficulties SET is_active = TRUE WHERE is_active IS NULL;

-- ============================================================================
-- 마이그레이션 완료 확인
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== Migration 0010 완료 ===';
  RAISE NOTICE '1. users.deleted_at 컬럼 추가 완료';
  RAISE NOTICE '2. courses.deleted_at, archived_at 컬럼 추가 완료';
  RAISE NOTICE '3. assignments.deleted_at, closed_at 컬럼 추가 완료';
  RAISE NOTICE '4. categories.is_active 컬럼 추가 완료';
  RAISE NOTICE '5. difficulties.is_active 컬럼 추가 완료';
  RAISE NOTICE '6. courses.owner_id 외래 키 제약 조건 변경 완료 (RESTRICT)';
  RAISE NOTICE '=== 소프트 삭제 및 메타데이터 비활성화 정책 적용 완료 ===';
END $$;

