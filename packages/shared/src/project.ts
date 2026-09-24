import { z } from 'zod'
import { entityId, isoDateTime, userId } from './common'

// 'course' is the student layer (Step 3): a course is a project with extra
// details, so every project feature works for courses without special cases.
export const projectKind = z.enum(['general', 'course'])

const name = z.string().trim().min(1).max(200)

export const projectSchema = z.object({
  id: entityId,
  userId,
  name,
  kind: projectKind,
  archivedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})

// Inputs are strict: an unknown key is a 400, not silently dropped. A client
// sending a field the API doesn't know about is a bug worth hearing about.
export const createProjectInput = z.strictObject({
  name,
  kind: projectKind.optional(),
})

export const updateProjectInput = z.strictObject({
  name,
})

export type Project = z.infer<typeof projectSchema>
export type ProjectKind = z.infer<typeof projectKind>
export type CreateProjectInput = z.infer<typeof createProjectInput>
export type UpdateProjectInput = z.infer<typeof updateProjectInput>
