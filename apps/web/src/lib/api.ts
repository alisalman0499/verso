import {
  projectSchema,
  taskSchema,
  type CreateProjectInput,
  type CreateTaskInput,
  type UpdateProjectInput,
  type UpdateTaskInput,
} from '@verso/shared'
import { z, type ZodType } from 'zod'

// The web app's only way to reach the API. Every response is parsed with the
// shared Zod schemas, so the types the components see are checked at runtime,
// not just asserted — if a deployed API and a cached old frontend ever
// disagree, this fails loudly here instead of rendering `undefined`.

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function send(method: Method, path: string, body?: unknown) {
  // Same origin, so the session cookie goes along automatically.
  const res = await fetch(`/api${path}`, {
    method,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    const message = z.object({ error: z.string() }).safeParse(detail)
    throw new ApiError(
      res.status,
      message.success ? message.data.error : res.statusText,
    )
  }
  return res
}

async function request<T>(
  method: Method,
  path: string,
  schema: ZodType<T>,
  body?: unknown,
): Promise<T> {
  const res = await send(method, path, body)
  return schema.parse(await res.json())
}

export const api = {
  listTasks: () => request('GET', '/tasks', z.array(taskSchema)),
  createTask: (input: CreateTaskInput) =>
    request('POST', '/tasks', taskSchema, input),
  updateTask: (id: string, patch: UpdateTaskInput) =>
    request('PATCH', `/tasks/${id}`, taskSchema, patch),
  deleteTask: async (id: string) => {
    await send('DELETE', `/tasks/${id}`)
  },

  listProjects: () => request('GET', '/projects', z.array(projectSchema)),
  createProject: (input: CreateProjectInput) =>
    request('POST', '/projects', projectSchema, input),
  updateProject: (id: string, input: UpdateProjectInput) =>
    request('PATCH', `/projects/${id}`, projectSchema, input),
}
