import { z } from 'zod'

// Every environment variable the API reads, parsed once at startup. Anything
// missing or malformed stops the process here with a readable message,
// instead of surfacing later as `undefined` deep inside a request.
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),

  // Signs session cookies and tokens. Generate with `openssl rand -base64 32`.
  BETTER_AUTH_SECRET: z.string().min(32),
  // The origin users see in their browser. In development that is Vite, which
  // proxies /api here, so links in emails must point at Vite, not at the API.
  BETTER_AUTH_URL: z.url(),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  MAIL_FROM: z.string().min(1),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:')
    console.error(z.prettifyError(result.error))
    console.error('Copy apps/api/.env.example to apps/api/.env to get started.')
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
