import { minutesSinceMidnight, toDateKey } from '../../lib/time'
import type { Task } from '../../types/task'

// Task-specific logic, so it lives in the feature rather than lib/.

// A task is done once it has a completion time. The API stores when, not
// just whether; everything here only needs whether.
export function isDone(task: Task): boolean {
  return task.completedAt !== null
}

// Past its deadline and still open. A finished task is never overdue, even
// if it was finished late — there's nothing left to act on.
export function isOverdue(task: Task, now: Date): boolean {
  return !isDone(task) && task.dueAt !== null && new Date(task.dueAt) < now
}

// 'all' isn't something classify() ever returns — it's not a bucket a task
// belongs to, it's a view that shows every task regardless of bucket.
export type ListKey = 'today' | 'upcoming' | 'done' | 'all'

export const LISTS: { key: ListKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Completed' },
  { key: 'all', label: 'All tasks' },
]

// The single, primary list a task "belongs to" — used for the one-line
// summary in the detail panel. Done always wins here, so it stays a
// simple label even though a task can appear in more than one list (see
// isInList below).
export function classify(task: Task, now: Date): Exclude<ListKey, 'all'> {
  if (isDone(task)) return 'done'

  // No date, or scheduled for today or earlier, both surface in Today —
  // every task gets a date by default now, so this is mainly the "date
  // was cleared" edge case, and an overdue task never silently vanishes.
  if (task.scheduledAt === null) return 'today'
  return isOnOrBeforeToday(task.scheduledAt, now) ? 'today' : 'upcoming'
}

function isOnOrBeforeToday(scheduledAt: string, now: Date): boolean {
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return new Date(scheduledAt) <= endOfToday
}

// Whether a task shows up when viewing a given list. Unlike classify(),
// this isn't mutually exclusive — a task due today that's been checked
// off still counts as "today" (so finishing it doesn't make it vanish
// from the view you're looking at) as well as "done".
export function isInList(task: Task, key: ListKey, now: Date): boolean {
  if (key === 'all') return true
  if (key === 'done') return isDone(task)
  if (key === 'today') {
    // An undated task only counts as "today" while it's still open —
    // once done, it just lives in Completed/All tasks.
    if (task.scheduledAt === null) return !isDone(task)
    return isOnOrBeforeToday(task.scheduledAt, now)
  }
  // upcoming
  return (
    !isDone(task) &&
    task.scheduledAt !== null &&
    !isOnOrBeforeToday(task.scheduledAt, now)
  )
}

export function tasksForList(tasks: Task[], key: ListKey, now: Date): Task[] {
  return sortByScheduledAt(tasks.filter((task) => isInList(task, key, now)))
}

// The thing the main list is currently showing: either one of the fixed
// lists above, or a project. A project isn't a ListKey — classify() and
// isInList() only ever reason about done/scheduledAt, nothing about
// projectId — so this is a separate, wider type layered on top rather than
// a fifth ListKey.
export type View =
  { type: 'list'; key: ListKey } | { type: 'project'; projectId: string }

// The open view lives in the URL's path, so it survives a reload, a
// bookmark, and a trip to a task's page and back:
//   /lists/upcoming   one of the fixed lists
//   /projects/<id>    a project
// `/` is the Overview, not a view; see the router.
export function pathForView(view: View): string {
  if (view.type === 'project') {
    return `/projects/${encodeURIComponent(view.projectId)}`
  }
  return `/lists/${view.key}`
}

// The reverse, from the route's params. An unrecognised list falls back to
// Today rather than an empty screen.
export function viewFromRouteParams(params: {
  listKey?: string
  projectId?: string
}): View {
  if (params.projectId !== undefined && params.projectId !== '') {
    return { type: 'project', projectId: params.projectId }
  }
  const list = LISTS.find((candidate) => candidate.key === params.listKey)
  return { type: 'list', key: list?.key ?? 'today' }
}

// Views used to live in the query string (`/?list=upcoming`,
// `/?project=<id>`). Old bookmarks still carry those, so the Overview reads
// them once and redirects. Null when the query names no view.
export function viewFromLegacySearch(params: URLSearchParams): View | null {
  const projectId = params.get('project')
  if (projectId !== null && projectId !== '') {
    return { type: 'project', projectId }
  }
  const list = LISTS.find((candidate) => candidate.key === params.get('list'))
  return list === undefined ? null : { type: 'list', key: list.key }
}

export function tasksForView(tasks: Task[], view: View, now: Date): Task[] {
  if (view.type === 'list') return tasksForList(tasks, view.key, now)
  return sortByScheduledAt(
    tasks.filter((task) => task.projectId === view.projectId),
  )
}

// The project a task created from this view should belong to. Creating a
// task while looking at a project puts it in that project; creating one
// from any of the fixed lists leaves it unassigned.
export function projectIdForView(view: View): string | null {
  return view.type === 'project' ? view.projectId : null
}

// Open (not done) tasks in a project — what the sidebar count shows.
// Completed tasks stay assigned to their project; they just don't count
// here, the same way Today's tally only counts what's still open.
export function openTaskCount(tasks: Task[], projectId: string): number {
  return tasks.filter((task) => task.projectId === projectId && !isDone(task))
    .length
}

function sortByScheduledAt(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.scheduledAt === null && b.scheduledAt === null) return 0
    if (a.scheduledAt === null) return 1
    if (b.scheduledAt === null) return -1
    return a.scheduledAt.localeCompare(b.scheduledAt)
  })
}

export type TaskGroup = {
  label: string | null
  items: Task[]
}

export function groupToday(tasks: Task[]): TaskGroup[] {
  const buckets: TaskGroup[] = [
    { label: 'Morning', items: [] },
    { label: 'Afternoon', items: [] },
    { label: 'Evening', items: [] },
    { label: 'No time set', items: [] },
  ]

  for (const task of tasks) {
    if (task.scheduledAt === null) {
      buckets[3].items.push(task)
      continue
    }
    const minutes = minutesSinceMidnight(task.scheduledAt)
    if (minutes < 12 * 60) buckets[0].items.push(task)
    else if (minutes < 17 * 60) buckets[1].items.push(task)
    else buckets[2].items.push(task)
  }

  return buckets.filter((group) => group.items.length > 0)
}

const dayLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function groupUpcoming(tasks: Task[]): TaskGroup[] {
  // Keyed on the date, not the formatted label — "Sat 30 Aug" carries no
  // year, so the same day-and-month a year apart would otherwise collapse
  // into one group.
  const groups = new Map<string, TaskGroup>()

  for (const task of tasks) {
    if (task.scheduledAt === null) continue
    const date = new Date(task.scheduledAt)
    const key = toDateKey(date)
    const group = groups.get(key) ?? {
      label: dayLabelFormatter.format(date),
      items: [],
    }
    group.items.push(task)
    groups.set(key, group)
  }

  return [...groups.values()]
}

// All tasks, split by the one list each task belongs to (see classify), so
// every task shows once: a task done today sits under Completed, not Today.
// Keeps the incoming order within each section; empty sections are left out.
export function groupAll(tasks: Task[], now: Date): TaskGroup[] {
  const order: Exclude<ListKey, 'all'>[] = ['today', 'upcoming', 'done']
  return order
    .map((key) => ({
      label: LISTS.find((list) => list.key === key)?.label ?? key,
      items: tasks.filter((task) => classify(task, now) === key),
    }))
    .filter((group) => group.items.length > 0)
}

export function groupFlat(tasks: Task[]): TaskGroup[] {
  return [{ label: null, items: tasks }]
}

// Subtasks live under their parent, never as rows of their own: the lists,
// counts and day rail all work on top-level tasks only.
export function topLevelTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.parentId === null)
}

export function subtasksOf(tasks: Task[], parentId: string): Task[] {
  return tasks
    .filter((task) => task.parentId === parentId)
    .sort(
      (a, b) =>
        a.position - b.position || a.createdAt.localeCompare(b.createdAt),
    )
}

export type SubtaskEstimate = { total: number; remaining: number }

export type Progress = {
  done: number
  total: number
  // The subtasks' estimates added up; null when none of them has one.
  estimate: SubtaskEstimate | null
}

// "2 of 5 subtasks done, 2h 30m of work", for every task that has subtasks,
// in one pass — the list asks for it once per row.
export function progressByParent(tasks: Task[]): Map<string, Progress> {
  const progress = new Map<string, Progress>()
  for (const task of tasks) {
    if (task.parentId === null) continue
    const entry = progress.get(task.parentId) ?? {
      done: 0,
      total: 0,
      estimate: null,
    }
    entry.total += 1
    if (isDone(task)) entry.done += 1
    if (task.estimateMinutes !== null) {
      const estimate = entry.estimate ?? { total: 0, remaining: 0 }
      estimate.total += task.estimateMinutes
      if (!isDone(task)) estimate.remaining += task.estimateMinutes
      entry.estimate = estimate
    }
    progress.set(task.parentId, entry)
  }
  return progress
}

// The parent's estimate, worked out from its subtasks: the total, and what's
// left of it among the ones still open. null when no subtask has an estimate,
// so the parent's own estimate field is used instead.
export function estimateFromSubtasks(subtasks: Task[]): SubtaskEstimate | null {
  const estimated = subtasks.filter((task) => task.estimateMinutes !== null)
  if (estimated.length === 0) return null
  let total = 0
  let remaining = 0
  for (const task of estimated) {
    const minutes = task.estimateMinutes ?? 0
    total += minutes
    if (!isDone(task)) remaining += minutes
  }
  return { total, remaining }
}
