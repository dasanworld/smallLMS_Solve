# 📋 E2E 테스트 계획 (Playwright MCP 활용)

## 📌 목표
- **완전한 사용자 시나리오 커버**: 모든 주요 기능을 실제 사용자 관점에서 테스트
- **Chrome 브라우저만 테스트**: 클라이언트 개발 효율성을 위해 단일 브라우저 집중
- **자동화된 품질 보증**: 각 릴리스 전 자동으로 검증
- **빠른 피드백**: 개발 중 즉시 테스트 결과 확인

---

## 🎯 테스트 범위

### 1️⃣ 인증 (Auth) - 핵심 기능
```
✅ 회원가입 (Signup)
├─ 유효한 이메일로 회원가입 성공
├─ 중복된 이메일 거부
├─ 비밀번호 검증 (길이, 특수문자 등)
├─ 역할 선택 (learner/instructor)
└─ 가입 후 대시보드 자동 리다이렉트

✅ 로그인 (Login)
├─ 올바른 자격증명으로 로그인 성공
├─ 잘못된 비밀번호 거부
├─ 존재하지 않는 이메일 거부
├─ 로그인 후 역할별 대시보드 리다이렉트
└─ 세션 유지 확인

✅ 로그아웃 (Logout)
├─ 글로벌 네비게이션에서 로그아웃
├─ 세션 완전 종료 확인
├─ 로그아웃 후 보호된 페이지 접근 불가
└─ 랜딩페이지로 리다이렉트
```

### 2️⃣ 강의 관리 (Course) - 학습자 관점
```
✅ 강의 탐색 (Learner)
├─ 공개된 강의 목록 조회
├─ 강의 상세 정보 확인
├─ 카테고리별 필터링
├─ 난이도별 필터링
└─ 검색 기능

✅ 강의 수강신청 (Enrollment)
├─ "수강신청" 버튼 클릭
├─ 수강신청 성공 (버튼 상태 변경)
├─ 중복 수강신청 방지
├─ 수강신청 취소 기능
└─ 취소 후 재수강신청 가능

✅ 강의 관리 (Instructor)
├─ 강의 생성 (제목, 설명, 카테고리, 난이도)
├─ 강의 정보 수정
├─ 강의 발행 (draft → published)
├─ 강의 상태 확인
└─ 강의 삭제 (soft delete)
```

### 3️⃣ 대시보드 - 역할별
```
✅ 학습자 대시보드
├─ 수강 중인 강의 목록 표시
├─ 각 강의별 진도율 표시
├─ 강의 상세 링크 클릭
├─ 강의 취소 버튼 동작
├─ 과제 제출 현황 표시
└─ "새 강의 수강신청" 버튼 기능

✅ 강사 대시보드
├─ 생성한 강의 목록 (카드형)
├─ 각 강의별 학생 수 표시
├─ 새로고침 버튼 동작
├─ "강의 만들기" 버튼 링크
├─ 과제 관리 섹션 표시
├─ 총 과제 수 표시
└─ "모든 과제 보기" 링크

✅ 운영자 대시보드 (구성 예상)
├─ 전체 통계 조회
├─ 사용자 관리 기능
├─ 신고 관리 기능
└─ 메타데이터 관리
```

### 4️⃣ 과제 관리 (Assignment)
```
✅ 과제 생성 (Instructor)
├─ 강의 선택
├─ 과제 제목 입력
├─ 설명 입력
├─ 마감일 설정 (캘린더 선택)
├─ 점수 배점 입력
├─ "지각 제출 허용" 체크박스
├─ "재제출 허용" 체크박스
└─ 과제 발행

✅ 과제 목록 조회
├─ 강의별 과제 목록 표시 (카드형)
├─ 과제 상태 배지 (draft/published/closed)
├─ 마감일 표시
└─ 과제 상세 링크

✅ 과제 상세 조회
├─ 과제 정보 완전 표시
├─ 마감일 카운트다운
├─ 제출 상태 표시 (학습자)
├─ 수정 버튼 (강사만)
├─ 상태 변경 버튼 (강사: draft→published, published→closed)
└─ 삭제 버튼 (강사)

✅ 과제 수정 (Instructor)
├─ 기존 정보 로드
├─ 제목 수정
├─ 설명 수정
├─ 마감일 수정
├─ 배점 수정
├─ 체크박스 수정 가능
└─ 저장 성공

✅ 과제 상태 관리 (Instructor)
├─ Draft 상태: "발행" 버튼
├─ Published 상태: "마감" 버튼
├─ Closed 상태: 상태 변경 불가
└─ 상태 변경 후 즉시 반영
```

### 5️⃣ 채점 및 제출 (Grading & Submission)
```
✅ 과제 제출 (Learner)
├─ 과제 제출 페이지 접근
├─ 파일 업로드 / 텍스트 입력
├─ 제출 성공 메시지
├─ 제출 상태 업데이트
└─ 재제출 가능 (설정된 경우)

✅ 제출 조회 (Instructor)
├─ 과제별 제출 목록
├─ 학생 이름, 제출 시간, 상태 표시
├─ 지연 제출 표시
└─ 제출물 확인

✅ 채점 (Instructor)
├─ 제출물 보기
├─ 점수 입력
├─ 피드백 작성
├─ 채점 저장
└─ 채점 완료 표시
```

### 6️⃣ 글로벌 네비게이션
```
✅ 네비게이션 메뉴
├─ 역할별 메뉴 항목 표시
├─ "홈" 링크 동작
├─ "대시보드" 링크 동작
├─ "코스관리"/"강의 탐색" 링크
├─ "과제" 링크 동작
└─ "채점관리" 링크 (강사/운영자)

✅ 사용자 프로필 드롭다운
├─ 역할 표시 (강사/운영자/러너)
├─ 이메일 표시
├─ 로그아웃 버튼 동작
└─ 로그아웃 후 보호 페이지 접근 불가
```

### 7️⃣ 에러 처리 및 엣지 케이스
```
✅ 네트워크 에러
├─ API 요청 실패 시 에러 메시지
├─ 재시도 기능
└─ 사용자 친화적 메시지

✅ 세션 만료
├─ 세션 만료 감지
├─ 로그인 페이지로 리다이렉트
└─ 이전 경로 복구

✅ 권한 검증
├─ 학습자가 강사 페이지 접근 불가
├─ 강사가 학습자 과제 수정 불가
├─ 다른 강사 과제 수정 불가
└─ 운영자 페이지 접근 제한

✅ 데이터 검증
├─ 필수 필드 누락 시 에러
├─ 날짜 형식 검증
├─ 이메일 형식 검증
└─ 숫자 범위 검증
```

---

## 🏗️ 테스트 구조 및 파일 조직

### 현재 구조
```
e2e/
├── fixtures/
│   └── auth.ts              # 인증 픽스처 (로그인 사용자)
├── helpers/
│   ├── api.ts               # API 요청 헬퍼
│   └── page.ts              # 페이지 상호작용 헬퍼
├── tests/
│   ├── auth.spec.ts         # ✅ 인증 (회원가입, 로그인, 로그아웃)
│   ├── course.spec.ts       # ✅ 강의 관리
│   ├── dashboard.spec.ts    # ✅ 대시보드
│   ├── assignment.spec.ts   # ✅ 과제 관리
│   ├── enrollment.spec.ts   # 🆕 수강신청 (과제 관리에서 분리)
│   ├── grading.spec.ts      # 🆕 채점 및 제출
│   └── navigation.spec.ts   # 🆕 글로벌 네비게이션
├── README.md
└── (이 파일)
```

### 보강할 구조
```
e2e/
├── fixtures/
│   ├── auth.ts              # 기존
│   ├── users.ts             # 🆕 사용자 역할별 (learner, instructor, admin)
│   └── data.ts              # 🆕 테스트 데이터 (강의, 과제 등)
├── helpers/
│   ├── api.ts               # 기존
│   ├── page.ts              # 기존
│   ├── auth-helper.ts       # 🆕 인증 헬퍼 함수 추출
│   ├── course-helper.ts     # 🆕 강의 관련 헬퍼
│   ├── assignment-helper.ts # 🆕 과제 관련 헬퍼
│   └── navigation-helper.ts # 🆕 네비게이션 헬퍼
├── tests/
│   ├── (기존 파일들)
│   ├── enrollment.spec.ts   # 🆕 수강신청 플로우
│   ├── grading.spec.ts      # 🆕 채점 플로우
│   ├── navigation.spec.ts   # 🆕 네비게이션 테스트
│   ├── e2e-flows.spec.ts    # 🆕 전체 통합 시나리오
│   └── edge-cases.spec.ts   # 🆕 엣지 케이스 및 에러 처리
├── README.md
└── playwright-chrome.config.ts # 🆕 Chrome 전용 설정
```

---

## ⚙️ Playwright 설정 변경사항

### 현재 설정 (`playwright.config.ts`)
```
- 프로젝트: chromium, firefox, webkit, Mobile Chrome, Mobile Safari
- 병렬 처리: 기본 활성화
- 테스트 디렉토리: ./e2e
```

### 개선안 (`playwright-chrome.config.ts` 신규)
```
✅ 프로젝트: Chromium만 테스트
✅ 병렬 처리: 개발 중에는 2-4 workers (효율성)
✅ 재시도: 실패 시 1회 자동 재시도
✅ Timeout: 각 테스트 30초 (기본값)
✅ Trace: 실패 시에만 수집 (효율성)
✅ Screenshot: 실패 시에만 수집
✅ Video: 실패 시에만 수집
```

### 설정 파일 생성 방식
```bash
# Chrome 전용 설정으로 테스트 실행
npm run test:e2e:chrome

# 기존 멀티브라우저 설정 (필요시)
npm run test:e2e

# UI 모드 (Chrome만)
npm run test:e2e:ui:chrome
```

---

## 📊 테스트 실행 전략

### Phase 1: 개발 중 빠른 피드백
```bash
# 특정 테스트만 실행
npm run test:e2e:chrome -- auth.spec.ts

# Watch 모드 (파일 변경 시 자동 재실행)
npm run test:e2e:chrome -- --watch

# 특정 테스트 케이스만
npm run test:e2e:chrome -- -g "should login successfully"
```

### Phase 2: 기능 완성 후 전체 검증
```bash
# 전체 E2E 테스트 (Chrome)
npm run test:e2e:chrome

# 상세 리포트
npm run test:e2e:report

# 트레이스 분석
npm run test:e2e:trace
```

### Phase 3: CI/CD 통합
```bash
# CI 환경에서 실행
CI=true npm run test:e2e:chrome
# → 직렬 실행 (workers: 1)
# → 재시도 2회
# → HTML 리포트 생성
```

---

## 🔄 테스트 작성 패턴

### 패턴 1: 기본 시나리오
```typescript
test('사용자가 강의를 수강신청할 수 있다', async ({ page, authenticatedPage }) => {
  // 1. 전제 조건: 로그인된 학습자
  await authenticatedPage.goto('/explore-courses');
  
  // 2. 작업: 강의 수강신청
  await page.click('button:has-text("수강신청")');
  
  // 3. 검증: 성공 메시지 및 버튼 상태 변경
  await expect(page.locator('text=수강신청이 완료되었습니다')).toBeVisible();
  await expect(page.locator('button:has-text("수강 중")')).toBeDisabled();
});
```

### 패턴 2: 에러 처리
```typescript
test('중복된 강의 수강신청은 실패한다', async ({ page, authenticatedPage }) => {
  // 이미 수강신청된 강의에 다시 신청
  await authenticatedPage.goto('/explore-courses');
  await page.click('button:has-text("수강신청")'); // 첫 번째 신청
  await page.click('button:has-text("수강 중")');  // 상태 변경됨
  
  // 다시 시도하면 버튼이 비활성화되어 있음
  await expect(page.locator('button:has-text("수강 중")')).toBeDisabled();
});
```

### 패턴 3: 상태 검증
```typescript
test('강사는 과제 상태를 변경할 수 있다', async ({ page, instructorPage }) => {
  await instructorPage.goto('/courses/assignments');
  
  // 초기 상태: draft → published로 변경
  await page.locator('button:has-text("발행")').first().click();
  await expect(page.locator('badge:has-text("발행")')).toBeVisible();
  
  // published → closed로 변경
  await page.locator('button:has-text("마감")').first().click();
  await expect(page.locator('badge:has-text("마감")')).toBeVisible();
});
```

---

## 📈 예상 커버리지

| 영역 | 테스트 수 | 커버리지 | 우선순위 |
|------|---------|---------|---------|
| 인증 (Auth) | 12 | 95% | 🔴 필수 |
| 강의 (Course) | 15 | 90% | 🔴 필수 |
| 수강신청 (Enrollment) | 8 | 85% | 🔴 필수 |
| 과제 (Assignment) | 20 | 88% | 🟠 높음 |
| 대시보드 (Dashboard) | 10 | 82% | 🟠 높음 |
| 채점 (Grading) | 12 | 80% | 🟡 중간 |
| 네비게이션 (Navigation) | 8 | 95% | 🟡 중간 |
| 에러 처리 (Edge Cases) | 15 | 75% | 🟡 중간 |
| **총계** | **100+** | **~87%** | - |

---

## 🚀 실행 계획

### Week 1: 기초 설정 및 헬퍼 작성
- [ ] `playwright-chrome.config.ts` 생성
- [ ] 헬퍼 함수 추출 및 통합
- [ ] 픽스처 개선 (역할별 사용자)
- [ ] 기본 테스트 틀 작성

### Week 2: 필수 시나리오 테스트
- [ ] 인증 (회원가입, 로그인, 로그아웃)
- [ ] 강의 탐색 및 수강신청
- [ ] 대시보드 표시 및 기능
- [ ] 기본 권한 검증

### Week 3: 심화 시나리오 테스트
- [ ] 과제 생성 및 수정
- [ ] 과제 상태 관리
- [ ] 제출 및 채점
- [ ] 글로벌 네비게이션

### Week 4: 통합 및 최적화
- [ ] 통합 시나리오 (E2E flows)
- [ ] 에러 처리 및 엣지 케이스
- [ ] 성능 최적화
- [ ] CI/CD 통합

---

## ✅ 성공 기준

1. **테스트 성공률**: 95% 이상
2. **테스트 실행 시간**: 전체 < 10분 (Chrome only)
3. **커버리지**: 사용자 플로우 > 85%
4. **에러 처리**: 모든 에러 시나리오 커버
5. **CI/CD**: 자동 실행 및 리포트 생성

---

## 📝 다음 단계

1. **이 계획 리뷰 및 승인**
2. **Playwright Chrome 전용 설정 생성**
3. **헬퍼 함수 작성 시작**
4. **각 기능별 테스트 케이스 구현**
5. **CI/CD 파이프라인 통합**

---

## 🔗 참고자료

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

**작성일**: 2025-11-09
**상태**: 📋 검토 대기

