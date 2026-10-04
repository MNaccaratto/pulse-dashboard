import { describe, expect, it } from 'vitest';
import { bucketTasks } from './tasks';
import type { Task } from './types';

const NY = 'America/New_York';
const DONE = new Set(['done', 'complete']);
// Sat Oct 3 2026, 11am in New York
const NOW = new Date('2026-10-03T15:00:00Z');

const task = (id: string, dueDate: string | null, status = 'Not started'): Task => ({
  id,
  title: id,
  dueDate,
  status,
  source: 'test',
});

describe('bucketTasks', () => {
  const buckets = bucketTasks(
    [
      task('overdue', '2026-10-02'),
      task('today-date-only', '2026-10-03'),
      // 9pm Oct 3 in New York, but already Oct 4 in UTC: must count as today
      task('today-late-evening', '2026-10-04T01:00:00Z'),
      task('tomorrow', '2026-10-04'),
      task('two-days', '2026-10-05'),
      task('later', '2026-10-08'),
      task('too-far', '2026-10-20'),
      task('finished', '2026-10-03', 'Done'),
      task('undated', null),
    ],
    NOW,
    NY,
    DONE,
  );

  const ids = (list: Task[]) => list.map((t) => t.id);

  it('buckets by local calendar day', () => {
    expect(ids(buckets.overdue)).toEqual(['overdue']);
    expect(ids(buckets.today)).toEqual(['today-date-only', 'today-late-evening']);
    expect(ids(buckets.tomorrow)).toEqual(['tomorrow']);
    expect(ids(buckets.inTwoDays)).toEqual(['two-days']);
    expect(ids(buckets.later)).toEqual(['later']);
  });

  it('drops completed, undated, and out-of-range tasks', () => {
    const all = Object.values(buckets).flat().map((t) => t.id);
    expect(all).not.toContain('finished');
    expect(all).not.toContain('undated');
    expect(all).not.toContain('too-far');
  });
});