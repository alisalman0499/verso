# Verso — work queue

Read `CLAUDE.md` first; it overrides anything here. The roadmap is five steps, built
in order. Only the current step is broken down into commits; later steps are
planned when they start.

## Step 1 — Core tasks + login (done)

One commit per item. Build, lint, format check and tests pass before each.

- [x] 0. Rewrite `CLAUDE.md` and this file for the new direction
- [x] 1. Move the app into an npm workspaces monorepo (`apps/web`), no behavior change
- [x] 2. `packages/shared`: Zod schemas for Task and Project, types inferred from them
- [x] 3. `apps/api` skeleton: Hono, health route, env validation, Docker Compose
      (Postgres, Mailpit), Vite `/api` proxy
- [x] 4. Drizzle schema and first migration for `projects` and `tasks`
- [x] 5. Better Auth: email + password, verification, reset, rate limiting; session
      middleware; dev email through Mailpit
- [x] 6. Tasks and projects API (routes → services → db, scoped by `userId`) with
      integration tests for auth, ownership isolation and validation
- [x] 7. Web auth screens, `RequireAuth` guard, sign-out
- [x] 8. Replace localStorage with TanStack Query over the API; `done` → `completedAt`
- [x] 9. Due dates in the UI, with an overdue state
- [x] 10. Update `ARCHITECTURE.md` and `README.md`

Out of scope for Step 1: subtask UI, AI, courses, billing, deployment, OAuth.

### Follow-ups found during Step 1

Small, and not blocking Step 2. Each needs a decision from the owner first
where noted.

- **Sign-out on mobile.** It lives in the sidebar, which is hidden below `md`.
  Needs a decision on mobile navigation (new chrome in the design).
- **Rename a project in the UI.** `PATCH /api/projects/:id` exists; the sidebar
  has no control for it yet.
- **Say why a change reverted.** A failed optimistic update rolls back with no
  message. Needs one consistent, quiet error surface (design decision).
- **`formatWhen` omits the year**, so a deadline more than a year out reads
  like this year's date.
- **A root `dev` script** that starts API and web together. Today it's two
  terminals; one command needs a small dependency (e.g. `concurrently`).

## Next — before Step 2

Requested by the owner after using Step 1 (2026-09-24). One branch and PR per
item, in this order. Each gets a short plan approved before building.

- [x] **Changelog.** `CHANGELOG.md`, one user-level entry per merged PR.
- [x] **Estimate rework.** Entered and shown as hours and minutes (`45m`,
      `1h 30m`), typed as `1h 30m` / `90` / `1.5h` in a text field with quick
      picks (15m · 30m · 1h · 2h). No number spinner. Still stored in minutes.
- [x] **Manual subtasks.** A Subtasks section above Notes in the detail panel:
      add, tick off, delete. Subtasks appear only under their parent; list rows
      show progress (`2/5`). A parent with subtasks shows its estimate as the
      sum of theirs. Step 2's AI breakdown later fills this same list.
- [ ] **Task page** at `/tasks/:id`: the full detail view as a page. Also gives
      phones a way to edit tasks (the detail panel is hidden below `lg`). The
      "Talk about this task" chat becomes a section here in Step 5.
- [ ] **Home / Overview** as the main page, above the lists in the sidebar.
      Introduces real routes (`/` = Home, lists get their own URLs). Waiting on
      the owner's details for what it shows.
- [ ] **Calendar.** Week view (days × hours, tasks at their Do on time,
      deadlines marked) and month view, switchable. Week first. Scope to be
      planned in detail before building.

## Step 2 — AI task breakdown

User gives a big task; the API asks the model for subtasks; the user keeps, edits or
discards each suggestion. Kept suggestions become ordinary tasks with `parentId` set
and `source: 'ai_breakdown'`. Introduces the `ai` module in the API: per-user quota
check before each call, usage recorded in `ai_usage`. Model and SDK chosen here.

## Step 3 — Student layer

Courses (`projects.kind = 'course'` plus a `courses` details table), assignments
(`tasks.kind = 'assignment'` with `dueAt`), and an overview of what's coming up.

## Step 4 — AI daily plan

The AI reads deadlines and open tasks and proposes today's plan (`daily_plans`,
`daily_plan_items`). Needs a `timezone` on the user.

## Step 5 — Chat with tasks

Chat about one or more tasks, streamed over SSE. The AI reads and modifies tasks
through tools that call the same service functions as the HTTP routes. Changes are
recorded in `task_events` so they can be shown and undone.

## Deferred

- **Command palette (⌘K).** In the mockup (`verso-task-manager.html:389`). TanStack
  Query's shared cache removes the old blocker (each `useTasks` caller holding its own
  copy of state). Still needs a plan for the global shortcut, focus trap and list
  navigation.
- **Project deletion.** Needs a decision on what happens to the project's tasks.
- **Billing** (Stripe subscriptions tied to AI quotas), **deployment** (API Dockerfile,
  managed EU Postgres, real email provider), **Google sign-in**, **GDPR** account
  deletion and data export.

## Things worth knowing

- `en-GB` abbreviates September as `Sept`, so `formatWhen` can return `"5 Sept 14:30"`.
- Everything in `lib/time.ts` and `grouping.ts` reads local-time getters. Build test
  fixtures with `new Date(2026, 8, 3, 14, 30)`, never from a UTC string.
