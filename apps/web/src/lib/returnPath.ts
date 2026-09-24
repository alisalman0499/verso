import { z } from 'zod'

// A path inside this app: starts with exactly one "/". Anything else is
// refused — in particular "//evil.example", which browsers treat as a link
// to another site. Without this check, a crafted link could make the Back
// button send someone off Verso (an "open redirect").
const internalPath = z.string().regex(/^\/(?!\/)/)

// Where a page's Back link should go. Links into a page pass the URL they
// came from as router state ({ from: '/?list=upcoming' }); that state is
// untyped, so it is parsed rather than trusted.
export function returnPathFrom(state: unknown, fallback = '/'): string {
  const parsed = z.object({ from: internalPath }).safeParse(state)
  return parsed.success ? parsed.data.from : fallback
}
