import { addDaysToKey, toDateKey } from './dates';
import type { Task } from './types';

export interface TaskBuckets {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  inTwoDays: Task[];
  later: Task[]; // 3 days out through the lookahead limit
}

/** Normalises a Notion due value to a local "YYYY-MM-DD" key. */
export function dueKey(dueDate: string, timeZone: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return dueDate; // date-only: already a calendar day
  return toDateKey(new Date(dueDate), timeZone);
}

export function isDone(status: string, doneStatuses: Set<string>): boolean {
  return doneStatuses.has(status.trim().toLowerCase());
}

export function bucketTasks(
  tasks: Task[],
  now: Date,
  timeZone: string,
  doneStatuses: Set<string>,
  lookaheadDays = 7,
): TaskBuckets {
  const today = toDateKey(now, timeZone);
  const tomorrow = addDaysToKey(today, 1);
  const inTwo = addDaysToKey(today, 2);
  const limit = addDaysToKey(today, lookaheadDays);

  const buckets: TaskBuckets = { overdue: [], today: [], tomorrow: [], inTwoDays: [], later: [] };

  for (const task of tasks) {
    if (!task.dueDate || isDone(task.status, doneStatuses)) continue;
    const key = dueKey(task.dueDate, timeZone);

    if (key < today) buckets.overdue.push(task);
    else if (key === today) buckets.today.push(task);
    else if (key === tomorrow) buckets.tomorrow.push(task);
    else if (key === inTwo) buckets.inTwoDays.push(task);
    else if (key <= limit) buckets.later.push(task);
  }

  const byDue = (a: Task, b: Task) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.title.localeCompare(b.title);
  Object.values(buckets).forEach((list) => list.sort(byDue));
  return buckets;
}