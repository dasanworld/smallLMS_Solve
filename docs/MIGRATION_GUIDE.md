# Supabase 마이그레이션 가이드

## 개요

이 프로젝트는 Supabase를 사용하며, 모든 데이터베이스 변경사항은 마이그레이션 파일로 관리됩니다.

## 마이그레이션 파일 위치

```
supabase/migrations/
├── 01_lms_schema.sql          # LMS 기본 스키마
├── 0001_create_example_table.sql
├── 0005_add_sample_courses_enrollments.sql
├── 0010_add_soft_delete_columns.sql
├── 0011_add_assignment_constraints.sql
├── 0012_add_updated_at_to_enrollments.sql
├── 0013_fix_assignments_submissions_schema.sql
├── 0014_add_is_active_to_metadata.sql    # ← 최신 마이그레이션
└── 02_auth_onboarding.sql
```

## 마이그레이션 적용 방법

### 방법 1: Supabase CLI (권장)

```bash
# Supabase 로컬 개발 환경에서
supabase db push

# 또는 프로덕션 환경에서
supabase db push --db-url postgresql://...
```

### 방법 2: Supabase 대시보드 (웹UI)

1. Supabase 대시보드 접속 ([https://app.supabase.com](https://app.supabase.com))
2. 프로젝트 선택 → SQL Editor
3. 각 마이그레이션 파일의 내용을 복사하여 실행

### 방법 3: psql (직접 연결)

```bash
# 프로덕션 데이터베이스에 연결
psql "postgresql://postgres:password@db.project-id.supabase.co:5432/postgres"

# 마이그레이션 파일 실행
\i supabase/migrations/0014_add_is_active_to_metadata.sql
```

## 최신 마이그레이션: 0014_add_is_active_to_metadata.sql

### 목적

카테고리와 난이도 테이블에 다음 기능 추가:
- `is_active` 컬럼: 메타데이터 활성화/비활성화 제어
- `updated_at` 컬럼: 마지막 수정 시간 추적

### 변경사항

#### Categories 테이블
```sql
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### Difficulties 테이블
```sql
ALTER TABLE difficulties
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### 적용 후 확인

```sql
-- 마이그레이션 적용 확인
SELECT * FROM categories LIMIT 1;
-- is_active, updated_at 컬럼이 있는지 확인

SELECT * FROM difficulties LIMIT 1;
-- is_active, updated_at 컬럼이 있는지 확인
```

## 학습자 코스 API와 데이터베이스

### API 엔드포인트가 사용하는 테이블

| API 엔드포인트 | 사용 테이블 | 필요 컬럼 |
|---|---|---|
| GET `/api/learner/courses/available` | courses, categories, difficulties, users | `is_active` |
| GET `/api/learner/courses/enrolled` | enrollments, courses, categories, difficulties, users | - |
| POST `/api/learner/courses/{courseId}/enroll` | enrollments, courses | - |
| DELETE `/api/learner/courses/{courseId}/enroll` | enrollments | - |

### 데이터 구조

**courses 테이블** (기존)
- id, owner_id, title, description, category_id, difficulty_id, status, enrollment_count, created_at, updated_at, published_at, archived_at, deleted_at

**categories 테이블** (업데이트됨)
- id, name, description, created_at, **is_active** ✨, **updated_at** ✨

**difficulties 테이블** (업데이트됨)
- id, name, description, sort_order, created_at, **is_active** ✨, **updated_at** ✨

**enrollments 테이블** (기존)
- id, user_id, course_id, enrolled_at, status

**users 테이블** (기존)
- id, email, role, name, phone, created_at, updated_at

## 주의사항

### 🚨 프로덕션 환경
- 마이그레이션 적용 전 **반드시 백업**하세요
- 업무 시간 외에 적용하세요
- 적용 후 데이터 무결성 검증하세요

### ⚠️ 기존 데이터
- `is_active` 컬럼은 기본값 `TRUE`로 설정됩니다
- 기존 모든 카테고리와 난이도는 활성화 상태입니다
- 필요시 수동으로 비활성화할 수 있습니다:

```sql
UPDATE categories SET is_active = FALSE WHERE id = 1;
UPDATE difficulties SET is_active = FALSE WHERE id = 1;
```

## 마이그레이션 상태 확인

Supabase에서 마이그레이션 히스토리 보기:

1. 대시보드 → SQL Editor → "Migrations" 탭
2. 적용된 마이그레이션 목록 확인
3. 각 마이그레이션의 상태 (Success/Failed) 확인

## 문제 해결

### 마이그레이션 적용 실패

```
ERROR: column "is_active" of relation "categories" already exists
```

→ 이미 컬럼이 존재합니다. `CREATE TABLE IF NOT EXISTS` 확인하세요.

### 롤백이 필요한 경우

```sql
-- 수동 롤백 (마이그레이션 시스템 사용 불가)
ALTER TABLE categories DROP COLUMN IF EXISTS is_active;
ALTER TABLE categories DROP COLUMN IF EXISTS updated_at;
ALTER TABLE difficulties DROP COLUMN IF EXISTS is_active;
ALTER TABLE difficulties DROP COLUMN IF EXISTS updated_at;
```

## 다음 단계

1. ✅ 마이그레이션 파일 준비됨 (`0014_add_is_active_to_metadata.sql`)
2. ⬜ Supabase CLI 또는 웹UI로 적용
3. ⬜ 데이터베이스 확인 (`SELECT * FROM categories;`)
4. ⬜ API 테스트 실행 (`./scripts/test-learner-api.sh`)
5. ⬜ E2E 테스트 실행

## 참고 자료

- [Supabase 마이그레이션 문서](https://supabase.com/docs/guides/database/migrations)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
