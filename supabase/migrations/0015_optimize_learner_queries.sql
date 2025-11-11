-- 학습자 코스 API 쿼리 성능 최적화
-- 주요 인덱스:
-- 1. 공개 코스 목록 조회: (status, deleted_at, published_at)
-- 2. 수강신청 확인: (user_id, course_id, status)
-- 3. 사용자 조회: (id)

-- ============================================
-- 1. courses 테이블 복합 인덱스
-- ============================================

-- 공개 코스 목록 조회 최적화
-- Query: SELECT * FROM courses WHERE status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS idx_courses_published_active
ON courses(status, deleted_at, published_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;

-- ============================================
-- 2. enrollments 테이블 복합 인덱스
-- ============================================

-- 사용자의 수강신청 조회 최적화
-- Query: SELECT * FROM enrollments WHERE user_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status
ON enrollments(user_id, status)
WHERE status = 'active';

-- 코스별 수강생 수 확인 최적화
-- Query: SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
ON enrollments(course_id, status)
WHERE status = 'active';

-- ============================================
-- 3. users 테이블 인덱스 (이미 존재할 수 있음)
-- ============================================

-- 강사 정보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_id
ON users(id);

-- ============================================
-- 4. categories/difficulties 인덱스
-- ============================================

-- 활성 카테고리 조회 최적화
CREATE INDEX IF NOT EXISTS idx_categories_is_active
ON categories(is_active)
WHERE is_active = TRUE;

-- 활성 난이도 조회 최적화
CREATE INDEX IF NOT EXISTS idx_difficulties_is_active
ON difficulties(is_active)
WHERE is_active = TRUE;

-- ============================================
-- 5. 분석용 인덱스
-- ============================================

-- 코스별 등록 현황 분석 (최근 수강신청 순)
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at
ON enrollments(enrolled_at DESC);

-- 카테고리별 코스 분포
CREATE INDEX IF NOT EXISTS idx_courses_category_status
ON courses(category_id, status)
WHERE deleted_at IS NULL;

-- ============================================
-- 인덱스 통계 수집
-- ============================================

-- PostgreSQL이 쿼리 최적화를 위해 통계를 수집하도록 강제
ANALYZE courses;
ANALYZE enrollments;
ANALYZE users;
ANALYZE categories;
ANALYZE difficulties;

-- ============================================
-- 쿼리 실행 계획 예시
-- ============================================

-- 다음 쿼리들이 인덱스를 효과적으로 사용하도록 최적화됨:

-- 1. 공개 코스 목록 조회 (페이지네이션)
--    EXPLAIN ANALYZE
--    SELECT * FROM courses
--    WHERE status = 'published' AND deleted_at IS NULL
--    ORDER BY published_at DESC
--    LIMIT 10 OFFSET 0;

-- 2. 사용자의 수강신청 코스 조회
--    EXPLAIN ANALYZE
--    SELECT * FROM enrollments
--    WHERE user_id = 'user-id' AND status = 'active';

-- 3. 코스별 활성 수강생 수
--    EXPLAIN ANALYZE
--    SELECT COUNT(*) FROM enrollments
--    WHERE course_id = 'course-id' AND status = 'active';

-- ============================================
-- 성능 모니터링
-- ============================================

-- 느린 쿼리 확인 (pg_stat_statements 활성화 필요)
-- SELECT query, calls, mean_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%courses%' OR query LIKE '%enrollments%'
-- ORDER BY mean_exec_time DESC;
