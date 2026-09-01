# Verso — work queue

Handoff notes for an agent picking up this repo. Read `CLAUDE.md` first; it
overrides anything here. Tasks are ordered to be executed top to bottom.

## Before you touch anything

Constraints that are not negotiable and are not restated in every task:

- **No new dependencies without asking.** The stack is fixed: Vite, React,
  TypeScript, Tailwind, React Router, Vitest. No component library, no state
  library, no date library.
- **No `any`, and no `as` casts to silence the compiler.** There is exactly one
  `as` in the codebase (`lib/storage.ts`, at the JSON parse boundary) and it was
  approved explicitly. If types fight you, say so rather than casting.
- **Tailwind only.** No inline `style`, no CSS files. The one exception is
  `DayRail.tsx`, which positions marks at runtime-computed percentages — that
  exception is approved and does not extend to any other file.
- **Theme tokens only** — `bg-ink`, `text-bone`, `border-hairline`, `text-mute`,
  `text-pure`, and the `/16`-style opacity variants already in use. Never a raw
  hex or `bg-[#09090B]`.
- **The design is settled**: near-black surfaces, bone-white text, no accent
  colour, no gradients, no shadows. Do not redesign a component while fixing it.
- **Features never import other features. `lib/` contains no React.**
- **All persistence goes through `lib/storage.ts`.** No component or hook touches
  `localStorage` directly.
- **`verso-task-manager.html` is the original mockup.** Read it for reference.
  Do not edit it and do not delete it.
- **Never hand-edit `package-lock.json`.**

Run after every task; all four must pass:

```bash
npm run build        # tsc -b && vite build — also typechecks the test files
npm run lint
npm run format:check # run `npm run format` first if this fails
npm test
```

Then commit that task on its own, present tense, describing the change.
**One commit per numbered item below.** Do not batch them.

Ordering note: this is not the order in the original roadmap. Tasks 1–2 are
fully specified and safe to run unattended; tasks 3–4 contain decisions that
need the owner, so they are last. Do not reorder them back.

---

## Task 1 — Fix the four small defects

Four unrelated but cheap fixes, as four commits.

### 1a. `TaskItem.tsx` nests a button inside a `role="button"` div

`src/features/tasks/TaskItem.tsx:18-30` is a `<div role="button" tabIndex={0}>`
containing a real `<button>` for the checkbox. Nesting interactive elements is
invalid HTML, and assistive tech announces it wrong.

Fix:

- Drop `role="button"`, `tabIndex`, and the `onKeyDown` handler from the wrapper
  div. Keep its `onClick` — clicking anywhere on the row should still select the
  task for mouse users.
- Wrap the title `<span>` (`:59-67`) in a real `<button type="button">` that
  calls `onSelect(task.id)`. That becomes the keyboard-focusable way to select.
  Keep the existing `flex-1 truncate` classes on it and add `text-left`.
- Leave the checkbox `<button>` as it is. It already calls `stopPropagation`.

This also closes the "Space doesn't toggle a task" item for free: a real
`<button>` responds to both Enter and Space natively, so once the checkbox is no
longer trapped inside another button, focusing it and pressing Space works.

Verify by hand: Tab through a list — focus should land on the checkbox, then the
title, for each row. Space on the checkbox toggles. Enter on the title selects.

**Commit:** `Fix nested interactive elements in the task row`

### 1b. `groupUpcoming` merges the same date across years

`src/features/tasks/grouping.ts:109-111` keys its `Map` on the _formatted label_
`"Sat 30 Aug"`, which carries no year. 30 Aug 2026 and 30 Aug 2027 collapse into
one section.

Fix:

- Add `toDateKey(date: Date): string` to `src/lib/time.ts`, returning
  `"YYYY-MM-DD"` built from **local** getters (`getFullYear`, `getMonth() + 1`,
  `getDate`) — not `toISOString().slice(0, 10)`, which is UTC and shifts the day
  near midnight. `toDatetimeLocalValue` in the same file already does this
  padding; follow its shape.
- In `groupUpcoming`, key the map on `toDateKey(...)` and keep the human label
  from `dayLabelFormatter` as the group's `label`.
- Add a test in `src/lib/time.test.ts` for `toDateKey` (including a single-digit
  month and day), and one in `grouping.test.ts` asserting that the same
  day-and-month in two different years produces two groups.

**Commit:** `Key upcoming groups by date rather than label`

### 1c. One clock for the page, ticking past midnight

`new Date()` is currently constructed during render in four places
(`TasksPage.tsx:15`, `Sidebar.tsx:15`, `TaskItem.tsx:77`, `TaskDetail.tsx:40`),
and nothing re-renders on its own. At 00:00 the Today list keeps yesterday's
contents until the user happens to click something. `DayRail.tsx` separately runs
its own 30-second interval, so the page has two disagreeing clocks.

Fix — consolidate onto one:

- In `TasksPage.tsx`, replace `const now = new Date()` with state plus an
  interval, using the pattern already in `DayRail.tsx:28-33`. Thirty seconds is
  the right interval; it is what DayRail already uses.
- Pass `now` down as a prop to `Sidebar`, `TaskDetail`, `DayRail`, and through
  `TaskList` to `TaskItem`. One level of prop drilling is fine and is the boring
  solution — do not reach for context here.
- Delete DayRail's own `useState`/`useEffect` clock and take `now` from props.
- Replace the inline `new Date()` calls in `Sidebar`, `TaskItem`, and
  `TaskDetail` with the prop.

Leave `TaskList.tsx:53` and `:91` alone. Those construct a timestamp at the
moment of task creation, which genuinely should be "now, right now", not the
page's tick.

Verify by hand: with the dev server running, the day rail's now-line should still
creep along. Nothing else should change visually.

**Commit:** `Give the page a single ticking clock`

### 1d. Delete has no confirmation

`TaskDetail.tsx` deletes on one click, permanently, with no undo.

Fix — a two-step button, not `window.confirm` (a native dialog would break the
visual language):

- Add `const [isConfirmingDelete, setConfirmingDelete] = useState(false)` to
  `TaskDetail`.
- **Put the `useState` call above the `if (task === null)` early return.** Hooks
  cannot run after a conditional return. `eslint-plugin-react-hooks` will catch
  this, but save yourself the round trip.
- First click sets the flag and the button reads `Confirm delete`. Second click
  calls `onDelete`. Reset the flag when `task.id` changes so the armed state
  never carries across to a different task — the same problem `key={selected.id}`
  already solves for the edit fields.
- Style the confirming state with the tokens already in the file. No red, no new
  colour.

**Commit:** `Require a second click to delete a task`

---

## Task 2 — Responsive layout

`TasksPage.tsx:54` is a hard three-column grid,
`grid h-dvh grid-cols-[254px_minmax(0,1fr)_348px]`. Below roughly 900px the
columns crush and the app is unusable.

Implement exactly this, and nothing more:

- Base (mobile): `grid-cols-1`. Show the task list only. Hide `Sidebar` and
  `TaskDetail` with `hidden`.
- `md:` — `grid-cols-[254px_minmax(0,1fr)]`. Sidebar returns (`md:flex`), detail
  panel stays hidden.
- `lg:` — the current `grid-cols-[254px_minmax(0,1fr)_348px]`. Detail panel
  returns (`lg:flex`).
- The header block at `TasksPage.tsx:58` hardcodes `px-11`; step it down at the
  base breakpoint (`px-5 lg:px-11`) and make the same change in `TaskList.tsx:74`,
  which hardcodes it too.

**Do not invent new chrome for this.** No hamburger button, no drawer, no
overlay, no back arrow — those are new UI in a settled design and are the owner's
call. If you think the result needs one, finish the breakpoint work, then say so
and stop.

Verify: resize the browser through ~600px, ~1000px, and ~1400px. No horizontal
scrollbar at any width, and the list stays readable.

**Commit:** `Collapse the layout to one and two columns on narrow screens`

---

## Task 3 — Projects — ask before writing code

`Task.projectId` exists and is always `null`. The mockup has a `PROJECTS` sidebar
section (`verso-task-manager.html:338`, list at `:436`) with a swatch, a name,
and an open count. Nothing in the app implements it.

Two decisions are the owner's, not yours. **Ask both before writing any code, in
one question:**

1. **The `Project` shape.** `CLAUDE.md` fixes `Task` but says nothing about
   `Project`. Propose `{ id, userId, name, createdAt, updatedAt }` and confirm.
   Specifically: is there a colour or swatch field? The mockup draws a swatch,
   but the design rule is "no colour", so it is probably a monochrome dot — say
   so and check.
2. **Where task state lives.** This is the real blocker. `useTasks.ts:15` holds
   tasks in a plain `useState` inside the hook, so every caller gets its own
   independent copy that overwrites the others on save. `TasksPage` is currently
   the only caller, so it works today. A projects sidebar that needs task counts,
   or anything else that calls `useTasks`, breaks it. The fix is to lift the
   state into a React context provider mounted in `app/`, with `useTasks` reading
   from it. That is an architectural change, and `CLAUDE.md` says not to make
   those silently.

Once both are answered, the shape of the work is:

- `src/types/project.ts` for the type.
- `getProjects` / `saveProjects` in `lib/storage.ts` under a `verso.projects`
  key, mirroring the existing tasks functions, including the same corrupt-data
  handling.
- A `useProjects` hook alongside `useTasks`.
- A `PROJECTS` section in `Sidebar.tsx` below `LISTS`, counting open tasks per
  project.
- Assigning a project in `TaskDetail` — `updateTask` already accepts `projectId`,
  so this is a select element, not new machinery.

**Commit:** split sensibly; at minimum keep the state lifting in its own commit,
separate from the projects feature.

---

## Task 4 — Command palette (⌘K) — depends on Task 3

Present in the mockup (`verso-task-manager.html:389`), not ported. It searches
tasks _and_ projects, so it needs both to exist and needs shared state, which is
why it comes after Task 3.

Do not start this until Task 3 is merged. When you do, plan it first — it
introduces a global keyboard shortcut, a focus trap, and list-navigation
semantics, none of which exist anywhere in the codebase yet.

---

## Known-good state

As of the last commit, `npm run build`, `npm run lint`, `npm run format:check`
and `npm test` all pass. 25 tests across `src/lib/time.test.ts` and
`src/features/tasks/grouping.test.ts`.

Two things worth knowing that are not bugs:

- `en-GB` abbreviates September as `Sept`, not `Sep`, so `formatWhen` can return
  a string as long as `"5 Sept 14:30"`. `TaskItem`'s time column is `min-w-`, so
  it grows to fit — but that is why the column looks uneven in All tasks.
- Every function in `lib/time.ts`, and the boundary logic in `grouping.ts`, reads
  **local**-time getters. Build test fixtures with
  `new Date(2026, 8, 3, 14, 30)`, never `new Date('2026-09-03T14:30:00Z')`, or
  you will write tests that pass only in the timezone you wrote them in.
