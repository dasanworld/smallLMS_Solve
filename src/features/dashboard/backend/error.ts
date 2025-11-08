export const dashboardErrorCodes = {
  fetchError: 'DASHBOARD_FETCH_ERROR',
  validationError: 'DASHBOARD_VALIDATION_ERROR',
  userNotFound: 'DASHBOARD_USER_NOT_FOUND',
} as const;

type DashboardErrorValue = (typeof dashboardErrorCodes)[keyof typeof dashboardErrorCodes];

export type DashboardServiceError = DashboardErrorValue;