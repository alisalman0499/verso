# Changelog

What changed in Verso, from a user's point of view, and why. One entry per
merged pull request, newest first. For the exact code changes see the git
history; for the reasoning behind technical decisions see
[ARCHITECTURE.md](ARCHITECTURE.md).

## 2026-09-24 · Calendar

- **A calendar, in week and month.** Open it from **Calendar** at the top of
  the sidebar. The week shows Monday to Sunday by the hour, each task at its
  Do on time and as tall as its estimate; deadlines sit in a strip above the
  days. The month shows a few entries per day and opens the week when you
  click a day. ‹ › and **Today** move through time (or ← → and T).
  _Why:_ lists answer "what's next"; a calendar shows how a week fits
  together, and whether a deadline has any time planned before it.
- **Plan straight onto it.** Click an empty slot in the week to add a task
  there. End the title with a length ("Essay draft 1h") and the block is
  that long.
- **Tasks show the same way everywhere.** Clicking one in the calendar opens
  it in the side panel, as in the lists. Done tasks stay visible, dimmed.
- **On a phone** the week becomes a list of days, and the month shows dots,
  listing the tasks of the day you tap. There's no link to the calendar on
  phones yet — that comes with phone navigation (see TODO).

## 2026-09-24 · Edit on the task page, glance in the panel

- **The side panel is now read-only.** It shows the task at a glance — dates
  written out in full, estimate and time left, project, subtasks and notes —
  with **Mark done** and **Go to task** at the bottom and **Delete** in a ⋯
  menu at the top. _Why:_ editing happens in one place, the task page, so
  there's one place to learn and nothing to change by accident while
  glancing.
- **"Go to task" on the open row.** Clicking a task shows a "Go to task"
  button right on its row, beside its numbers. It replaces the phone-only `›`,
  so phones and laptops work the same way. _Why:_ it's where you're already
  looking after clicking a task.
- Dates more than a year away now show their year in the panel.

## 2026-09-24 · A page for every task

- **Every task has its own page**, with everything the side panel has, more
  room, and a Back link to the list you came from. Open it with "Open page ↗"
  in the side panel, or on a phone with the `›` at the end of each row.
  _Why:_ on a phone the side panel is hidden, so there was no way to edit a
  task at all. This page is also where "Talk about this task" will live.
- **Your place in the list is kept.** The list or project you're looking at is
  now part of the web address, so going to a task and back, reloading, or
  bookmarking the page keeps it.

## 2026-09-24 · Subtasks in the list

- **Clicking a task folds its subtasks open** right under it in the list, as
  well as opening it in the side panel. Click it again to fold them away; only
  one task is open at a time. A small arrow marks tasks that have subtasks.
  _Why:_ you can see and tick off the steps where you're already looking,
  without moving over to the panel.
- **Tick steps off from the list.** Adding, deleting and estimates stay in
  the panel, so the list stays calm.

## 2026-09-24 · Subtasks

- **Break a task into steps.** A Subtasks section sits above Notes. Tick steps
  off, delete them, and add them by typing: `Write intro 45m` creates "Write
  intro" with a 45-minute estimate. The field stays open, so a whole list can
  be typed in one go. _Why:_ a big task is easier to start as a list of small,
  concrete steps.
- **Progress on the task.** The task's row shows how many steps are done
  (`2/5`), and its estimate becomes the steps' total, with what's left:
  `2h 15m · 1h 45m left`. _Why:_ an honest total for a big task, from numbers
  you already entered.
- **"All steps done — mark the task done?"** When the last step is ticked,
  Verso offers to finish the task rather than doing it for you, since the task
  may still need a final step that isn't on the list.
- Subtasks stay under their task: they don't appear as rows, in counts, or on
  the day rail, and they move with the task when it changes project.

## 2026-09-24 · Easier estimates

- **Estimates are shown as hours and minutes**: `1h 30m` instead of `1.5h`.
  _Why:_ "1.5h" makes you do arithmetic to know it means an hour and a half.
- **Type an estimate the way you'd say it.** `90`, `1h 30m`, `1.5h` and `1,5h`
  all work; a bare number means minutes. Anything unreadable, or more than a
  week, puts the previous value back.
- **Quick picks** (15m · 30m · 1h · 2h) set the estimate in one tap, and the
  fiddly up/down arrows are gone. _Why:_ picking is less friction than typing,
  and the arrows crowded the number.

## 2026-09-24 · Changelog and work queue

- **Added** this changelog, so product decisions have a readable history
  alongside the git log.
- **Planned** the next round of work before the AI steps: estimate rework,
  subtasks, a page per task, a Home page, and a calendar (see `TODO.md`).

## 2026-09-24 · Step 1: accounts and core tasks ([#1])

Verso changed direction: from a single-user day planner into a planning and
focus tool for students with ADHD, built as a SaaS. This release moves it from
the browser onto a real backend.

- **Added accounts.** Sign up with email and password, confirm your email, sign
  in and out, reset a forgotten password. _Why:_ your tasks follow you between
  devices, and a SaaS needs to know who each user is.
- **Moved tasks and projects to a server.** They're stored in a database
  instead of the browser. _Why:_ data no longer disappears with the browser's
  storage, and it's the foundation the AI features need.
- **Added deadlines.** A task has a **Deadline** (when it must be finished)
  separate from **Do on** (when you'll work on it). Past the deadline it reads
  "overdue", in brighter text rather than red. _Why:_ the gap between the two is
  what planning is, and a list shouldn't feel like a scolding.
- **Renamed** the fields from "Due" and "When" to "Deadline" and "Do on". _Why:_
  "Do on" is phrased as an action, so it reads as a commitment rather than an
  intention that's easy to let slide.
- **Your data is private to your account.** Nobody else can see or change your
  tasks, enforced both by the server and by the database itself.

Known gaps, carried into `TODO.md`: no sign-out on phones, project rename isn't
in the interface yet, and a change that fails to save reverts without saying
why.

## 2026-08-25 – 2026-09-02 · The original Verso

A single-user task manager built around one day, storing everything in the
browser: Today / Upcoming / Completed / All tasks lists, a day rail with a
moving now-line, in-place editing, projects, a responsive layout, and keyboard
shortcuts (`N`, `Enter`, `Escape`). Its interface and design carried over
unchanged into Step 1.

[#1]: https://github.com/alisalman0499/verso/pull/1
