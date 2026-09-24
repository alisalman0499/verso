import {
  addDays,
  addMonths,
  fromDateKey,
  startOfDay,
  weekDays,
} from '../../../lib/calendarDates'
import { isSameDay, minutesSinceMidnight, toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
import type { Progress } from '../grouping'

// Where tasks go on the calendar. Pure and tested; the components only
// turn these numbers into positions.

export type CalendarMode = 'week' | 'month'

// What the calendar is showing: a mode, and a date inside the week or month
// on screen.
export type CalendarPosition = { mode: CalendarMode; date: Date }

// Like the lists, the calendar keeps its place in the URL:
//   /calendar                          this week
//   /calendar?mode=month               this month
//   /calendar?date=2026-10-05          the week holding 5 October
//   /calendar?mode=month&date=…        the month holding that date
// Anything unrecognised falls back to this week rather than an error.
export function calendarFromSearchParams(
  params: URLSearchParams,
  now: Date,
): CalendarPosition {
  const mode = params.get('mode') === 'month' ? 'month' : 'week'
  const date = fromDateKey(params.get('date') ?? '') ?? startOfDay(now)
  return { mode, date }
}

// Today gets the clean URL, so "Today" and a bookmark of /calendar always
// mean the current week, not the one that was current when it was saved.
export function searchParamsForCalendar(
  position: CalendarPosition,
  now: Date,
): URLSearchParams {
  const params = new URLSearchParams()
  if (position.mode === 'month') params.set('mode', 'month')
  if (!isSameDay(position.date, now)) {
    params.set('date', toDateKey(position.date))
  }
  return params
}

// One step back or forward: a week in week view, a month in month view.
export function shiftCalendar(
  position: CalendarPosition,
  step: -1 | 1,
): CalendarPosition {
  const date =
    position.mode === 'week'
      ? addDays(position.date, 7 * step)
      : addMonths(position.date, step)
  return { ...position, date }
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric' })
const dayMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
})
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long' })

// The heading: "21–27 Sep", "28 Sep – 4 Oct", or "September", with the
// year above it ("2026", or "2026–27" for the week across New Year).
export function calendarTitle(position: CalendarPosition): {
  year: string
  title: string
} {
  if (position.mode === 'month') {
    return {
      year: String(position.date.getFullYear()),
      title: monthFormatter.format(position.date),
    }
  }
  const days = weekDays(position.date)
  const [first, last] = [days[0], days[6]]
  const firstYear = first.getFullYear()
  const lastYear = last.getFullYear()
  const year =
    firstYear === lastYear
      ? String(firstYear)
      : `${firstYear}–${String(lastYear).slice(-2)}`
  const title =
    first.getMonth() === last.getMonth()
      ? `${dayFormatter.format(first)}–${dayMonthFormatter.format(last)}`
      : `${dayMonthFormatter.format(first)} – ${dayMonthFormatter.format(last)}`
  return { year, title }
}

// How long a task takes up on the calendar when nothing says otherwise.
export const DEFAULT_BLOCK_MINUTES = 30
// The shortest block drawn, so there's always room for a title to read.
// Only the drawing is stretched; the task's estimate is untouched.
export const MIN_BLOCK_MINUTES = 30

// The task's length: its subtasks' estimates added up, else its own
// estimate, else the default — the same order the list row uses.
export function plannedMinutes(task: Task, progress: Progress | null): number {
  return (
    progress?.estimate?.total ?? task.estimateMinutes ?? DEFAULT_BLOCK_MINUTES
  )
}

// A task placed in a day column. `start` and `end` are minutes since that
// day's midnight. Tasks that overlap share the width: this one is in
// `column` (0-based) of `columns`.
export type Block = {
  task: Task & { scheduledAt: string }
  start: number
  end: number
  column: number
  columns: number
}

const DAY_END = 24 * 60

// The blocks for one day, laid out so overlapping tasks sit side by side.
//
// The approach calendar apps commonly use: walk the tasks in start order,
// grouping ones that overlap (directly or through a chain) into clusters.
// Inside a cluster, each task takes the leftmost column that's free by the
// time it starts. Every task in the cluster then gets the same width — the
// cluster's column count — so the columns line up.
export function dayBlocks(
  tasks: Task[],
  day: Date,
  lengthOf: (task: Task) => number,
): Block[] {
  const items = tasks
    .filter(
      (task): task is Task & { scheduledAt: string } =>
        task.scheduledAt !== null && isSameDay(new Date(task.scheduledAt), day),
    )
    .map((task) => {
      const start = minutesSinceMidnight(task.scheduledAt)
      // A task that runs past midnight is cut off at the end of its day.
      const end = Math.min(
        start + Math.max(lengthOf(task), MIN_BLOCK_MINUTES),
        DAY_END,
      )
      return { task, start, end }
    })
    // Earlier first; at the same start, the longer one goes left.
    .sort(
      (a, b) =>
        a.start - b.start ||
        b.end - a.end ||
        a.task.id.localeCompare(b.task.id),
    )

  const blocks: Block[] = []
  let cluster: Block[] = []
  let clusterEnd = -1
  // The time each column in the current cluster is busy until.
  let columnEnds: number[] = []

  function closeCluster() {
    for (const block of cluster) block.columns = columnEnds.length
    blocks.push(...cluster)
    cluster = []
    columnEnds = []
  }

  for (const item of items) {
    if (item.start >= clusterEnd) closeCluster()
    let column = columnEnds.findIndex((busyUntil) => busyUntil <= item.start)
    if (column === -1) column = columnEnds.length
    columnEnds[column] = item.end
    cluster.push({ ...item, column, columns: 0 })
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  closeCluster()

  return blocks
}

const DEFAULT_START = 6 * 60
const DEFAULT_END = 22 * 60

// The hours the week grid shows: 06:00–22:00, stretched to whole hours to
// fit any block outside that, as the day rail does. The current time
// doesn't stretch it: at 01:00, a grid of empty night hours helps nobody;
// the now-line is simply left out until the time is back on the grid.
export function hourRange(blocks: Block[]): { start: number; end: number } {
  const start = Math.min(
    DEFAULT_START,
    ...blocks.map((block) => Math.floor(block.start / 60) * 60),
  )
  const end = Math.max(
    DEFAULT_END,
    ...blocks.map((block) => Math.ceil(block.end / 60) * 60),
  )
  return { start, end: Math.min(end, DAY_END) }
}

// Something on a given day: a task's Do on time, or its deadline. A task
// with both on the same day shows up twice, since those are two different
// things to know about it.
export type CalendarEntry = {
  kind: 'do' | 'due'
  task: Task
  at: string
}

// Everything on a day, in time order — the month view and the phone week.
export function entriesOn(tasks: Task[], day: Date): CalendarEntry[] {
  const entries: CalendarEntry[] = []
  for (const task of tasks) {
    if (task.scheduledAt !== null && isSameDay(new Date(task.scheduledAt), day))
      entries.push({ kind: 'do', task, at: task.scheduledAt })
    if (task.dueAt !== null && isSameDay(new Date(task.dueAt), day))
      entries.push({ kind: 'due', task, at: task.dueAt })
  }
  return entries.sort(
    (a, b) =>
      new Date(a.at).getTime() - new Date(b.at).getTime() ||
      a.task.title.localeCompare(b.task.title),
  )
}

// The deadlines on a day, in time order — the strip above the week grid.
export function deadlinesOn(tasks: Task[], day: Date): Task[] {
  return entriesOn(tasks, day)
    .filter((entry) => entry.kind === 'due')
    .map((entry) => entry.task)
}

// How far down a time column a time of day sits, as a CSS percentage.
// Blocks, hour lines and the now-line are placed with it through `style`:
// like the day rail's marks, the values come from task data at runtime,
// and Tailwind can only make classes for values written in the source.
export function percentDown(minutes: number, start: number, end: number) {
  return `${((minutes - start) / (end - start)) * 100}%`
}
