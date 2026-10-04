import { google } from 'googleapis';
import { startOfDay, endOfDay } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string | null;
  sourceCalendar: string;
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarIdsString = process.env.GOOGLE_CALENDAR_IDS;

  if (!clientEmail || !privateKey || !calendarIdsString) {
    console.warn("⚠️ Missing Google Calendar credentials in .env.local");
    return [];
  }

  const calendarIds = calendarIdsString.split(',').map(id => id.trim());
  console.log("🔍 Fetching from Calendar IDs:", calendarIds);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  try {
    // Fetch all calendars concurrently
    const eventPromises = calendarIds.map(async (calendarId, index) => {
      console.log(`⏳ Querying calendar: ${calendarId}...`);
      try {
        const response = await calendar.events.list({
          calendarId: calendarId,
          timeMin: todayStart,
          timeMax: todayEnd,
          singleEvents: true, 
          orderBy: 'startTime',
        });
        
        const events = response.data.items || [];
        console.log(`📦 Calendar ${index + 1} returned ${events.length} events for today`);

        return events.map((event) => ({
          id: event.id || Math.random().toString(),
          title: event.summary || 'Busy',
          startTime: event.start?.dateTime || event.start?.date || null,
          sourceCalendar: `Calendar ${index + 1}`
        }));
      } catch (err: any) {
        console.error(`❌ Failed to fetch calendar ${calendarId}: ${err.message}`);
        return [];
      }
    });

    // Wait for all API calls to finish and flatten the array
    const nestedEvents = await Promise.all(eventPromises);
    const allEvents = nestedEvents.flat();

    // Sort the combined timeline chronologically
    return allEvents.sort((a, b) => {
      if (!a.startTime) return -1;
      if (!b.startTime) return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  } catch (error: any) {
    console.error("❌ Google Calendar Auth Error:", error.message);
    return [];
  }
}