import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

// zValidator with one consistent 400 body for every route:
// { error, issues }, where issues is Zod's list of what failed and where.
export function validate<
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Invalid request', issues: result.error.issues },
        400,
      )
    }
  })
}
