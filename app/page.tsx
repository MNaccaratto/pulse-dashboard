import { getActiveNotionTasks } from '../lib/notion';

export default async function Home() {
  // This runs securely on the server and fetches your databases
  const tasks = await getActiveNotionTasks();

  return (
    <main className="p-8 bg-neutral-950 min-h-screen text-neutral-200">
      <h1 className="text-2xl font-bold mb-4 text-white">Notion API Connection Test</h1>
      
      {tasks.length === 0 ? (
        <p className="text-yellow-400">No tasks found. Check your database IDs and ensure your integration is connected!</p>
      ) : (
        <pre className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg overflow-auto text-green-400 text-sm">
          {JSON.stringify(tasks, null, 2)}
        </pre>
      )}
    </main>
  );
}