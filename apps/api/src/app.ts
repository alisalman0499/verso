import { Hono } from 'hono'
import { auth } from './auth/auth'

// The app is built here and started in index.ts. Keeping the two apart
// means tests can import `app` and call `app.request(...)` — the full
// middleware and routing stack, in memory, with no port to listen on.
export const app = new Hono()
  .basePath('/api')
  // Better Auth serves its own endpoints (sign-up, sign-in, verify-email,
  // reset-password, get-session…). Hono just hands it the raw request.
  .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
  .get('/health', (c) => c.json({ status: 'ok' }))

// The type of the whole route tree. The web app's typed client (`hc`) is
// inferred from this, so the frontend can't call a route that doesn't exist
// or send a body the route won't accept.
export type AppType = typeof app
