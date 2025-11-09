/**
 * 과제 관리 기능의 에러 코드 정의
 */

export const assignmentErrorCodes = {
  // 과제 생성/수정/삭제
  ASSIGNMENT_NOT_FOUND: { code: 'ASSIGNMENT_NOT_FOUND', message: '과제를 찾을 수 없습니다' },
  ASSIGNMENT_WEIGHT_EXCEEDED: { code: 'ASSIGNMENT_WEIGHT_EXCEEDED', message: '과제의 가중치 합이 100%를 초과합니다' },
  ASSIGNMENT_PAST_DEADLINE: { code: 'ASSIGNMENT_PAST_DEADLINE', message: '과제의 마감일이 과거 날짜입니다' },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', message: '해당 과제를 수정할 권한이 없습니다' },
  COURSE_NOT_FOUND: { code: 'COURSE_NOT_FOUND', message: '코스를 찾을 수 없습니다' },
  INVALID_STATUS_TRANSITION: { code: 'INVALID_STATUS_TRANSITION', message: '유효하지 않은 상태 전환입니다' },
  INVALID_INPUT: { code: 'INVALID_INPUT', message: '잘못된 입력입니다' },

  // 제출물 관리
  SUBMISSION_NOT_FOUND: { code: 'SUBMISSION_NOT_FOUND', message: '제출물을 찾을 수 없습니다' },
  SUBMISSION_ALREADY_GRADED: { code: 'SUBMISSION_ALREADY_GRADED', message: '이미 채점된 제출물입니다' },
  INVALID_SCORE: { code: 'INVALID_SCORE', message: '잘못된 점수입니다 (0~100)' },

  // 데이터베이스 에러
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: '데이터베이스 오류가 발생했습니다' },
  INTERNAL_SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다' },
} as const;

export type AssignmentErrorCode = keyof typeof assignmentErrorCodes;

