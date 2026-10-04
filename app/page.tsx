import { getActiveNotionTasks } from '@/lib/notion';
import { getTodayEvents } from '@/lib/calendar';
import { bucketTasks, dueKey } from '@/lib/tasks';
import { getDoneStatuses, getTimeZone } from '@/lib/config';
import { formatDayLabel, formatTime, toDateKey } from '@/lib/dates';
import type { CalendarEvent, Task } from '@/lib/types';

// Always render per-request. Without this Next may prerender at build time and bake in stale data.
export const dynamic = 'force-dynamic';

function TaskCard({ task, timeZone }: { task: Task; timeZone: string }) {
  return (
    <div className="bg-stone-900/50 border border-red-950/30 p-4 rounded shadow-sm hover:border-red-900/50 transition-colors">
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-lg text-stone-200 font-medium">{task.title}</h3>
        <span className="shrink-0 text-[10px] uppercase tracking-wider bg-red-950/40 text-red-400/80 px-2 py-1 rounded border border-red-900/30">
          {task.status}
        </span>
      </div>
      <div className="flex justify-between items-end mt-3">
        <p className="text-sm text-red-700/80">
          {task.dueDate ? `Due: ${formatDayLabel(dueKey(task.dueDate, timeZone))}` : 'No Date Set'}
        </p>
        <p className="text-xs text-stone-600">{task.source}</p>
      </div>
    </div>
  );
}

function EventCard({ event, timeZone }: { event: CalendarEvent; timeZone: string }) {
  return (
    <div className="bg-stone-900/50 border border-red-950/30 p-4 rounded shadow-sm hover:border-red-900/50 transition-colors">
      <h3 className="text-lg text-stone-200 font-medium">{event.title}</h3>
      <div className="flex justify-between items-center mt-3">
        <p className="text-sm text-stone-400">
          {event.isAllDay || !event.start ? 'All Day' : formatTime(event.start, timeZone)}
        </p>
        <p className="text-[10px] text-red-900/60 uppercase tracking-widest bg-stone-950 px-2 py-1 rounded">
          {event.sourceCalendar}
        </p>
      </div>
    </div>
  );
}

export default async function Home() {
  const now = new Date();
  const timeZone = getTimeZone();

  const [taskResult, eventResult] = await Promise.all([getActiveNotionTasks(now), getTodayEvents(now)]);

  const buckets = bucketTasks(taskResult.data, now, timeZone, getDoneStatuses());
  const groups = [
    { label: 'Overdue', tasks: buckets.overdue },
    { label: 'Today', tasks: buckets.today },
    { label: 'Tomorrow', tasks: buckets.tomorrow },
    { label: 'In Two Days', tasks: buckets.inTwoDays },
    { label: 'Later This Week', tasks: buckets.later },
  ].filter((g) => g.tasks.length > 0);

  const errors = [...taskResult.errors, ...eventResult.errors];
  const isMock = taskResult.isMock || eventResult.isMock;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-300 p-8 md:p-12 font-serif selection:bg-red-900/30">
      <header className="border-b border-red-900/40 pb-6 mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-red-800/90">Pulse Dashboard</h1>
        <p className="text-stone-500 mt-2 text-sm italic">
          Daily Briefing &amp; Command Center · {formatDayLabel(toDateKey(now, timeZone))}
        </p>
      </header>

      {isMock && (
        <p className="mb-6 text-sm text-amber-500/80 border border-amber-900/40 rounded px-3 py-2">
          Showing demo data. Add your credentials to .env.local to see your own.
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mb-6 text-sm text-red-400/80 border border-red-900/40 rounded px-3 py-2 space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-baseline justify-between mb-6 border-l-4 border-red-800/70 pl-3">
            <h2 className="text-2xl text-stone-400">Actionable Tasks</h2>
            <span className="text-xs text-stone-500 italic">Next 7 Days</span>
          </div>

          {groups.length === 0 ? (
            <p className="text-stone-600 italic">No pending tasks for this week.</p>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <div key={g.label} className="space-y-3">
                  <h3 className="text-xs uppercase tracking-widest text-stone-500">
                    {g.label} · {g.tasks.length}
                  </h3>
                  {g.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} timeZone={timeZone} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 border-l-4 border-red-800/70 pl-3">
            <h2 className="text-2xl text-stone-400">Today&apos;s Itinerary</h2>
          </div>

          <div className="space-y-4">
            {eventResult.data.length === 0 ? (
              <p className="text-stone-600 italic">No events scheduled today.</p>
            ) : (
              eventResult.data.map((event) => <EventCard key={event.id} event={event} timeZone={timeZone} />)
            )}
          </div>
        </section>
      </div>
    </main>
  );
}