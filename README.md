# Verso

A task manager built around a single day rather than an infinite backlog. Tasks
carry a scheduled time, and the day is drawn as a rail across the top of the
screen so you can see where the work actually sits before you commit to more of
it.

Built with React, TypeScript and Tailwind. No backend — everything persists to
`localStorage` behind a boundary designed so a real one can be dropped in later
without touching a component.

<!--
  SCREENSHOT: add one here before sharing this repo.
  Suggested: `![Verso](docs/screenshot.png)` with the Today view, a few tasks
  across the day, and one selected so the detail panel is populated.
-->

## Running it

```bash
npm install
npm run dev          # dev server on http://localhost:5173
```

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Vite dev server with hot reload       |
| `npm run build`        | Typechecks with `tsc -b`, then builds |
| `npm run lint`         | ESLint                                |
| `npm test`             | Vitest, single run                    |
| `npm run test:watch`   | Vitest in watch mode                  |
| `npm run format`       | Prettier — writes fixes               |
| `npm run format:check` | Prettier — reports without writing    |

## What it does

- **Four lists** — Today, Upcoming, Completed, All tasks — with live counts.
- **Scheduling.** Tasks default to today; the date is set at creation and
  editable afterwards.
- **A day rail** showing every scheduled task and a now-line that advances on a
  timer. The window is 06:00–22:00 by default and widens to whole hours when a
  task falls outside it, so nothing is ever positioned off the end.
- **Grouping that follows the view.** Today splits into Morning / Afternoon /
  Evening / No time set; Upcoming groups by day.
- **In-place editing** of title, notes, estimate and schedule.
- **Keyboard**: `N` opens the composer, `Enter` commits, `Escape` cancels.

## Decisions worth knowing about

The reasoning behind these is in [ARCHITECTURE.md](ARCHITECTURE.md). Briefly:

- **One module touches `localStorage`.** `src/lib/storage.ts` is the only file
  that reads or writes it. That boundary is the whole reason swapping in a real
  backend is a contained change rather than a rewrite.
- **Every task carries a `userId` from day one**, even though there is no auth
  yet and it is always the same placeholder constant. Adding accounts later
  should not require a data migration.
- **The lists are deliberately not mutually exclusive.** Completing a task due
  today leaves it in Today, struck through. Checking something off should not
  make it vanish from the list you are looking at.
- **`src/lib/` contains no React** — no hooks, no JSX. Neither does the
  list-membership logic in `features/tasks/grouping.ts`. Keeping them pure is
  what makes them testable with no DOM and no setup, and all 25 tests are
  against those two modules.
- **Constraints with documented exceptions.** No `any`, and no `as` casts —
  except one, at the JSON parse boundary, with a comment explaining why. No
  inline styles — except in the day rail, which positions marks at percentages
  computed from task data, which Tailwind cannot express.

## Layout

```
src/
  app/          shell and router — every route is declared here, and only here
  components/   shared UI, no domain knowledge
  features/
    tasks/      the tasks domain: page, list, row, detail panel, day rail,
                the useTasks hook, and list-membership logic
  lib/          pure functions — storage boundary, time formatting. No React.
  types/        the Task type
  styles/       Tailwind entry point and the design tokens
```

Features never import from other features. Anything two of them need moves down
into `components/` or `lib/`.

## Testing

25 tests across two files, run with `npm test`:

- `src/lib/time.test.ts` — duration and time formatting, and the round trip
  between ISO strings and the `datetime-local` input format.
- `src/features/tasks/grouping.test.ts` — list membership, the today/upcoming
  boundary at midnight, and the day-part grouping.

These two modules are tested because they are pure and because every bug so far
has been in one of them. Fixtures are built from local date components
(`new Date(2026, 8, 3, 14, 30)`) rather than UTC strings, since the code reads
local-time getters throughout — see the timezone note in
[ARCHITECTURE.md](ARCHITECTURE.md#time-is-local).

## Status

Working and usable. Not finished:

- **Projects** — `Task.projectId` exists and is always `null`. The entity is not
  built yet; doing so requires lifting task state into a context first.
- **Responsive layout** — the three-column grid is desktop-only below ~900px.
- **A command palette** and **accounts** are designed for but not built.

The queue, with the reasoning and the open decisions, is in
[TODO.md](TODO.md).

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 7 · Vitest 4

Tailwind v4 is configured entirely in CSS — the design tokens live in an
`@theme` block in `src/styles/index.css` and there is no `tailwind.config.js`.
