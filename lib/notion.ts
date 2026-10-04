import { getDoneStatuses, getTimeZone, LOOKAHEAD_DAYS, parseNamedList, useMockData } from './config';
import { addDaysToKey, toDateKey } from './dates';
import { getMockTasks } from './mock';
import type { FetchResult, Task } from './types';

const NOTION_VERSION = '2022-06-28';
const PAGE_SIZE = 100;
const MAX_PAGES = 10; // hard cap so a bad cursor can never loop forever

interface NotionProperty {
  type: string;
  title?: { plain_text: string }[];
  status?: { name: string } | null;
  select?: { name: string } | null;
  date?: { start: string } | null;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
}

interface NotionQueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

async function queryDatabase(token: string, databaseId: string, filter: object): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      cache: 'no-store', // never serve stale tasks from Next's fetch cache
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter,
        page_size: PAGE_SIZE,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });

    if (!res.ok) throw new Error(`Notion responded with ${res.status}`);

    const json = (await res.json()) as NotionQueryResponse;
    pages.push(...json.results);
    if (!json.has_more || !json.next_cursor) break;
    cursor = json.next_cursor;
  }
  return pages;
}

function toTask(page: NotionPage, source: string, statusProp: string, dueProp: string): Task {
  const props = Object.values(page.properties);
  const titleProp = props.find((p) => p.type === 'title');
  // Titles are split into rich-text segments; join them all, not just the first.
  const title = titleProp?.title?.map((t) => t.plain_text).join('').trim() || 'Untitled Task';

  const status = page.properties[statusProp];
  return {
    id: page.id,
    title,
    dueDate: page.properties[dueProp]?.date?.start ?? null,
    status: status?.status?.name ?? status?.select?.name ?? 'Unknown',
    source,
  };
}

/**
 * Fetches open tasks due on or before the lookahead limit (overdue included).
 * Done-status filtering and bucketing happen in lib/tasks.ts so they stay testable.
 *
 * Env:
 *   NOTION_TOKEN, NOTION_DATABASE_IDS ("Academic=abc123,Personal=def456")
 *   NOTION_STATUS_PROPERTY (default "Status"), NOTION_DUE_PROPERTY (default "Due Date")
 *   NOTION_DONE_CHECKBOX_PROPERTY (optional): also filters server-side on checkbox == false
 */
export async function getActiveNotionTasks(now = new Date()): Promise<FetchResult<Task[]>> {
  const timeZone = getTimeZone();
  const today = toDateKey(now, timeZone);

  const token = process.env.NOTION_TOKEN;
  const databases = parseNamedList(process.env.NOTION_DATABASE_IDS, 'Database');

  if (useMockData() || !token || databases.length === 0) {
    if (!useMockData()) console.warn('⚠️ Notion credentials missing, showing demo data.');
    return { data: getMockTasks(today), errors: [], isMock: true };
  }

  const statusProp = process.env.NOTION_STATUS_PROPERTY || 'Status';
  const dueProp = process.env.NOTION_DUE_PROPERTY || 'Due Date';
  const checkboxProp = process.env.NOTION_DONE_CHECKBOX_PROPERTY;

  const clauses: object[] = [{ property: dueProp, date: { on_or_before: addDaysToKey(today, LOOKAHEAD_DAYS) } }];
  if (checkboxProp) clauses.push({ property: checkboxProp, checkbox: { equals: false } });
  const filter = { and: clauses };

  const errors: string[] = [];
  const results = await Promise.all(
    databases.map(async ({ name, id }) => {
      try {
        const pages = await queryDatabase(token, id, filter);
        return pages.map((p) => toTask(p, name, statusProp, dueProp));
      } catch (err) {
        console.error(`❌ Notion database "${name}" failed:`, err instanceof Error ? err.message : err);
        errors.push(`Couldn't load tasks from "${name}".`);
        return [];
      }
    }),
  );

  // Drop finished tasks here too so callers get a clean list even without bucketing.
  const done = getDoneStatuses();
  const data = results.flat().filter((t) => !done.has(t.status.trim().toLowerCase()));
  return { data, errors, isMock: false };
}