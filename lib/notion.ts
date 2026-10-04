import { addDays, isBefore, parseISO } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  source: string;
}

export async function getActiveNotionTasks(): Promise<Task[]> {
  const token = process.env.NOTION_TOKEN;
  const dbIdsString = process.env.NOTION_DATABASE_IDS;
  
  if (!token || !dbIdsString) {
    console.warn("⚠️ Missing NOTION_TOKEN or NOTION_DATABASE_IDS in .env.local");
    return [];
  }

  const databaseIds = dbIdsString.split(',').map(id => id.trim());
  const allTasks: Task[] = [];
  
  for (let i = 0; i < databaseIds.length; i++) {
    const databaseId = databaseIds[i];
    
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Fetch everything, filter in-memory
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch DB ${databaseId}`);
      continue;
    }

    const data = await res.json();

    const parsedTasks = data.results.map((page: any) => {
      // Dynamic Title parsing
      let taskTitle = 'Untitled Task';
      for (const key in page.properties) {
        if (page.properties[key].type === 'title') {
          taskTitle = page.properties[key].title?.[0]?.plain_text || 'Untitled Task';
          break;
        }
      }

      // Extract Status
      const statusProp = page.properties['Status'];
      const statusValue = statusProp?.status?.name || statusProp?.select?.name || 'Unknown';

      // Extract Due Date
      const dueDateProp = page.properties['Due Date'];
      const dueDate = dueDateProp?.date?.start || null;

      // Custom Database Names
      const dbNames = ["Academic", "Personal/Professional"];

      return {
        id: page.id,
        title: taskTitle,
        dueDate: dueDate,
        status: statusValue,
        source: dbNames[i] || `Database ${i + 1}`,
      };
    });

    allTasks.push(...parsedTasks);
  }

  // Apply 7-day lookahead filter
  const lookaheadLimit = addDays(new Date(), 7);

  const actionableTasks = allTasks.filter(task => {
    const statusLower = task.status.toLowerCase();
    
    // Drop completed items
    if (statusLower.includes('done') || statusLower.includes('complete')) {
      return false; 
    }

    // Keep active tasks that don't have a specific due date yet
    if (!task.dueDate) {
       return true; 
    }

    // Keep items due within the next 7 days (or overdue)
    return isBefore(parseISO(task.dueDate), lookaheadLimit);
  });

  // Sort chronologically by due date
  return actionableTasks.sort((a, b) => {
    if (!a.dueDate) return 1; 
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}