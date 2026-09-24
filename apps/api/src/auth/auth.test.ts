import { Hono } from 'hono'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  cookieFrom,
  followLink,
  lastLinkSentTo,
  postJson,
  signUpVerified,
} from '../../test/auth'
import { resetDatabase } from '../../test/fixtures'
import { app } from '../app'
import { pool } from '../db/client'
import { requireSession, type AuthedEnv } from './requireSession'

const PASSWORD = 'correct-horse-battery'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await pool.end()
})

function getSession(cookie: string) {
  return app.request('/api/auth/get-session', { headers: { Cookie: cookie } })
}

describe('sign-up and email verification', () => {
  it('does not sign in until the email is verified', async () => {
    const res = await postJson('/api/auth/sign-up/email', {
      email: 'ada@example.com',
      password: PASSWORD,
      name: 'Ada',
    })
    expect(res.status).toBe(200)
    expect(cookieFrom(res)).not.toContain('session_token')

    const signIn = await postJson('/api/auth/sign-in/email', {
      email: 'ada@example.com',
      password: PASSWORD,
    })
    expect(signIn.status).toBe(403)
  })

  it('signs in through the emailed verification link', async () => {
    await postJson('/api/auth/sign-up/email', {
      email: 'ada@example.com',
      password: PASSWORD,
      name: 'Ada',
    })

    const res = await followLink(lastLinkSentTo('ada@example.com'))
    const session = await getSession(cookieFrom(res))

    expect(await session.json()).toMatchObject({
      user: { email: 'ada@example.com', emailVerified: true },
    })
  })

  it('rejects a password shorter than 10 characters', async () => {
    const res = await postJson('/api/auth/sign-up/email', {
      email: 'ada@example.com',
      password: 'short',
      name: 'Ada',
    })
    expect(res.status).toBe(400)
  })
})

describe('password reset', () => {
  it('sets a new password and signs out existing sessions', async () => {
    const oldSession = await signUpVerified('ada@example.com', PASSWORD)

    await postJson('/api/auth/request-password-reset', {
      email: 'ada@example.com',
      redirectTo: '/reset-password',
    })
    // The emailed link goes through the API, which redirects to the web
    // app's reset page with the token in the query string.
    const redirect = await followLink(lastLinkSentTo('ada@example.com'))
    const location = new URL(redirect.headers.get('Location') ?? '', 'http://x')
    const token = location.searchParams.get('token')
    expect(location.pathname).toBe('/reset-password')
    expect(token).not.toBeNull()

    const reset = await postJson('/api/auth/reset-password', {
      newPassword: 'a-brand-new-password',
      token,
    })
    expect(reset.status).toBe(200)

    expect(await (await getSession(oldSession)).json()).toBeNull()
    const withOld = await postJson('/api/auth/sign-in/email', {
      email: 'ada@example.com',
      password: PASSWORD,
    })
    expect(withOld.status).toBe(401)
    const withNew = await postJson('/api/auth/sign-in/email', {
      email: 'ada@example.com',
      password: 'a-brand-new-password',
    })
    expect(withNew.status).toBe(200)
  })
})

describe('requireSession', () => {
  // A throwaway app with one protected route, to test the middleware on its
  // own. The real data routes are tested in their own files.
  const protectedApp = new Hono<AuthedEnv>()
    .use(requireSession)
    .get('/whoami', (c) => c.json({ userId: c.get('userId') }))

  it('responds 401 without a session', async () => {
    const res = await protectedApp.request('/whoami')
    expect(res.status).toBe(401)
  })

  it("passes the signed-in user's id to the handler", async () => {
    const cookie = await signUpVerified('ada@example.com')
    // Responses are untyped JSON; parse the part the test relies on instead
    // of casting it.
    const session = z
      .object({ user: z.object({ id: z.string() }) })
      .parse(await (await getSession(cookie)).json())

    const res = await protectedApp.request('/whoami', {
      headers: { Cookie: cookie },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: session.user.id })
  })

  it('responds 401 after signing out', async () => {
    const cookie = await signUpVerified('ada@example.com')
    await postJson('/api/auth/sign-out', {}, cookie)

    const res = await protectedApp.request('/whoami', {
      headers: { Cookie: cookie },
    })
    expect(res.status).toBe(401)
  })
})
