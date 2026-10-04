/**
 * Timezone-safe date helpers built on Intl (no extra dependencies).
 * Vercel servers run in UTC, so "today" must always be computed for an
 * explicit timezone, never with the server's local time.
 */

/** "YYYY-MM-DD" for the given instant as seen in `timeZone`. */
export function toDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Pure calendar math on "YYYY-MM-DD" keys (no timezone involved). */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUTC - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant when `key` starts (midnight) in `timeZone`. */
export function startOfDayInstant(key: string, timeZone: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const off1 = tzOffsetMs(new Date(guess), timeZone);
  let result = guess - off1;
  const off2 = tzOffsetMs(new Date(result), timeZone);
  if (off2 !== off1) result = guess - off2; // DST boundary correction
  return new Date(result);
}

/** [start, end) of a local day as instants. Correct on 23/25-hour DST days. */
export function dayBounds(key: string, timeZone: string): { start: Date; end: Date } {
  return {
    start: startOfDayInstant(key, timeZone),
    end: startOfDayInstant(addDaysToKey(key, 1), timeZone),
  };
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "Sat, Oct 3" from a "YYYY-MM-DD" key. */
export function formatDayLabel(key: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${key}T12:00:00Z`));
}