# CTO 리뷰 반영 변경 이력

## 개요
2024년 CTO 리뷰에서 지적된 핵심 충돌 사항과 개선 권고를 문서 전반에 반영했습니다. 이 문서는 변경된 정책과 그 근거를 요약합니다.

---

## 1. 소프트 삭제 정책 도입 (CRITICAL)

### 문제점
- 기존 `ON DELETE CASCADE` 설정으로 강사 계정 삭제 시 모든 코스, 과제, 제출물이 연쇄 삭제되는 치명적 데이터 유실 위험 존재

### 해결책
- **대상 테이블**: `users`, `courses`, `assignments`에 `deleted_at TIMESTAMP WITH TIME ZONE` 컬럼 추가
- **외래 키 변경**: `users → courses` 관계를 `ON DELETE CASCADE`에서 `ON DELETE RESTRICT`로 변경
- **쿼리 규칙**: 모든 `SELECT` 쿼리에 `WHERE deleted_at IS NULL` 조건 포함 필수
- **복구 가능성**: 실수로 인한 삭제 시 `deleted_at`을 `NULL`로 되돌려 복구 가능

### 영향받은 문서
- `docs/database.md`: 스키마에 `deleted_at` 컬럼 추가, 인덱스 생성, 정책 섹션 신설
- `docs/userflow.md`: 코스/과제 삭제 플로우에 소프트 삭제 명시
- `docs/008/spec.md`: 코스 삭제 비즈니스 규칙에 소프트 삭제 정책 추가
- `docs/009/spec.md`: 과제 삭제 시 제출물 이력 보존 명시
- `docs/012/spec.md`: 운영자 삭제 승인 워크플로우에 소프트 삭제 정책 반영

---

## 2. 메타데이터 비활성화 정책 정합화 (CRITICAL)

### 문제점
- `docs/012/spec.md`에서는 "사용 중인 메타데이터는 삭제 대신 비활성화"라고 명시했으나, `database.md`의 `categories`, `difficulties` 테이블에는 상태 관리 컬럼이 없어 물리적 삭제만 가능한 구조적 충돌

### 해결책
- **스키마 변경**: `categories`, `difficulties` 테이블에 `is_active BOOLEAN DEFAULT TRUE` 컬럼 추가
- **API 구현**: 운영자가 삭제 요청 시 `UPDATE SET is_active = FALSE` 수행 (물리적 `DELETE` 금지)
- **UI 필터링**: 신규 코스/과제 생성 시 `is_active = TRUE`인 항목만 선택 가능
- **데이터 무결성**: 기존 코스/과제는 비활성화된 메타데이터 참조 유지

### 영향받은 문서
- `docs/database.md`: `is_active` 컬럼, 트리거, 인덱스 추가 및 정책 설명 추가
- `docs/012/spec.md`: 메타데이터 관리 플로우에 비활성화 정책 구체화 (CRITICAL 표시)
- `docs/userflow.md`: 운영자 플로우에 비활성화 정책 상세 명시
- `docs/008/spec.md`: 코스 생성 시 활성 메타데이터만 선택 가능하다는 규칙 추가

---

## 3. 코스 아카이브 시 접근 범위 명확화

### 문제점
- "기존 학습자는 콘텐츠에 접근할 수 있다"는 모호한 표현으로 인해 제출 가능 여부, 강사 권한 등이 불명확

### 해결책
- **명확한 정책 수립**:
  * 코스가 `archived` 상태가 되면 모든 `published` 과제를 자동으로 `closed`로 전환
  * 기존 수강생은 **읽기 전용 접근만 가능** (과제 설명, 자신의 제출물/성적 조회만 가능, 신규 제출 불가)
  * 강사는 기존 제출물 채점 가능하나 신규 과제 생성 불가
  * 공개 카탈로그에서는 숨김 처리, 수강생에게만 보임
- **타임스탬프 기록**: `archived_at` 컬럼으로 아카이브 시점 추적

### 영향받은 문서
- `docs/008/spec.md`: Archiving Course 섹션에 상세 정책 추가
- `docs/userflow.md`: 코스 아카이브 처리 플로우에 과제 상태 전환 및 접근 권한 명시
- `docs/database.md`: `courses` 테이블에 `archived_at` 컬럼 추가

---

## 4. 과제 가중치 트랜잭션 검증 명시

### 문제점
- "가중치 합계가 100%를 초과할 수 없다"는 규칙이 있으나, 동시성 문제나 부분 업데이트 시나리오(예: 과제 C를 30%→50%로 수정)에서 검증 실패 가능성 존재

### 해결책
- **트랜잭션 내 검증**: 과제 생성/수정 API는 데이터베이스 트랜잭션 내에서 수행
- **검증 로직**:
  1. 해당 코스의 모든 과제(WHERE deleted_at IS NULL) `points_weight` 합계 재계산
  2. 합계가 1.0 초과 시 트랜잭션 롤백
  3. 에러 코드 `ASSIGNMENT_WEIGHT_EXCEEDED` 반환
- **서비스 레이어 구현**: `src/features/assignment/backend/service.ts`에서 처리

### 영향받은 문서
- `docs/009/spec.md`: Business Rules에 트랜잭션 검증 절차 상세 명시
- `docs/userflow.md`: 과제 관리 플로우에 가중치 검증 및 에러 처리 추가
- `docs/database.md`: 주요 제약 조건에 트랜잭션 검증 명시
- `docs/api-policy.md`: 트랜잭션 정책 섹션에 과제 가중치 케이스 추가

---

## 5. API 인증 및 에러 처리 표준화

### 문제점
- 각 spec 문서에서 에러 조건이 일관성 없이 기술되어 있고, 인증/권한 처리 방식이 명시되지 않음

### 해결책
- **공통 정책 문서 신설**: `docs/api-policy.md` 작성
- **표준화 항목**:
  * 인증 미들웨어 (`requireAuth`) 및 역할 가드 (`requireRole`)
  * 에러 코드 체계 (UPPER_SNAKE_CASE)
  * 에러 응답 형식 (success/error 구조)
  * HTTP 상태 코드 매핑 (401/403/404/500 등)
- **모든 spec 문서에 API Requirements 섹션 추가**:
  * Authentication 요구사항
  * Authorization 규칙
  * 에러 코드 명시

### 영향받은 문서
- `docs/api-policy.md`: 신규 작성 (인증, 에러 처리, 페이지네이션, 라우트 규약 등 10개 섹션)
- `docs/004~012/spec.md`: Error Conditions에 에러 코드 추가, API Requirements 섹션 신설

---

## 6. 페이지네이션 정책 수립

### 문제점
- 목록형 API(코스 목록, 제출물 목록 등)에서 페이지네이션 요구사항이 없어 대량 데이터 조회 시 성능 문제 발생 가능

### 해결책
- **기본 규칙**: Offset-based pagination (limit/offset)
- **기본값**: `limit=20`, `offset=0`
- **최대값**: `limit=100` (성능 보호)
- **응답 형식**: `{ items: [...], pagination: { total, limit, offset, hasNext, hasPrev } }`
- **적용 대상**: 코스 목록, 제출물 목록, 신고 목록 등 모든 목록형 API

### 영향받은 문서
- `docs/api-policy.md`: 페이지네이션 섹션 신설 (요청 파라미터, 응답 형식, 구현 가이드)
- `docs/006/spec.md`, `docs/007/spec.md`: API Requirements에 페이지네이션 지원 명시

---

## 7. 실시간 대시보드 기술 범위 명확화

### 문제점
- "실시간 업데이트"라는 표현이 WebSocket, SSE, Polling 중 어떤 방식인지 불명확

### 해결책
- **기술 결정**: React Query 캐시 무효화(cache invalidation) 방식 사용
- **구현**: 제출/채점 후 관련 쿼리 키를 `invalidateQueries`로 갱신
- **명시**: WebSocket이나 SSE는 사용하지 않음 (서버 부하 최소화)

### 영향받은 문서
- `docs/007/spec.md`: API Requirements에 "Real-time Updates via React Query cache invalidation (not WebSocket)" 명시
- `docs/api-policy.md`: 개발 환경 설정 섹션에 HMR 지원 방식 설명

---

## 8. Hono 라우트 및 개발 환경 정책

### 문제점 (refactoring-plan 반영)
- `/api` 프리픽스 누락으로 라우트 동작 불일치
- 개발 환경에서 Hono 싱글턴 캐싱으로 HMR 미반영

### 해결책
- **라우트 규약**: 모든 Hono 라우트는 `/api` 프리픽스 필수 (예: `/api/courses/:id`)
- **싱글턴 관리**:
  * 프로덕션: 싱글턴 캐싱으로 성능 최적화
  * 개발: 매 요청마다 재생성하여 HMR 지원

### 영향받은 문서
- `docs/api-policy.md`: 라우트 규약 섹션 및 개발 환경 설정 섹션 신설

---

## 변경 요약표

| 문서 | 주요 변경 사항 | 우선순위 |
|------|--------------|---------|
| `docs/database.md` | 소프트 삭제 컬럼 추가, 메타데이터 `is_active` 추가, 외래 키 정책 변경, 삭제/보관 정책 섹션 신설 | CRITICAL |
| `docs/api-policy.md` | 신규 작성 (인증, 에러, 페이지네이션, 라우트, 트랜잭션 등 10개 섹션) | HIGH |
| `docs/userflow.md` | 코스/과제 관리 플로우에 소프트 삭제, 아카이브, 가중치 검증, 메타데이터 정책 반영 | HIGH |
| `docs/008/spec.md` | 코스 아카이브 정책 구체화, 소프트 삭제 규칙 추가 | HIGH |
| `docs/009/spec.md` | 과제 가중치 트랜잭션 검증 명시, 소프트 삭제 규칙 추가 | HIGH |
| `docs/012/spec.md` | 메타데이터 비활성화 정책 구체화 (CRITICAL 표시), 소프트 삭제 워크플로우 추가 | CRITICAL |
| `docs/004~011/spec.md` | API Requirements 섹션 추가 (인증, 권한, 에러 코드), Error Conditions에 HTTP 상태 코드 추가 | MEDIUM |

---

## 후속 작업 권장사항

### 즉시 수행 필요
1. **데이터베이스 마이그레이션 작성**:
   - `users`, `courses`, `assignments`에 `deleted_at` 컬럼 추가
   - `categories`, `difficulties`에 `is_active` 컬럼 추가
   - `courses`에 `archived_at`, `assignments`에 `closed_at` 컬럼 추가
   - 인덱스 생성 (`idx_*_deleted_at`, `idx_*_is_active`)
   - 외래 키 제약 조건 변경 (`users → courses` ON DELETE RESTRICT)

2. **백엔드 API 구현**:
   - `requireAuth`, `requireRole` 미들웨어 구현
   - 모든 쿼리에 `deleted_at IS NULL` 필터 적용
   - 과제 가중치 검증 트랜잭션 로직 구현
   - 메타데이터 비활성화 API 구현 (물리적 DELETE 금지)

3. **프론트엔드 업데이트**:
   - 에러 코드별 사용자 친화적 메시지 매핑
   - 페이지네이션 컴포넌트 구현
   - 메타데이터 선택 UI에서 `is_active = TRUE` 필터링

### 중기 계획
1. **테스트 작성**:
   - 소프트 삭제 시나리오 단위 테스트
   - 과제 가중치 검증 통합 테스트
   - 메타데이터 비활성화 E2E 테스트

2. **모니터링 구축**:
   - 소프트 삭제된 레코드 통계 대시보드
   - API 에러율 추적
   - 느린 쿼리 로그 분석

3. **문서화 보완**:
   - OpenAPI(Swagger) 명세 자동 생성
   - ERD 다이어그램 업데이트
   - 복구 절차 매뉴얼 작성

---

## 검토자 체크리스트

- [ ] 모든 `SELECT` 쿼리에 `WHERE deleted_at IS NULL` 조건 포함 확인
- [ ] 메타데이터 삭제 API가 `UPDATE` 사용하는지 확인 (물리적 `DELETE` 금지)
- [ ] 과제 생성/수정 API가 트랜잭션 내에서 가중치 검증하는지 확인
- [ ] 코스 아카이브 시 과제 자동 `closed` 전환 로직 구현 확인
- [ ] 모든 API 엔드포인트에 인증 미들웨어 적용 확인
- [ ] 에러 응답이 표준 형식(`{ success: false, error: { code, message } }`) 준수 확인
- [ ] 목록형 API에 페이지네이션 파라미터 지원 확인
- [ ] 개발 환경에서 Hono 싱글턴 캐싱 비활성화 확인

---

이 변경 이력은 CTO 리뷰에서 지적된 핵심 리스크를 해소하고, 시스템의 데이터 무결성과 일관성을 보장하기 위한 필수 개선사항을 반영한 것입니다. 모든 변경사항은 기존 PRD 및 비즈니스 요구사항과 호환되며, 추가적인 기능 확장을 위한 견고한 기반을 제공합니다.

