import { db } from '../src/db/client'
import { user } from '../src/db/schema'

// Inserts a user row directly, for tests of the database's own rules. Tests
// of the HTTP API sign up through Better Auth instead (see test/auth.ts).
export async function insertUser(id: string) {
  await db
    .insert(user)
    .values({ id, name: id, email: `${id}@example.com`, emailVerified: true })
}

// Empties every table. CASCADE follows the foreign keys from "user" to
// everything that references it.
export async function resetDatabase() {
  await db.execute('TRUNCATE "user", rate_limit, verification CASCADE')
}
