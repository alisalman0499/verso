import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './client'

// Applies every migration in ./drizzle that hasn't run yet against
// DATABASE_URL. Drizzle records applied migrations in its own table, so
// running this twice is safe. The same call is used by the test setup and,
// later, on deploy.
await migrate(db, {
  migrationsFolder: new URL('../../drizzle', import.meta.url).pathname,
})
await pool.end()
console.log('Migrations applied.')
