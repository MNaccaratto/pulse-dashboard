# Pulse Dashboard

A personal daily briefing that pulls your tasks from **Notion** and your events from **Google Calendar** into one read-only page. Built with Next.js, TypeScript, and Tailwind.

<!-- Add a screenshot of demo mode at docs/screenshot.png, then uncomment: -->
<!-- ![Pulse Dashboard in demo mode](docs/screenshot.png) -->

## Features

- **Tasks from Notion**, grouped into Overdue, Today, Tomorrow, In Two Days, and Later This Week
- **Today's events from Google Calendar**, merged across as many calendars as you like, with all-day events pinned to the top
- **Demo mode**: runs with sample data and no credentials, so you can try it right after cloning
- **Timezone-correct**: "today" is computed in your timezone, not the server's
- **Password-protected** in production, and it refuses to serve in production if no password is configured
- **Read-only**: it never writes to Notion or Google Calendar

## Quick start (demo mode)

Requires Node.js 22 or newer.

```bash
git clone https://github.com/<your-username>/pulse-dashboard.git
cd pulse-dashboard
npm install
cp .env.example .env.local
```

In `.env.local`, set `USE_MOCK_DATA=true`, then:

```bash
npm run dev
```

Open http://localhost:3000. You'll see sample tasks and events and a banner saying it's demo data.

## Connecting your own data

Set `USE_MOCK_DATA=false` (or remove it) once the steps below are done.

### 1. Notion

1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations) and create an **internal integration**. Copy its secret into `NOTION_TOKEN`.
2. Open each task database in Notion, click **⋯ → Connections**, and add your integration. Without this step the API returns an error for that database.
3. Copy each database's ID. It's the 32-character string in the database URL, before the `?v=`.
4. Set `NOTION_DATABASE_IDS`, optionally with labels:

   ```
   NOTION_DATABASE_IDS=School=abc123...,Work=def456...
   ```

Each database needs a **title** property, a **date** property (default name `Due Date`), and a **status** or **select** property (default name `Status`). If yours are named differently, set `NOTION_DUE_PROPERTY` and `NOTION_STATUS_PROPERTY`.

Statuses listed in `NOTION_DONE_STATUSES` (default `done,complete,completed`) are hidden. If you track completion with a checkbox instead, set `NOTION_DONE_CHECKBOX_PROPERTY` to its name and checked rows are filtered out in the query itself.

### 2. Google Calendar (service account)

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Google Calendar API**.
2. Go to **IAM & Admin → Service Accounts**, create a service account, then open it and add a **JSON key** (Keys → Add key). A file downloads.
3. Encode the key so it fits in one environment variable:

   ```bash
   base64 -i your-key-file.json | tr -d '\n'
   ```

   Paste the output into `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`. Then move the original JSON file out of the project folder or delete it.
4. For each calendar you want to show, open Google Calendar → **Settings and sharing → Share with specific people**, and add the service account's email (the `client_email` in the key file) with **See all event details**.
5. Find each calendar ID under **Settings and sharing → Integrate calendar**. For your main calendar it's your email address. Set `GOOGLE_CALENDAR_IDS`:

   ```
   GOOGLE_CALENDAR_IDS=Personal=you@gmail.com,School=abc123@group.calendar.google.com
   ```

Instead of the base64 variable you can use `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` (see `.env.example`).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DASHBOARD_USER` | In production | Username for the login prompt |
| `DASHBOARD_PASSWORD` | In production | Password for the login prompt. Use a long random value |
| `DASHBOARD_TIMEZONE` | No | IANA timezone, default `America/New_York` |
| `USE_MOCK_DATA` | No | `true` shows demo data and skips all API calls |
| `NOTION_TOKEN` | For Notion | Internal integration secret |
| `NOTION_DATABASE_IDS` | For Notion | `Label=id,Label2=id2` (bare IDs also work) |
| `NOTION_STATUS_PROPERTY` | No | Default `Status` |
| `NOTION_DUE_PROPERTY` | No | Default `Due Date` |
| `NOTION_DONE_STATUSES` | No | Default `done,complete,completed` |
| `NOTION_DONE_CHECKBOX_PROPERTY` | No | Hide rows where this checkbox is checked |
| `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` | For Calendar | Base64 of the service-account key file |
| `GOOGLE_CALENDAR_IDS` | For Calendar | `Label=calendarId,Label2=calendarId2` |

If Notion or Calendar credentials are missing, that half of the page falls back to demo data and says so in a banner.

## Security

- Secrets live only in `.env.local` (git-ignored) or your host's environment settings. Only `.env.example`, which holds placeholders, is committed.
- All API calls happen on the server. Tokens and keys are never sent to the browser.
- Access to the Google Calendar is read-only (`calendar.readonly` scope).
- `proxy.ts` puts HTTP basic auth in front of every page. In production with no `DASHBOARD_USER` / `DASHBOARD_PASSWORD` set, it responds with 503 instead of serving your data. Demo mode is exempt because it only shows sample data. Basic auth is only safe over HTTPS, which Vercel provides by default.
- Error messages shown on the page are generic. Details are logged server-side only.

## Deploying to Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add the environment variables above in **Project Settings → Environment Variables**, including `DASHBOARD_USER` and `DASHBOARD_PASSWORD`.
3. Deploy. To host a public demo instead, set only `USE_MOCK_DATA=true`.

## Project structure

```
app/
  page.tsx          # the dashboard (server component, rendered per request)
lib/
  notion.ts         # Notion API client with pagination and server-side filtering
  calendar.ts       # Google Calendar client (service account)
  tasks.ts          # grouping tasks by day (pure functions)
  dates.ts          # timezone-safe date helpers (pure functions)
  config.ts         # env parsing and defaults
  mock.ts           # demo data
  types.ts          # shared types
proxy.ts            # basic-auth gate (named middleware.ts before Next.js 16)
```

The logic that decides *which day a task or event belongs to* lives in `lib/tasks.ts` and `lib/dates.ts` as plain functions with no I/O, which keeps it easy to test.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint |
| `npm test` | Run the unit tests (Vitest) |

## Roadmap

- AI-suggested top three priorities for the day
- Natural-language task entry
- Desktop app wrapper
- Write support (add events from the dashboard)

## License

MIT. Add a `LICENSE` file if you publish this.