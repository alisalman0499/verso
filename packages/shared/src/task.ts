import { z } from 'zod'
import { entityId, isoDateTime, userId } from './common'

// 'assignment' is the student layer (Step 3). It is still a task, so
// everything that works on tasks — including AI breakdown — works on it.
export const taskKind = z.enum(['task', 'assignment'])

// Who created the task. Set by the server, never by the client: the route a
// request comes through decides it, not the request body.
export const taskSource = z.enum(['user', 'ai_breakdown', 'ai_chat'])

// Field rules shared by the entity and the inputs, so "what is a valid
// title" is written once.
const title = z.string().trim().min(1).max(500)
const notes = z.string().max(20_000)
// One week of work. Anything bigger is a project, not a task, and belongs
// split into subtasks.
export const MAX_ESTIMATE_MINUTES = 7 * 24 * 60
const estimateMinutes = z.int().min(0).max(MAX_ESTIMATE_MINUTES)

export const taskSchema = z.object({
  id: entityId,
  userId,
  projectId: entityId.nullable(),
  // Subtasks point at their parent. One level deep, enforced by the API.
  parentId: entityId.nullable(),
  title,
  notes,
  kind: taskKind,
  // The deadline: when it has to be finished.
  dueAt: isoDateTime.nullable(),
  // The plan: when you intend to work on it. Deliberately separate from dueAt.
  scheduledAt: isoDateTime.nullable(),
  estimateMinutes: estimateMinutes.nullable(),
  // null while open. A timestamp rather than a boolean, because "when was it
  // done" can't be recovered later and the daily plan needs it.
  completedAt: isoDateTime.nullable(),
  // Order among siblings (tasks with the same parent).
  position: z.int(),
  source: taskSource,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})

export const createTaskInput = z.strictObject({
  title,
  notes: notes.optional(),
  projectId: entityId.nullable().optional(),
  parentId: entityId.nullable().optional(),
  kind: taskKind.optional(),
  dueAt: isoDateTime.nullable().optional(),
  scheduledAt: isoDateTime.nullable().optional(),
  estimateMinutes: estimateMinutes.nullable().optional(),
})

// A patch: every field optional, send only what changed. Completion is a
// boolean here, not a timestamp — the server stamps completedAt with its own
// clock, the same way it owns createdAt and updatedAt.
export const updateTaskInput = z
  .strictObject({
    title,
    notes,
    projectId: entityId.nullable(),
    kind: taskKind,
    dueAt: isoDateTime.nullable(),
    scheduledAt: isoDateTime.nullable(),
    estimateMinutes: estimateMinutes.nullable(),
    completed: z.boolean(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'At least one field must be provided',
  })

export type Task = z.infer<typeof taskSchema>
export type TaskKind = z.infer<typeof taskKind>
export type TaskSource = z.infer<typeof taskSource>
export type CreateTaskInput = z.infer<typeof createTaskInput>
export type UpdateTaskInput = z.infer<typeof updateTaskInput>
