import { addDaysToKey, startOfDayInstant } from './dates';
import type { CalendarEvent, Task } from './types';

/** Demo data so anyone who clones the repo sees a working dashboard. Dates are relative to today. */
export function getMockTasks(todayKey: string): Task[] {
  const t = (id: string, title: string, offset: number, status: string, source: string): Task => ({
    id: `mock-${id}`,
    title,
    dueDate: addDaysToKey(todayKey, offset),
    status,
    source,
  });
  return [
    t('1', 'Submit problem set 4', -1, 'In progress', 'Academic'),
    t('2', 'Study for networking quiz', 0, 'Not started', 'Academic'),
    t('3', 'Review pull request', 0, 'In progress', 'Work'),
    t('4', 'Draft project README', 1, 'Not started', 'Personal'),
    t('5', 'Book dentist appointment', 2, 'Not started', 'Personal'),
    t('6', 'Write lab report', 5, 'Not started', 'Academic'),
  ];
}

export function getMockEvents(todayKey: string, timeZone: string): CalendarEvent[] {
  const midnight = startOfDayInstant(todayKey, timeZone).getTime();
  const at = (hours: number) => new Date(midnight + hours * 3_600_000).toISOString();
  return [
    { id: 'mock-e0', title: 'Office hours (all day)', start: todayKey, isAllDay: true, sourceCalendar: 'School' },
    { id: 'mock-e1', title: 'Algorithms lecture', start: at(9.5), isAllDay: false, sourceCalendar: 'School' },
    { id: 'mock-e2', title: 'Team standup', start: at(13), isAllDay: false, sourceCalendar: 'Work' },
    { id: 'mock-e3', title: 'Gym', start: at(18), isAllDay: false, sourceCalendar: 'Personal' },
  ];
}