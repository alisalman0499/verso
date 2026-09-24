# Verso

A planning and focus tool for students with ADHD. It works for any kind of
task, with a student layer on top — courses, assignments, deadlines — and AI
that helps break big tasks down and plan the day.

Verso is a planning tool. It is not a medical or treatment tool.

<!--
  SCREENSHOT: add one here before sharing this repo.
  Suggested: `![Verso](docs/screenshot.png)` with the Today view, a few tasks
  across the day, and one selected so the detail panel is populated.
-->

## Status

Step 1 of 5 is done: accounts and core tasks. See [TODO.md](TODO.md) for the
roadmap.

- **Accounts** — sign-up with email verification, sign-in, sign-out, password
  reset.
- **Tasks** — create, edit, complete, delete; a deadline (**due**) separate from
  when you plan to work on it (**when**), an estimate, notes. Past-deadline
  tasks read "overdue".
- **Projects** — create, file tasks under them, filter by them.
- **Four lists** — Today, Upcoming, Completed, All tasks — and a **day rail**
  showing where the day's work sits, with a now-line that moves.
- **Keyboard** — `N` opens the composer, `Enter` commits, `Escape` cancels.

## Running it

Needs Node 22+ and Docker.

```bash
npm install
docker compose up -d                           # Postgres + Mailpit
cp apps/api/.env.example apps/api/.env         # then set BETTER_AUTH_SECRET:
                                               #   openssl rand -base64 32
npm run db:migrate                             # create the tables

npm run dev:api                                # API on :3000
npm run dev:web                                # in a second terminal: app on :5173
```

Open http://localhost:5173 and sign up. The verification email lands in
**Mailpit** at http://localhost:8025 — nothing is sent for real in development.

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev:web`      | Vite dev server with hot reload; proxies `/api`        |
| `npm run dev:api`      | API with reload on save                                |
| `npm run build`        | Typechecks every workspace, builds the web app         |
| `npm run lint`         | ESLint, every workspace                                |
| `npm test`             | Every test suite (the API's needs `docker compose up`) |
| `npm run format`       | Prettier — writes fixes                                |
| `npm run format:check` | Prettier — reports without writing                     |
| `npm run db:migrate`   | Applies pending migrations to the dev database         |

After changing `apps/api/src/db/schema.ts`, generate a migration with
`npm run db:generate --workspace @verso/api`, read the SQL it wrote to
`apps/api/drizzle/`, and commit it.

## Layout

```
apps/
  web/          React app — features/, app/ (router, guard), lib/ (no React)
  api/          Hono API — routes/ → services/ → db/, auth/, email/
packages/
  shared/       Zod schemas: the one definition of Task and Project
docker-compose.yml   Postgres + Mailpit for development
```

## Decisions worth knowing about

The reasoning is in [ARCHITECTURE.md](ARCHITECTURE.md). Briefly:

- **Every AI call will go through the API.** The key never reaches the browser,
  and usage is limitable per user.
- **One schema, both sides.** The API validates requests with the shared Zod
  schemas; the web app parses responses with them.
- **Ownership is enforced twice** — by every service query, and by composite
  foreign keys that make Postgres refuse to link your task to someone else's
  project.
- **Services, not routes, hold the rules**, so the AI's tools (Step 5) can call
  the same functions the UI does.
- **Cookie sessions on a single origin** — no tokens in localStorage, no CORS.
- **Deadline and plan are separate fields** (`dueAt`, `scheduledAt`), because
  the gap between them is what planning is.

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 7 · TanStack
Query 5 · Hono 4 · Better Auth 1.7 · Drizzle ORM · PostgreSQL 17 · Zod 4 ·
Vitest 4
