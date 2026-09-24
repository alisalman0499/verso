import { createAuthClient } from 'better-auth/client'

// Better Auth's framework-agnostic client — no React in it, so it can live
// in lib/ and any feature can call it. With no baseURL it talks to
// /api/auth on the page's own origin, which Vite proxies to the API.
export const authClient = createAuthClient()

// The TanStack Query cache key for "who is signed in". RequireAuth reads it;
// signing in or out invalidates it. One key, so every reader agrees.
export const SESSION_QUERY_KEY = ['session']

// null when signed out. Throws only when the API can't be reached, so a
// server outage isn't mistaken for being signed out.
export async function fetchSession() {
  const { data, error } = await authClient.getSession()
  if (error !== null) throw new Error(error.message ?? 'Could not load session')
  return data
}
