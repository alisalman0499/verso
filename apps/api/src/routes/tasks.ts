import { createTaskInput, entityId, updateTaskInput } from '@verso/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireSession, type AuthedEnv } from '../auth/requireSession'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../services/tasks'
import { validate } from '../validate'

// Routes do HTTP only: check the session, validate the input, call a
// service, pick a status code. Anything that is a rule lives in the service.
//
// The handlers are chained onto one expression on purpose: Hono infers each
// route's input and output types through the chain, and the web app's typed
// client reads them from there.

const idParam = z.object({ id: entityId })

export const tasksRoutes = new Hono<AuthedEnv>()
  .use(requireSession)
  .get('/', async (c) => c.json(await listTasks(c.get('userId'))))
  .post('/', validate('json', createTaskInput), async (c) => {
    const task = await createTask(c.get('userId'), c.req.valid('json'))
    return c.json(task, 201)
  })
  .patch(
    '/:id',
    validate('param', idParam),
    validate('json', updateTaskInput),
    async (c) => {
      const task = await updateTask(
        c.get('userId'),
        c.req.valid('param').id,
        c.req.valid('json'),
      )
      return c.json(task)
    },
  )
  .delete('/:id', validate('param', idParam), async (c) => {
    await deleteTask(c.get('userId'), c.req.valid('param').id)
    return c.body(null, 204)
  })
