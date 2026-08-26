import { minutesSinceMidnight } from '../../lib/time'
import type { Task } from '../../types/task'

// Task-specific logic, so it lives in the feature rather than lib/.

export type ListKey = 'today' | 'upcoming' | 'anytime' | 'done'

export const LISTS: { key: ListKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'anytime', label: 'Anytime' },
  { key: 'done', label: 'Completed' },
]

export function classify(task: Task, now: Date): ListKey {
  if (task.done) return 'done'
  if (task.scheduledAt === null) return 'anytime'

  // Anything scheduled for today or earlier surfaces in Today, so an
  // overdue task never silently disappears into some other bucket.
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return new Date(task.scheduledAt) <= endOfToday ? 'today' : 'upcoming'
}

export function tasksForList(tasks: Task[], key: ListKey, now: Date): Task[] {
  return sortByScheduledAt(tasks.filter((task) => classify(task, now) === key))
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
  ]

  for (const task of tasks) {
    if (task.scheduledAt === null) continue
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
  const groups = new Map<string, TaskGroup>()

  for (const task of tasks) {
    if (task.scheduledAt === null) continue
    const label = dayLabelFormatter.format(new Date(task.scheduledAt))
    const group = groups.get(label) ?? { label, items: [] }
    group.items.push(task)
    groups.set(label, group)
  }

  return [...groups.values()]
}

export function groupFlat(tasks: Task[]): TaskGroup[] {
  return [{ label: null, items: tasks }]
}
