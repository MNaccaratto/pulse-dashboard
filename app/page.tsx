import { getActiveNotionTasks } from '../lib/notion';
import { getTodayEvents } from '../lib/calendar';

export default async function Home() {
  const [tasks, events] = await Promise.all([
    getActiveNotionTasks(),
    getTodayEvents()
  ]);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-300 p-8 md:p-12 font-serif selection:bg-red-900/30">
      <header className="border-b border-red-900/40 pb-6 mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-red-800/90">
          Pulse Dashboard
        </h1>
        <p className="text-stone-500 mt-2 text-sm italic">
          Daily Briefing & Command Center
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Notion Tasks Section */}
        <section>
          <div className="flex items-baseline justify-between mb-6 border-l-4 border-red-800/70 pl-3">
            <h2 className="text-2xl text-stone-400">Actionable Tasks</h2>
            <span className="text-xs text-stone-500 italic">Next 7 Days</span>
          </div>
          
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-stone-600 italic">No pending tasks for this week.</p>
            ) : (
              tasks.map((task, i) => (
                <div key={i} className="bg-stone-900/50 border border-red-950/30 p-4 rounded shadow-sm hover:border-red-900/50 transition-colors flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg text-stone-200 font-medium">{task.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider bg-red-950/40 text-red-400/80 px-2 py-1 rounded border border-red-900/30">
                      {task.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <p className="text-sm text-red-700/80">
                      {task.dueDate 
                        ? `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` 
                        : 'No Date Set'}
                    </p>
                    <p className="text-xs text-stone-600">{task.source}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Google Calendar Section */}
        <section>
          <div className="mb-6 border-l-4 border-red-800/70 pl-3">
            <h2 className="text-2xl text-stone-400">Today's Itinerary</h2>
          </div>
          
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-stone-600 italic">No events scheduled today.</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="bg-stone-900/50 border border-red-950/30 p-4 rounded shadow-sm hover:border-red-900/50 transition-colors">
                  <h3 className="text-lg text-stone-200 font-medium">{event.title}</h3>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm text-stone-400">
                      {event.startTime 
                        ? new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                        : 'All Day'}
                    </p>
                    <p className="text-[10px] text-red-900/60 uppercase tracking-widest bg-stone-950 px-2 py-1 rounded">
                      {event.sourceCalendar}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}