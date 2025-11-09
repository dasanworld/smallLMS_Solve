/**
 * 테스트용 사용자 계정 정보
 * 각 역할별로 테스트 계정을 정의합니다.
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'learner' | 'instructor' | 'operator';
  name?: string;
}

/**
 * 학습자 테스트 계정
 */
export const testLearner: TestUser = {
  email: 'learner@test.com',
  password: 'TestPass123!',
  role: 'learner',
  name: '테스트 학습자',
};

/**
 * 강사 테스트 계정
 */
export const testInstructor: TestUser = {
  email: 'instructor@test.com',
  password: 'TestPass123!',
  role: 'instructor',
  name: '테스트 강사',
};

/**
 * 운영자 테스트 계정
 */
export const testOperator: TestUser = {
  email: 'operator@test.com',
  password: 'TestPass123!',
  role: 'operator',
  name: '테스트 운영자',
};

/**
 * 모든 테스트 사용자 목록
 */
export const testUsers = {
  learner: testLearner,
  instructor: testInstructor,
  operator: testOperator,
};

/**
 * 역할별 사용자 가져오기
 */
export function getUserByRole(role: 'learner' | 'instructor' | 'operator'): TestUser {
  return testUsers[role];
}

/**
 * 랜덤 이메일 생성 (중복 방지용)
 */
export function generateRandomEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}@test.com`;
}

