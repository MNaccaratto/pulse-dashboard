export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  source: string;
  rawProperties: any;
}

export async function getActiveNotionTasks(): Promise<Task[]> {
  const token = process.env.NOTION_TOKEN;
  const dbIdsString = process.env.NOTION_DATABASE_IDS;
  
  if (!token || !dbIdsString) {
    console.warn("⚠️ Missing NOTION_TOKEN or NOTION_DATABASE_IDS in .env.local");
    return [];
  }

  const databaseIds = dbIdsString.split(',').map(id => id.trim());
  console.log("🔍 Fetching from Database IDs:", databaseIds); 

  const allTasks: Task[] = [];
  
  for (let i = 0; i < databaseIds.length; i++) {
    const databaseId = databaseIds[i];
    console.log(`⏳ Querying database: ${databaseId}...`);
    
    // Direct REST API call bypassing the SDK
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      // Empty body retrieves everything (no filters)
      body: JSON.stringify({})
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch DB ${databaseId}: ${res.statusText}`);
      const errorText = await res.text();
      console.error(errorText);
      continue;
    }

    const data = await res.json();
    console.log(`📦 Database ${i + 1} returned ${data.results.length} items`);

    const parsedTasks = data.results.map((page: any) => ({
      id: page.id,
      title: page.properties.Name?.title?.[0]?.plain_text || 'Untitled Task',
      dueDate: page.properties['Due Date']?.date?.start || null,
      source: `Database ${i + 1}`,
      rawProperties: page.properties
    }));

    allTasks.push(...parsedTasks);
  }

  return allTasks;
}