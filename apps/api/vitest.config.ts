import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL } from './test/testDatabase'

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters',
      BETTER_AUTH_URL: 'http://localhost:5173',
      // Never contacted: in tests, emails go to an in-memory outbox.
      SMTP_HOST: 'localhost',
      SMTP_PORT: '1025',
      MAIL_FROM: 'Verso <no-reply@verso.test>',
    },
    globalSetup: './test/globalSetup.ts',
    // Test files share one database. Running them one at a time keeps one
    // file's inserts and truncates from interfering with another's.
    fileParallelism: false,
  },
})
