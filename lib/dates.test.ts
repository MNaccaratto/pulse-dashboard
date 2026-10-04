import { describe, expect, it } from 'vitest';
import { addDaysToKey, dayBounds, toDateKey } from './dates';

const NY = 'America/New_York';

describe('toDateKey', () => {
  it('uses the target timezone, not UTC', () => {
    // 10:00pm Oct 3 in New York is already Oct 4 in UTC
    expect(toDateKey(new Date('2026-10-04T02:00:00Z'), NY)).toBe('2026-10-03');
  });
});

describe('addDaysToKey', () => {
  it('rolls over months and years', () => {
    expect(addDaysToKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('dayBounds', () => {
  it('returns local midnight to midnight during daylight time', () => {
    const { start, end } = dayBounds('2026-10-03', NY);
    expect(start.toISOString()).toBe('2026-10-03T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-04T04:00:00.000Z');
  });

  it('handles the 25-hour fall-back day', () => {
    const { start, end } = dayBounds('2026-11-01', NY);
    expect(start.toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-02T05:00:00.000Z');
  });

  it('handles the 23-hour spring-forward day', () => {
    const { start, end } = dayBounds('2026-03-08', NY);
    expect(start.toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-03-09T04:00:00.000Z');
  });
});