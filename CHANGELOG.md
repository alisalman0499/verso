# Changelog

What changed in Verso, from a user's point of view, and why. One entry per
merged pull request, newest first. For the exact code changes see the git
history; for the reasoning behind technical decisions see
[ARCHITECTURE.md](ARCHITECTURE.md).

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
