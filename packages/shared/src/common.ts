import { z } from 'zod'

// Timestamps cross every boundary as ISO 8601 strings, never Date objects —
// JSON has no date type, so a Date would silently arrive as a string anyway.
// `offset: true` also accepts "+02:00"-style offsets, not just a trailing "Z".
export const isoDateTime = z.iso.datetime({ offset: true })

// Better Auth generates its own string ids for users; our own tables use
// UUIDs. Keeping the two apart in the schema documents that difference.
export const userId = z.string().min(1)
export const entityId = z.uuid()
