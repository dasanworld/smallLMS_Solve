/**
 * 테스트 데이터
 * 강의, 과제 등의 테스트에 사용할 샘플 데이터를 정의합니다.
 */

/**
 * 테스트용 강의 데이터
 */
export const testCourses = {
  webDevelopment: {
    title: '웹 개발 기초',
    description: 'HTML, CSS, JavaScript를 활용한 웹 개발 기초 강의입니다.',
    categoryId: 1, // 실제 카테고리 ID로 변경 필요
    difficultyId: 1, // 실제 난이도 ID로 변경 필요
  },
  mobileDevelopment: {
    title: '모바일 앱 개발',
    description: 'React Native를 사용한 모바일 앱 개발 강의입니다.',
    categoryId: 2,
    difficultyId: 2,
  },
  dataScience: {
    title: '데이터 과학 입문',
    description: 'Python과 머신러닝을 활용한 데이터 분석 강의입니다.',
    categoryId: 3,
    difficultyId: 3,
  },
};

/**
 * 테스트용 과제 데이터
 */
export const testAssignments = {
  basicAssignment: {
    title: '기본 과제',
    description: '이것은 기본 테스트 과제입니다.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
    pointsWeight: 10,
    allowLate: false,
    allowResubmission: false,
  },
  advancedAssignment: {
    title: '고급 과제',
    description: '이것은 고급 테스트 과제입니다. 더 복잡한 요구사항을 포함합니다.',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14일 후
    pointsWeight: 20,
    allowLate: true,
    allowResubmission: true,
  },
  projectAssignment: {
    title: '프로젝트 과제',
    description: '최종 프로젝트 과제입니다. 종합적인 평가를 포함합니다.',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
    pointsWeight: 50,
    allowLate: true,
    allowResubmission: false,
  },
};

/**
 * 테스트용 카테고리 데이터
 */
export const testCategories = [
  { id: 1, name: '프로그래밍' },
  { id: 2, name: '웹 개발' },
  { id: 3, name: '모바일 개발' },
  { id: 4, name: '데이터 과학' },
  { id: 5, name: '인공지능' },
];

/**
 * 테스트용 난이도 데이터
 */
export const testDifficulties = [
  { id: 1, name: '초급' },
  { id: 2, name: '중급' },
  { id: 3, name: '고급' },
];

/**
 * 랜덤 강의 제목 생성
 */
export function generateRandomCourseTitle(prefix: string = '테스트 강의'): string {
  const timestamp = Date.now();
  return `${prefix} ${timestamp}`;
}

/**
 * 랜덤 과제 제목 생성
 */
export function generateRandomAssignmentTitle(prefix: string = '테스트 과제'): string {
  const timestamp = Date.now();
  return `${prefix} ${timestamp}`;
}

/**
 * 미래 날짜 생성 (과제 마감일용)
 */
export function generateFutureDate(daysFromNow: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

/**
 * 과거 날짜 생성 (테스트용)
 */
export function generatePastDate(daysAgo: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

