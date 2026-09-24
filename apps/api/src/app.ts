import { Hono } from 'hono'

// The app is built here and started in index.ts. Keeping the two apart
// means tests can import `app` and call `app.request(...)` — the full
// middleware and routing stack, in memory, with no port to listen on.
export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ status: 'ok' }))

// The type of the whole route tree. The web app's typed client (`hc`) is
// inferred from this, so the frontend can't call a route that doesn't exist
// or send a body the route won't accept.
export type AppType = typeof app
