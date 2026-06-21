/**
 * Deadline urgency utility
 * Returns urgency level based on time remaining to deadline.
 */
export type DeadlineUrgency = 'urgent' | 'soon' | 'normal';

export function getDeadlineUrgency(deadline: string | Date): DeadlineUrgency {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'normal'; // already passed, show nothing
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 3) return 'urgent';
  if (diffHours < 24) return 'soon';
  return 'normal';
}

export function getDeadlineHoursRemaining(deadline: string | Date): number {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}
