import { defineConfig } from 'drizzle-kit'

// Used by `drizzle-kit generate`, which diffs src/db/schema.ts against the
// previous migrations and writes a new SQL file to ./drizzle. It never
// connects to a database; applying migrations is src/db/migrate.ts's job.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
})
