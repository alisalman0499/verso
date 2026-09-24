import { createProjectInput, entityId, updateProjectInput } from '@verso/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireSession, type AuthedEnv } from '../auth/requireSession'
import {
  createProject,
  listProjects,
  updateProject,
} from '../services/projects'
import { validate } from '../validate'

const idParam = z.object({ id: entityId })

// No DELETE yet: what happens to a deleted project's tasks is undecided,
// and the database refuses it in the meantime (see tasks_project_fk).
export const projectsRoutes = new Hono<AuthedEnv>()
  .use(requireSession)
  .get('/', async (c) => c.json(await listProjects(c.get('userId'))))
  .post('/', validate('json', createProjectInput), async (c) => {
    const project = await createProject(c.get('userId'), c.req.valid('json'))
    return c.json(project, 201)
  })
  .patch(
    '/:id',
    validate('param', idParam),
    validate('json', updateProjectInput),
    async (c) => {
      const project = await updateProject(
        c.get('userId'),
        c.req.valid('param').id,
        c.req.valid('json'),
      )
      return c.json(project)
    },
  )
