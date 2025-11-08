# 데이터베이스 설계 문서

## 간략한 데이터 플로우

### 사용자 등록 및 온보딩
1. 사용자는 이메일/비밀번호로 인증 계정 생성
2. 역할(학습자/강사) 선택 및 프로필 정보 입력
3. 계정에 역할 정보 저장 및 기본 권한 부여

### 코스 탐색 및 수강
1. 학습자가 공개된 코스(Published 상태) 탐색
2. 수강신청 시 enrollments 테이블에 기록 생성
3. 학습자의 코스 목록 업데이트

### 과제 제출 및 피드백
1. 학습자가 과제 제출 (텍스트/링크)
2. 제출물은 submissions 테이블에 저장
3. 강사가 제출물을 채점 및 피드백 제공
4. 점수 및 상태 정보 업데이트

### 성적 집계
1. 과제별 점수와 비중에 따라 코스별 총점 계산
2. 학습자에게 성적 및 피드백 표시

---

## 데이터베이스 스키마

### 1. users - 사용자 기본 정보
```sql
-- 유저 정보 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    deleted_at TIMESTAMP WITH TIME ZONE, -- 소프트 삭제: NULL이면 활성, 값이 있으면 삭제됨
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로필 업데이트 시 자동으로 updated_at 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at); -- 소프트 삭제 필터링 성능 향상
```

**소프트 삭제 정책**: 사용자 삭제 요청 시 `DELETE` 대신 `deleted_at`에 현재 시각을 기록합니다. 모든 쿼리는 `WHERE deleted_at IS NULL` 조건을 포함해야 하며, 이를 통해 실수로 인한 데이터 유실을 방지하고 필요 시 복구 가능성을 확보합니다.

### 2. categories - 코스 카테고리
```sql
-- 카테고리 테이블
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE, -- 비활성화 정책: 사용 중인 메타데이터는 삭제 대신 비활성화
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_is_active ON categories(is_active); -- 활성 메타데이터 필터링
```

**메타데이터 관리 정책**: 운영자가 카테고리를 삭제할 때 물리적 `DELETE` 대신 `is_active = FALSE`로 변경합니다. 이미 코스에서 사용 중인 카테고리는 데이터 무결성을 위해 반드시 비활성화만 가능하며, 신규 코스 생성 시에는 `is_active = TRUE`인 항목만 선택 가능합니다.

### 3. difficulties - 난이도
```sql
-- 난이도 테이블
CREATE TABLE difficulties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE, -- 비활성화 정책: 사용 중인 메타데이터는 삭제 대신 비활성화
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_difficulties_name ON difficulties(name);
CREATE INDEX idx_difficulties_is_active ON difficulties(is_active); -- 활성 메타데이터 필터링
```

### 4. courses - 코스 정보
```sql
-- 코스 테이블
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- CASCADE 대신 RESTRICT: 강사 삭제 시 코스 먼저 처리 필요
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    difficulty_id INTEGER REFERENCES difficulties(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    enrollment_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE, -- 소프트 삭제: 코스 삭제 시 관련 데이터 보존
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE -- 아카이브 시점 기록
);

-- 코스 업데이트 시 자동으로 updated_at 갱신
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_courses_owner_id ON courses(owner_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_difficulty_id ON courses(difficulty_id);
CREATE INDEX idx_courses_created_at ON courses(created_at);
CREATE INDEX idx_courses_published_at ON courses(published_at);
CREATE INDEX idx_courses_deleted_at ON courses(deleted_at); -- 소프트 삭제 필터링
```

**코스 삭제 정책**: `ON DELETE RESTRICT`로 변경하여 강사 계정 삭제 시 소유 코스가 먼저 처리되도록 강제합니다. 코스 삭제는 `deleted_at`을 설정하는 소프트 삭제로 수행하며, 관련 수강 기록과 제출물은 보존됩니다.

```sql
-- 코멘트: enrollment_count는 비정규화된 칼럼으로, 데이터 정합성을 위해 데이터베이스 트리거(Trigger)를 사용하여 관리하는 것을 권장한다. 
-- enrollments 테이블에 status='active'로 레코드가 INSERT 될 때 +1, status가 'cancelled'로 UPDATE 될 때 -1을 수행하는 트리거를 생성한다.
```

### 5. enrollments - 수강 등록 정보
```sql
-- 수강 등록 테이블
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    
    -- 중복 수강 방지
    UNIQUE(user_id, course_id)
);

-- 인덱스
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

### 6. assignments - 과제 정보
```sql
-- 과제 테이블
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    points_weight DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- 점수 비중 (예: 0.3 = 30%)
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    allow_late BOOLEAN DEFAULT FALSE,
    allow_resubmission BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE, -- 소프트 삭제
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE -- 마감 시점 기록 (자동/수동)
);

-- 과제 업데이트 시 자동으로 updated_at 갱신
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_deleted_at ON assignments(deleted_at); -- 소프트 삭제 필터링
```

**과제 가중치 검증**: 과제 생성/수정 API는 트랜잭션 내에서 해당 코스의 모든 과제(deleted_at IS NULL) `points_weight` 합계를 재계산하고, 1.0(100%)을 초과하면 트랜잭션을 롤백합니다. 이 검증은 서비스 레이어에서 수행됩니다.

### 7. submissions - 과제 제출물
```sql
-- 제출물 테이블
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- 과제 내용 텍스트
    link TEXT, -- 관련 링크 (선택 사항)
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
    is_late BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2), -- 점수 (0.00~100.00)
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 제출물 업데이트 시 자동으로 updated_at 갱신
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_is_late ON submissions(is_late);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_graded_at ON submissions(graded_at);

-- 유저는 과제당 한 번만 제출 가능
CREATE UNIQUE INDEX idx_unique_user_assignment_sub ON submissions(user_id, assignment_id) WHERE status != 'resubmission_required';
```

### 8. user_terms_agreement - 이용 약관 동의 이력
```sql
-- 이용 약관 동의 이력 테이블
CREATE TABLE user_terms_agreement (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    terms_version VARCHAR(20) NOT NULL,
    agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

-- 인덱스
CREATE INDEX idx_user_terms_agreement_user_id ON user_terms_agreement(user_id);
CREATE INDEX idx_user_terms_agreement_agreed_at ON user_terms_agreement(agreed_at);
```

### 9. reports - 신고 내역 (운영용)
```sql
-- 신고 내역 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('course', 'assignment', 'submission', 'user')),
    target_id UUID NOT NULL, -- 신고 대상 ID
    reason VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 처리자
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_resolved_by ON reports(resolved_by);
```

## 주요 관계도

1. users (1) -- (N) courses: 강사가 여러 코스 소유
2. users (1) -- (N) enrollments: 사용자가 여러 코스 수강
3. courses (1) -- (N) enrollments: 코스에 여러 수강생
4. courses (1) -- (N) assignments: 코스에 여러 과제
5. assignments (1) -- (N) submissions: 과제에 여러 제출물
6. users (1) -- (N) submissions: 사용자가 여러 과제 제출

## 주요 제약 조건

1. 한 사용자는 한 과제를 중복 제출할 수 없음 (재제출 상태 제외)
2. 코스 상태가 'published'인 경우에만 수강 신청 가능
3. 과제는 'published' 상태일 때만 학습자가 열람/제출 가능
4. 마감일 후에는 과제 제출이 불가능 (지각 허용 정책에 따라 예외 가능)
5. 점수는 0~100 범위로 제한
6. 한 코스에 속한 모든 과제의 `points_weight` 총합은 1.0 (100%)을 초과할 수 없다. 이 제약은 과제를 생성하거나 수정하는 **API의 비즈니스 로직 레벨에서 트랜잭션 내 검증**한다.

## 삭제 및 보관 정책

### 소프트 삭제 (Soft Delete)
- **대상 테이블**: `users`, `courses`, `assignments`
- **구현**: `deleted_at` 컬럼에 삭제 시각 기록, 물리적 `DELETE` 금지
- **쿼리 규칙**: 모든 `SELECT` 쿼리는 `WHERE deleted_at IS NULL` 조건 포함 필수
- **목적**: 데이터 무결성 보장, 실수 방지, 복구 가능성 확보

### 메타데이터 비활성화
- **대상 테이블**: `categories`, `difficulties`
- **구현**: `is_active` 컬럼으로 활성/비활성 관리
- **정책**: 사용 중인 메타데이터는 물리적 삭제 불가, 비활성화만 가능
- **신규 생성**: `is_active = TRUE`인 항목만 선택 가능

### 외래 키 정책
- **users → courses**: `ON DELETE RESTRICT` - 강사 삭제 전 소유 코스 처리 필수
- **courses → assignments**: `ON DELETE CASCADE` - 코스 삭제 시 과제도 함께 소프트 삭제
- **users → submissions**: `ON DELETE RESTRICT` - 학습자 삭제 전 제출물 처리 필요
