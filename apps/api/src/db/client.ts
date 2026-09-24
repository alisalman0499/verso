import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../env'
import * as schema from './schema'

// One connection pool for the whole process. A Pool keeps a handful of
// connections open and lends them out per query, rather than paying for a
// new TCP connection and login on every request.
export const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle({ client: pool, schema })

export type Db = typeof db
