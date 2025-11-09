# 🎯 E2E 테스트 계획 - 한눈에 보기

## 📌 핵심 개선사항

### Before ❌
```
- 5개 브라우저 테스트 (chromium, firefox, webkit, Mobile Chrome, Mobile Safari)
- 테스트 실행 시간 너무 길어짐
- 개발 중 피드백 느림
- 구조화되지 않은 헬퍼 함수
```

### After ✅
```
- Chrome만 테스트 (빠른 피드백)
- 테스트 실행 시간 < 10분
- 개발 중 즉시 검증 가능
- 체계적인 헬퍼 함수 및 픽스처
```

---

## 🏗️ 테스트 계층 구조

```
┌─────────────────────────────────────────────────┐
│  E2E 통합 테스트 (End-to-End)                   │
│  - 실제 사용자 시나리오                         │
│  - 전체 애플리케이션 플로우                     │
└─────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  기능별 테스트                                       │
├──────────────────────────────────────────────────────┤
│ ✅ 인증              │ ✅ 강의 관리    │ ✅ 대시보드    │
│ ✅ 수강신청          │ ✅ 과제 관리    │ ✅ 채점/제출   │
│ ✅ 네비게이션        │ ✅ 에러 처리    │ ✅ 권한 검증   │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  헬퍼 함수 및 픽스처                                  │
├──────────────────────────────────────────────────────┤
│ 🔧 API Helper       │ 🔧 Auth Helper   │ 🔧 Page Helper │
│ 🔧 Course Helper    │ 🔧 Assignment Helper              │
│ 🔧 Navigation Helper│                                  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│  Playwright Chrome 설정 + 테스트 데이터              │
└──────────────────────────────────────────────────────┘
```

---

## 📊 테스트 범위 요약

| 기능 | 테스트 수 | 상태 | 예상 시간 |
|------|---------|------|---------|
| 👤 **인증** | 12 | 기존 ✅ | ~2m |
| 📚 **강의 탐색** | 8 | 기존 ⚠️ | ~1m |
| ✍️ **강의 생성/관리** | 7 | 개선 ⚠️ | ~1m |
| 🎓 **수강신청** | 8 | 🆕 신규 | ~1m |
| 📋 **과제 관리** | 20 | 개선 ⚠️ | ~2m |
| 📊 **대시보드** | 10 | 기존 ✅ | ~1m |
| ⭐ **채점/제출** | 12 | 🆕 신규 | ~2m |
| 🧭 **네비게이션** | 8 | 🆕 신규 | ~1m |
| 🚨 **에러 처리** | 15 | 🆕 신규 | ~2m |
| **총계** | **100+** | - | **~13m** |

---

## 🔄 테스트 데이터 관리

### 사용자 역할별 테스트 계정
```typescript
// fixtures/users.ts (신규)
export const testUsers = {
  learner: {
    email: 'learner@test.com',
    password: 'TestPass123!',
    role: 'learner'
  },
  instructor: {
    email: 'instructor@test.com',
    password: 'TestPass123!',
    role: 'instructor'
  },
  admin: {
    email: 'admin@test.com',
    password: 'TestPass123!',
    role: 'operator'
  }
};
```

### 테스트 데이터 셋
```typescript
// fixtures/data.ts (신규)
export const testData = {
  courses: [
    { title: '웹 개발', description: '...' },
    { title: '모바일 개발', description: '...' }
  ],
  assignments: [
    { title: '과제 1', dueDate: '...' },
    { title: '과제 2', dueDate: '...' }
  ]
};
```

---

## 🛠️ 헬퍼 함수 구조

### 현재 상태
```
e2e/helpers/
├── api.ts      # API 요청 (기존)
└── page.ts     # 페이지 상호작용 (기존)
```

### 개선 후
```
e2e/helpers/
├── api.ts                    # API 요청
├── page.ts                   # 페이지 상호작용
├── auth-helper.ts            # 인증 (회원가입, 로그인, 로그아웃)
├── course-helper.ts          # 강의 (생성, 조회, 수정)
├── assignment-helper.ts      # 과제 (생성, 수정, 상태 관리)
└── navigation-helper.ts      # 네비게이션 (메뉴, 링크)
```

### 예제: auth-helper.ts
```typescript
export async function signup(page, email, password, role) {
  await page.goto('/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.selectOption('select[name="role"]', role);
  await page.click('button:has-text("회원가입")');
  await page.waitForURL('/**/dashboard');
}

export async function login(page, email, password) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("로그인")');
  await page.waitForURL('/**/dashboard');
}

export async function logout(page) {
  await page.click('button[aria-label="user menu"]');
  await page.click('button:has-text("로그아웃")');
  await page.waitForURL('/');
}
```

---

## 🚀 실행 방식

### 개발 중 (빠른 피드백)
```bash
# 1. 특정 기능 테스트
npm run test:e2e:chrome -- auth.spec.ts

# 2. Watch 모드 (파일 변경 시 자동 재실행)
npm run test:e2e:chrome -- --watch

# 3. 특정 테스트만 실행
npm run test:e2e:chrome -- -g "should login successfully"
```

### 기능 완성 후 (전체 검증)
```bash
# 1. 모든 테스트 실행
npm run test:e2e:chrome

# 2. 상세 리포트 보기
npm run test:e2e:report

# 3. 실패한 테스트 트레이스 분석
npm run test:e2e:trace
```

### CI/CD (자동 검증)
```bash
# GitHub Actions / GitLab CI에서 실행
CI=true npm run test:e2e:chrome
# → 직렬 실행 (workers: 1)
# → 재시도 2회
# → HTML 리포트 생성 및 업로드
```

---

## 📝 Playwright 설정 비교

### 기존 설정 (playwright.config.ts)
```
프로젝트:     5개 (chromium, firefox, webkit, Mobile Chrome, Mobile Safari)
병렬 처리:    기본 활성화
Workers:     시스템 기본값 또는 1 (CI)
Timeout:     30초
Trace:       실패 시 ON-FIRST-RETRY
실행 시간:   15-20분 (전체)
```

### Chrome 전용 설정 (playwright-chrome.config.ts - 신규)
```
프로젝트:     1개 (Chromium만)
병렬 처리:    2-4 workers (개발 시)
Workers:     1 (CI 환경)
Timeout:     30초
Trace:       실패 시만 수집
실행 시간:   < 10분 (전체)
```

---

## 📈 성공 지표

```
목표 1: 테스트 성공률
├─ 목표: 95% 이상
├─ 측정: 통과한 테스트 / 전체 테스트
└─ 모니터링: CI/CD 리포트

목표 2: 실행 속도
├─ 목표: 전체 < 10분
├─ 측정: 각 브라우저별 시간
└─ 모니터링: 매 빌드마다 추적

목표 3: 버그 캐치율
├─ 목표: 릴리스 전 주요 버그 90%+ 탐지
├─ 측정: 테스트로 탐지된 버그 / 릴리스 후 버그
└─ 모니터링: 사후 분석

목표 4: 개발자 경험
├─ 목표: 개발 중 < 1분 내 피드백
├─ 측정: 테스트 작성 후 피드백 시간
└─ 모니터링: 개발자 피드백
```

---

## 🎯 우선순위

### 🔴 필수 (Phase 1: Week 1-2)
- [x] 기존 테스트 유지
- [ ] Chrome 전용 설정 생성
- [ ] 헬퍼 함수 통합
- [ ] 인증 테스트 완성
- [ ] 강의/수강신청 테스트

### 🟠 높음 (Phase 2: Week 2-3)
- [ ] 과제 관리 테스트 강화
- [ ] 대시보드 테스트 추가
- [ ] 채점/제출 플로우 테스트

### 🟡 중간 (Phase 3: Week 3-4)
- [ ] 네비게이션 테스트
- [ ] 에러 처리 테스트
- [ ] 통합 시나리오 테스트

### 🟢 선택사항 (이후)
- [ ] 성능 테스트
- [ ] 접근성 테스트
- [ ] 시각적 회귀 테스트

---

## 📋 체크리스트

### 준비 단계
- [ ] 이 계획 검토 및 승인
- [ ] Chrome 전용 설정 파일 생성
- [ ] npm 스크립트 업데이트

### 구현 단계
- [ ] 헬퍼 함수 작성
- [ ] 픽스처 개선 (역할별 사용자)
- [ ] 테스트 데이터 설정
- [ ] 각 기능별 테스트 작성

### 통합 단계
- [ ] 로컬 테스트 실행 및 검증
- [ ] CI/CD 파이프라인 설정
- [ ] 타임아웃/재시도 조정
- [ ] 리포트 생성 확인

### 배포 단계
- [ ] GitHub Actions 설정
- [ ] 자동 리포트 업로드
- [ ] 개발자 문서 작성
- [ ] 팀 교육 및 공유

---

## 💡 추가 이점

### 1. 개발 속도 향상
```
기존: 모든 기능 변경 후 5개 브라우저 테스트 (15-20분)
개선: 변경 직후 Chrome 테스트 (1-2분) → 빠른 피드백
```

### 2. 신뢰도 향상
```
- 자동화된 모든 시나리오 검증
- 수동 테스트 시간 단축
- 회귀 버그 방지
```

### 3. 품질 관리 향상
```
- 명확한 테스트 범위 정의
- 커버리지 추적
- 성공 기준 명확화
```

### 4. 팀 협업 개선
```
- 체계적인 헬퍼 함수로 테스트 작성 용이
- 문서화된 테스트 패턴
- 일관된 품질 기준
```

---

## 🔗 다음 단계

1. **📋 계획 승인**
   ```
   [ ] 계획 내용 검토 완료
   [ ] 수정 사항 반영 완료
   [ ] 최종 승인
   ```

2. **🛠️ Chrome 설정 생성**
   ```bash
   # playwright-chrome.config.ts 생성
   # npm 스크립트 추가
   ```

3. **📝 헬퍼 함수 작성**
   ```bash
   # e2e/helpers/ 구성
   # 각 헬퍼별 함수 구현
   ```

4. **🧪 테스트 작성 시작**
   ```bash
   # Phase 1: 인증 테스트
   # Phase 2: 강의/수강신청 테스트
   # Phase 3: 심화 테스트
   ```

---

**작성 날짜**: 2025-11-09
**버전**: v1.0
**상태**: 📋 **승인 대기**


