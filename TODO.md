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
