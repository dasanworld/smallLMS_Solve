export const dashboardErrorCodes = {
  fetchError: 'DASHBOARD_FETCH_ERROR',
  validationError: 'DASHBOARD_VALIDATION_ERROR',
  userNotFound: 'DASHBOARD_USER_NOT_FOUND',
  noActiveEnrollments: 'NO_ACTIVE_ENROLLMENTS', // 활성 수강 없음
} as const;

type DashboardErrorValue = (typeof dashboardErrorCodes)[keyof typeof dashboardErrorCodes];

export type DashboardServiceError = DashboardErrorValue;