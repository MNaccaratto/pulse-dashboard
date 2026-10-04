import { google } from 'googleapis';
import { getTimeZone, parseNamedList, useMockData } from './config';
import { dayBounds, toDateKey } from './dates';
import { getMockEvents } from './mock';
import type { CalendarEvent, FetchResult } from './types';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/**
 * Preferred: GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 (the whole key file, base64-encoded).
 * Fallback: GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY (escaped \n allowed).
 */
function loadCredentials(): ServiceAccount | null {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (b64) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      if (json.client_email && json.private_key) {
        return { client_email: json.client_email, private_key: json.private_key };
      }
    } catch {
      /* fall through to null */
    }
    return null;
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
  return email && key ? { client_email: email, private_key: key } : null;
}

/**
 * Env: GOOGLE_CALENDAR_IDS ("Personal=you@gmail.com,School=abc@group.calendar.google.com").
 * Each calendar must be shared (read-only is enough) with the service account's email.
 */
export async function getTodayEvents(now = new Date()): Promise<FetchResult<CalendarEvent[]>> {
  const timeZone = getTimeZone();
  const today = toDateKey(now, timeZone);

  const credentials = loadCredentials();
  const calendars = parseNamedList(process.env.GOOGLE_CALENDAR_IDS, 'Calendar');

  if (useMockData() || !credentials || calendars.length === 0) {
    if (!useMockData()) console.warn('⚠️ Google Calendar credentials missing, showing demo data.');
    return { data: getMockEvents(today, timeZone), errors: [], isMock: true };
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const calendar = google.calendar({ version: 'v3', auth });
  const { start, end } = dayBounds(today, timeZone);

  const errors: string[] = [];
  const results = await Promise.all(
    calendars.map(async ({ name, id }) => {
      try {
        const res = await calendar.events.list({
          calendarId: id,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(), // exclusive upper bound = next local midnight
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        });

        return (res.data.items ?? [])
          .filter((e) => e.status !== 'cancelled')
          .map((e, i): CalendarEvent => ({
            id: `${name}:${e.id ?? i}`,
            title: e.summary || 'Busy',
            start: e.start?.dateTime ?? e.start?.date ?? null,
            isAllDay: !e.start?.dateTime && !!e.start?.date,
            sourceCalendar: name,
          }));
      } catch (err) {
        console.error(`❌ Calendar "${name}" failed:`, err instanceof Error ? err.message : err);
        errors.push(`Couldn't load the "${name}" calendar.`);
        return [];
      }
    }),
  );

  const data = results.flat().sort((a, b) => {
    if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1; // all-day pinned to the top
    return new Date(a.start ?? 0).getTime() - new Date(b.start ?? 0).getTime();
  });

  return { data, errors, isMock: false };
}