import { Hono } from 'hono'
import { auth } from './auth/auth'
import { InvalidInputError, NotFoundError } from './errors'
import { projectsRoutes } from './routes/projects'
import { tasksRoutes } from './routes/tasks'

// The app is built here and started in index.ts. Keeping the two apart
// means tests can import `app` and call `app.request(...)` — the full
// middleware and routing stack, in memory, with no port to listen on.
export const app = new Hono()
  .basePath('/api')
  // Better Auth serves its own endpoints (sign-up, sign-in, verify-email,
  // reset-password, get-session…). Hono just hands it the raw request.
  .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
  .get('/health', (c) => c.json({ status: 'ok' }))
  .route('/tasks', tasksRoutes)
  .route('/projects', projectsRoutes)

// The one place service-layer errors become HTTP responses. Anything else is
// a bug: log it, and don't leak its details to the client.
app.onError((err, c) => {
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404)
  if (err instanceof InvalidInputError) {
    return c.json({ error: err.message }, 400)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

// The type of the whole route tree. The web app's typed client (`hc`) is
// inferred from this, so the frontend can't call a route that doesn't exist
// or send a body the route won't accept.
export type AppType = typeof app
