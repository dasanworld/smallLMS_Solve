import { type Page } from '@playwright/test';

const headingMatcher = (text: RegExp | string) => ({ name: text, level: undefined } as const);

export const Selectors = {
  course: {
    heading: (page: Page) =>
      page.getByRole('heading', {
        name: /코스 관리|코스|강좌|Courses/i,
      }),
    listEmptyState: (page: Page) =>
      page.getByText(/아직 코스가 없습니다|No courses yet/i),
    createTab: (page: Page) => page.getByRole('tab', { name: /새 코스 생성|코스 생성|Create Course/i }),
    listTab: (page: Page) => page.getByRole('tab', { name: /내 코스|Course List/i }),
    createButton: (page: Page) =>
      page.getByRole('button', { name: /새 코스 생성|강좌 생성|Create Course/i }).first(),
    managementButton: (page: Page) =>
      page.getByRole('button', { name: /코스 관리|Course Management/i }).first(),
  },
  dashboard: {
    instructorHeading: (page: Page) =>
      page.getByRole('heading', headingMatcher(/강사 대시보드|Instructor Dashboard/i)),
    learnerHeading: (page: Page) =>
      page.getByRole('heading', headingMatcher(/학습자 대시보드|Learner Dashboard/i)),
  },
  assignments: {
    heading: (page: Page) =>
      page.getByRole('heading', { name: /과제 관리|Assignments/i }),
    createButton: (page: Page) =>
      page.getByRole('button', { name: /새 과제 생성|과제 생성|Create Assignment/i }),
  },
};

