import type { Task } from '../types/task'

// Everything read from or written to localStorage goes through this file —
// no component or hook touches localStorage directly (see CLAUDE.md).
const TASKS_KEY = 'verso.tasks'

export function getTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY)
  if (raw === null) return []

  const parsed: unknown = JSON.parse(raw)

  // This is the one place untyped data enters the type system: JSON.parse
  // only ever gives us `unknown`. We confirm it's at least an array before
  // trusting the cast — nothing else writes to this key, so a malformed
  // shape here would mean the stored data was tampered with by hand.
  return Array.isArray(parsed) ? (parsed as Task[]) : []
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}
