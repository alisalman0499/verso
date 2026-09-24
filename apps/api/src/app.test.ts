import { describe, expect, it } from 'vitest'
import { app } from './app'

describe('GET /api/health', () => {
  it('responds ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('404s outside the /api base path', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(404)
  })
})
