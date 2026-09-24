import type {
  CreateTaskInput,
  Task,
  TaskSource,
  UpdateTaskInput,
} from '@verso/shared'
import { and, asc, eq, isNull, max } from 'drizzle-orm'
import { db } from '../db/client'
import { tasks } from '../db/schema'
import { InvalidInputError, NotFoundError } from '../errors'
import { ownsProject } from './projects'

// Every function takes the owner's userId first and scopes every query by
// it. The HTTP routes call these, and so will the AI's tools in Step 5 —
// one code path, one set of ownership checks.

type TaskRow = typeof tasks.$inferSelect

// Database rows carry Date objects; the API contract carries ISO strings.
function toTask(row: TaskRow): Task {
  return {
    ...row,
    dueAt: row.dueAt?.toISOString() ?? null,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toDate(iso: string | null | undefined): Date | null | undefined {
  if (iso === undefined) return undefined
  return iso === null ? null : new Date(iso)
}

export async function listTasks(userId: string): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))
  return rows.map(toTask)
}

// The database would refuse another user's project too (composite foreign
// key), but checking here gives a clear 400 instead of a constraint error.
async function assertOwnsProject(userId: string, projectId: string) {
  if (!(await ownsProject(userId, projectId))) {
    throw new InvalidInputError('Project not found')
  }
}

// A parent must be the user's own task, and must not itself be a subtask:
// subtasks are one level deep.
async function assertValidParent(userId: string, parentId: string) {
  const [parent] = await db
    .select({ parentId: tasks.parentId })
    .from(tasks)
    .where(and(eq(tasks.id, parentId), eq(tasks.userId, userId)))
  if (parent === undefined) throw new InvalidInputError('Parent task not found')
  if (parent.parentId !== null) {
    throw new InvalidInputError('Subtasks cannot have subtasks of their own')
  }
}

// New tasks go to the end of their siblings (tasks with the same parent).
async function nextPosition(userId: string, parentId: string | null) {
  const [{ value }] = await db
    .select({ value: max(tasks.position) })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        parentId === null
          ? isNull(tasks.parentId)
          : eq(tasks.parentId, parentId),
      ),
    )
  return value === null ? 0 : value + 1
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
  source: TaskSource = 'user',
): Promise<Task> {
  const projectId = input.projectId ?? null
  const parentId = input.parentId ?? null
  if (projectId !== null) await assertOwnsProject(userId, projectId)
  if (parentId !== null) await assertValidParent(userId, parentId)

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: input.title,
      notes: input.notes,
      projectId,
      parentId,
      kind: input.kind,
      dueAt: toDate(input.dueAt),
      scheduledAt: toDate(input.scheduledAt),
      estimateMinutes: input.estimateMinutes,
      position: await nextPosition(userId, parentId),
      source,
    })
    .returning()
  return toTask(row)
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: UpdateTaskInput,
): Promise<Task> {
  const [current] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
  if (current === undefined) throw new NotFoundError('Task not found')

  if (patch.projectId !== undefined && patch.projectId !== null) {
    await assertOwnsProject(userId, patch.projectId)
  }

  // Completing an already-completed task keeps its original completion time,
  // so sending the same request twice (a retry) changes nothing.
  let completedAt: Date | null | undefined
  if (patch.completed === true) completedAt = current.completedAt ?? new Date()
  if (patch.completed === false) completedAt = null

  const [row] = await db
    .update(tasks)
    .set({
      title: patch.title,
      notes: patch.notes,
      projectId: patch.projectId,
      kind: patch.kind,
      dueAt: toDate(patch.dueAt),
      scheduledAt: toDate(patch.scheduledAt),
      estimateMinutes: patch.estimateMinutes,
      completedAt,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
  // Deleted between the read above and this write.
  if (row === undefined) throw new NotFoundError('Task not found')
  return toTask(row)
}

export async function deleteTask(userId: string, taskId: string) {
  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id })
  if (deleted.length === 0) throw new NotFoundError('Task not found')
}
