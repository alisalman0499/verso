import type { Task, UpdateTaskInput } from '../../types/task'

// What the server will do with a patch, done locally so the change shows
// the moment it's made (an optimistic update). Mirrors services/tasks.ts in
// the API: completing keeps an existing completedAt, reopening clears it.
// The server's response replaces this guess as soon as it arrives.
export function applyPatch(
  task: Task,
  patch: UpdateTaskInput,
  now: Date,
): Task {
  const { completed, ...fields } = patch
  let completedAt = task.completedAt
  if (completed === true) completedAt = task.completedAt ?? now.toISOString()
  if (completed === false) completedAt = null
  return { ...task, ...fields, completedAt, updatedAt: now.toISOString() }
}
