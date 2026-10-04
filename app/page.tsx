import { getActiveNotionTasks } from '../lib/notion';
import { getTodayEvents } from '../lib/calendar';

export default async function Home() {
  // Concurrently fetch from both APIs
  const [tasks, events] = await Promise.all([
    getActiveNotionTasks(),
    getTodayEvents()
  ]);

  return (
    <main className="p-8 bg-neutral-950 min-h-screen text-neutral-200 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-white">Pulse Dashboard: Data Pipeline Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Notion Output */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-400">Notion Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-neutral-500 italic">No tasks returned.</p>
          ) : (
            <pre className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg overflow-auto text-green-400 text-xs h-[70vh]">
              {JSON.stringify(tasks, null, 2)}
            </pre>
          )}
        </div>

        {/* Calendar Output */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Google Calendar Events (Today)</h2>
          {events.length === 0 ? (
            <p className="text-neutral-500 italic">No events returned.</p>
          ) : (
            <pre className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg overflow-auto text-blue-400 text-xs h-[70vh]">
              {JSON.stringify(events, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}