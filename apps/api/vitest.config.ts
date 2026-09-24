import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL } from './test/testDatabase'

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
    },
    globalSetup: './test/globalSetup.ts',
    // Test files share one database. Running them one at a time keeps one
    // file's inserts and truncates from interfering with another's.
    fileParallelism: false,
  },
})
