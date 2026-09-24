import { createMiddleware } from 'hono/factory'
import { auth } from './auth'

// The Hono "environment" for routes behind requireSession: it declares that
// `c.get('userId')` exists and is a string, so handlers get it typed rather
// than reaching for the session themselves.
export type AuthedEnv = {
  Variables: {
    userId: string
  }
}

// Looks up the session from the request's cookie. No valid session means 401
// and the handler never runs. Every data route sits behind this, and every
// service call takes the userId it sets — that pairing is what scopes all
// data to its owner.
export const requireSession = createMiddleware<AuthedEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (session === null) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('userId', session.user.id)
  await next()
})
