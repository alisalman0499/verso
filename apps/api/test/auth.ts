import { app } from '../src/app'
import { testOutbox } from '../src/email/mailer'

// Browsers send an Origin header on POSTs, and Better Auth checks it against
// its trusted origins to block cross-site request forgery. Tests send the
// same header a real browser on the web app would.
export const ORIGIN = 'http://localhost:5173'

export function postJson(path: string, body: unknown, cookie?: string) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(cookie === undefined ? {} : { Cookie: cookie }),
    },
    body: JSON.stringify(body),
  })
}

// Turns a response's Set-Cookie headers into the Cookie header a browser
// would send back: just the name=value pairs, without the attributes.
export function cookieFrom(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ')
}

// The most recent email sent to an address, with the first link in it.
export function lastLinkSentTo(email: string): URL {
  const message = testOutbox.findLast((m) => m.to === email)
  if (message === undefined) throw new Error(`No email sent to ${email}`)
  const match = message.text.match(/https?:\/\/\S+/)
  if (match === null) throw new Error(`No link in email to ${email}`)
  return new URL(match[0])
}

// Follows a link from an email the way clicking it would, but against the
// in-memory app: only the path and query matter.
export function followLink(url: URL) {
  return app.request(url.pathname + url.search, { redirect: 'manual' })
}

// Signs up, verifies the address through the emailed link, and returns the
// session cookie — a ready-to-use logged-in user.
export async function signUpVerified(
  email: string,
  password = 'correct-horse-battery',
): Promise<string> {
  const res = await postJson('/api/auth/sign-up/email', {
    email,
    password,
    name: email.split('@')[0],
  })
  if (!res.ok) throw new Error(`Sign-up failed: ${res.status}`)
  const verified = await followLink(lastLinkSentTo(email))
  const cookie = cookieFrom(verified)
  if (cookie === '') throw new Error('Verification did not sign in')
  return cookie
}

// A request to the API as a signed-in (or, without a cookie, signed-out)
// browser would make it.
export function api(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { cookie?: string; body?: unknown } = {},
) {
  return app.request(path, {
    method,
    headers: {
      Origin: ORIGIN,
      ...(options.cookie === undefined ? {} : { Cookie: options.cookie }),
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}
