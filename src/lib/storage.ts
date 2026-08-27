import type { Task } from '../types/task'

// Everything read from or written to localStorage goes through this file —
// no component or hook touches localStorage directly (see CLAUDE.md).
const TASKS_KEY = 'verso.tasks'
const CORRUPT_KEY = 'verso.tasks.corrupt'

export function getTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY)
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Unreadable data would otherwise throw on every single load, leaving
    // the app stuck on a blank screen with no way out. Set the bad value
    // aside under a second key so it can still be recovered by hand, and
    // start from empty instead.
    localStorage.setItem(CORRUPT_KEY, raw)
    return []
  }

  // This is the one place untyped data enters the type system: JSON.parse
  // only ever gives us `unknown`. We confirm it's at least an array before
  // trusting the cast — nothing else writes to this key, so a malformed
  // shape here would mean the stored data was tampered with by hand.
  return Array.isArray(parsed) ? (parsed as Task[]) : []
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}
