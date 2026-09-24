import type { Project } from '../types/project'
import type { Task } from '../types/task'

// Everything read from or written to localStorage goes through this file —
// no component or hook touches localStorage directly (see CLAUDE.md).
const TASKS_KEY = 'verso.tasks'
const TASKS_CORRUPT_KEY = 'verso.tasks.corrupt'
const PROJECTS_KEY = 'verso.projects'
const PROJECTS_CORRUPT_KEY = 'verso.projects.corrupt'

// Shared by every "read the whole list" call below. Kept in one place so
// there is a single spot where corrupt data is recovered rather than
// discarded, and a single spot for the one `as` cast this project permits.
function readList<T>(key: string, corruptKey: string): T[] {
  const raw = localStorage.getItem(key)
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Unreadable data would otherwise throw on every single load, leaving
    // the app stuck on a blank screen with no way out. Set the bad value
    // aside under a second key so it can still be recovered by hand, and
    // start from empty instead.
    localStorage.setItem(corruptKey, raw)
    return []
  }

  // This is the one place untyped data enters the type system: JSON.parse
  // only ever gives us `unknown`. We confirm it's at least an array before
  // trusting the cast — nothing else writes to this key, so a malformed
  // shape here would mean the stored data was tampered with by hand.
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

export function getTasks(): Task[] {
  return readList<Task>(TASKS_KEY, TASKS_CORRUPT_KEY)
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function getProjects(): Project[] {
  return readList<Project>(PROJECTS_KEY, PROJECTS_CORRUPT_KEY)
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}
