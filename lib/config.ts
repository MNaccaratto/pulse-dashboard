import type { NamedId } from './types';

export const LOOKAHEAD_DAYS = 7;

export function getTimeZone(): string {
  return process.env.DASHBOARD_TIMEZONE || 'America/New_York';
}

export function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

/**
 * Parses "Name=id,Other Name=id2" into [{ name, id }].
 * Entries without "=" are treated as a bare id and get a generic name,
 * so the old "id1,id2" format keeps working.
 */
export function parseNamedList(raw: string | undefined, fallbackPrefix: string): NamedId[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry, i) => {
      const eq = entry.indexOf('=');
      if (eq === -1) return { name: `${fallbackPrefix} ${i + 1}`, id: entry };
      return { name: entry.slice(0, eq).trim(), id: entry.slice(eq + 1).trim() };
    });
}

/** Status names that count as finished (case-insensitive, exact match). */
export function getDoneStatuses(): Set<string> {
  const raw = process.env.NOTION_DONE_STATUSES || 'done,complete,completed';
  return new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
}