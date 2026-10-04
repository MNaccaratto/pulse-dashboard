export interface Task {
  id: string;
  title: string;
  /** Raw Notion value: "YYYY-MM-DD" or a full ISO datetime. */
  dueDate: string | null;
  status: string;
  source: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO datetime for timed events, "YYYY-MM-DD" for all-day events. */
  start: string | null;
  isAllDay: boolean;
  sourceCalendar: string;
}

export interface FetchResult<T> {
  data: T;
  /** Safe-to-display messages. Details are logged server-side only. */
  errors: string[];
  /** True when demo data is being shown instead of real data. */
  isMock: boolean;
}

export interface NamedId {
  name: string;
  id: string;
}