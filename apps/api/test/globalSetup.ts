import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { TEST_DATABASE_URL } from './testDatabase'

// Runs once before the whole test run: bring the test database's schema up
// to date with the same migrations production uses, then empty it.
export default async function setup() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL })
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: new URL('../drizzle', import.meta.url).pathname,
    })
    await pool.query('TRUNCATE tasks, projects RESTART IDENTITY CASCADE')
  } finally {
    await pool.end()
  }
}
