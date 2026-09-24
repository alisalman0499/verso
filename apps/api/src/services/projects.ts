import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@verso/shared'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects } from '../db/schema'
import { NotFoundError } from '../errors'

// Every function takes the owner's userId first and scopes every query by
// it. There is no way to reach a project without saying whose it is.

type ProjectRow = typeof projects.$inferSelect

// Database rows carry Date objects; the API contract carries ISO strings.
function toProject(row: ProjectRow): Project {
  return {
    ...row,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listProjects(userId: string): Promise<Project[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(asc(projects.createdAt))
  return rows.map(toProject)
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const [row] = await db
    .insert(projects)
    .values({ userId, name: input.name, kind: input.kind })
    .returning()
  return toProject(row)
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const [row] = await db
    .update(projects)
    .set({ name: input.name })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()
  if (row === undefined) throw new NotFoundError('Project not found')
  return toProject(row)
}

// Whether the project exists and belongs to this user. Used by the task
// service before attaching a task to a project.
export async function ownsProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  return row !== undefined
}
