import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { TEST_DATABASE_URL } from './testDatabase'

// Runs once before the whole test run. The test database is disposable, so
// it is rebuilt from nothing every time: drop everything, then apply every
// migration in order. Besides giving each run a clean slate, this proves on
// every run that the migrations apply to an empty database — which is what
// a fresh deploy does.
export default async function setup() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL })
  try {
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
    await pool.query('DROP SCHEMA public CASCADE')
    await pool.query('CREATE SCHEMA public')
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: new URL('../drizzle', import.meta.url).pathname,
    })
  } finally {
    await pool.end()
  }
}
