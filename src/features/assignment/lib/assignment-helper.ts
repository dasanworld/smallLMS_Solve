import { isAfter, isBefore, isPast, differenceInHours, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export type AssignmentGroupStatus = 'pending' | 'submitted' | 'graded';

export interface AssignmentStatus {
  group: AssignmentGroupStatus;
  label: string;
  badge: string;
  color: string;
}

export interface SubmissionStatus {
  status: 'not_submitted' | 'submitted' | 'graded' | 'resubmission_required';
  label: string;
  badge: string;
  color: string;
}

/**
 * 과제의 그룹 상태 판정 (탭 분류용)
 * - pending: 미제출 또는 제출함 (진행 중)
 * - submitted: 제출 완료, 채점 대기 중
 * - graded: 채점 완료
 */
export const getAssignmentGroupStatus = (
  submission: any | null,
  assignmentStatus: string
): AssignmentGroupStatus => {
  if (!submission) {
    // 미제출: 진행 중 그룹
    return 'pending';
  }

  if (submission.status === 'graded') {
    return 'graded';
  }

  if (submission.status === 'resubmission_required') {
    // 재제출 요청은 진행 중 그룹에 분류
    return 'pending';
  }

  // submitted
  return 'submitted';
};

/**
 * 제출물 상태 정보
 */
export const getSubmissionStatus = (submission: any | null): SubmissionStatus => {
  if (!submission) {
    return {
      status: 'not_submitted',
      label: '미제출',
      badge: '❌',
      color: 'bg-red-100 text-red-800',
    };
  }

  switch (submission.status) {
    case 'graded':
      return {
        status: 'graded',
        label: '채점 완료',
        badge: '⭐',
        color: 'bg-green-100 text-green-800',
      };
    case 'resubmission_required':
      return {
        status: 'resubmission_required',
        label: '재제출 요청',
        badge: '🔄',
        color: 'bg-yellow-100 text-yellow-800',
      };
    case 'submitted':
    default:
      return {
        status: 'submitted',
        label: '제출함',
        badge: '✅',
        color: 'bg-blue-100 text-blue-800',
      };
  }
};

/**
 * 과제 상태 정보 (마감일 기준)
 */
export const getAssignmentStatus = (dueDate: string): AssignmentStatus => {
  const due = new Date(dueDate);
  const now = new Date();

  if (isPast(due)) {
    return {
      group: 'pending',
      label: '마감됨',
      badge: '⏰',
      color: 'bg-gray-100 text-gray-800',
    };
  }

  const hoursUntilDue = differenceInHours(due, now);

  if (hoursUntilDue <= 24) {
    return {
      group: 'pending',
      label: '임박',
      badge: '⚠️',
      color: 'bg-red-100 text-red-800',
    };
  }

  if (hoursUntilDue <= 72) {
    return {
      group: 'pending',
      label: '진행 중',
      badge: '📝',
      color: 'bg-yellow-100 text-yellow-800',
    };
  }

  return {
    group: 'pending',
    label: '진행 중',
    badge: '📝',
    color: 'bg-blue-100 text-blue-800',
  };
};

/**
 * 마감일까지의 남은 시간 표시 (한국어)
 */
export const getTimeUntilDue = (dueDate: string): string => {
  const due = new Date(dueDate);
  const now = new Date();

  if (isPast(due)) {
    return `마감됨 (${format(due, 'M월 d일 H시', { locale: ko })})`;
  }

  const hours = differenceInHours(due, now);
  if (hours < 1) {
    return '곧 마감 (1시간 이내)';
  }

  if (hours < 24) {
    return `${hours}시간 남음`;
  }

  const days = Math.floor(hours / 24);
  return `${days}일 ${hours % 24}시간 남음`;
};

/**
 * 과제 카드에 표시할 상태 배지
 */
export const getStatusBadgeInfo = (
  submission: any | null,
  dueDate: string
): { label: string; color: string } => {
  const submissionStatus = getSubmissionStatus(submission);
  if (submission) {
    // 제출 상태가 있으면 제출 상태로 표시
    return {
      label: submissionStatus.label,
      color: submissionStatus.color,
    };
  }

  // 미제출이면 과제 상태 표시
  const assignmentStatus = getAssignmentStatus(dueDate);
  return {
    label: assignmentStatus.label,
    color: assignmentStatus.color,
  };
};

/**
 * 과제 그룹 레이블
 */
export const getGroupLabel = (status: AssignmentGroupStatus): string => {
  switch (status) {
    case 'pending':
      return '진행 중';
    case 'submitted':
      return '제출 대기';
    case 'graded':
      return '채점 완료';
    default:
      return '기타';
  }
};

/**
 * 재제출 가능 여부 판정
 */
export const canResubmit = (
  submission: any | null,
  assignmentStatus: string,
  allowResubmission: boolean
): boolean => {
  if (!allowResubmission) return false;
  if (!submission) return false;

  // 재제출 요청 상태일 때만 재제출 가능
  return submission.status === 'resubmission_required';
};

/**
 * 제출 가능 여부 판정
 */
export const canSubmit = (
  submission: any | null,
  assignmentStatus: string,
  allowLate: boolean
): boolean => {
  // 과제가 폐쇄되었으면 제출 불가 (재제출 요청 제외)
  if (assignmentStatus === 'closed' && !submission?.status?.includes('resubmission')) {
    return false;
  }

  // 미제출이거나 재제출 요청일 때 제출 가능
  if (!submission) return true;
  if (submission.status === 'resubmission_required') return true;

  return false;
};
