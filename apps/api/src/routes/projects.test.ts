import { projectSchema } from '@verso/shared'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { api, signUpVerified } from '../../test/auth'
import { resetDatabase } from '../../test/fixtures'
import { pool } from '../db/client'

let alice: string
let bob: string

beforeEach(async () => {
  await resetDatabase()
  alice = await signUpVerified('alice@example.com')
  bob = await signUpVerified('bob@example.com')
})

afterAll(async () => {
  await pool.end()
})

async function createProject(cookie: string, name: string) {
  const res = await api('POST', '/api/projects', { cookie, body: { name } })
  expect(res.status).toBe(201)
  return projectSchema.parse(await res.json())
}

describe('projects', () => {
  it('responds 401 without a session', async () => {
    expect((await api('GET', '/api/projects')).status).toBe(401)
  })

  it('creates a general project by default', async () => {
    const project = await createProject(alice, 'Thesis')
    expect(project).toMatchObject({ name: 'Thesis', kind: 'general' })
  })

  it("lists only the caller's projects, oldest first", async () => {
    await createProject(alice, 'First')
    await createProject(bob, 'Not yours')
    await createProject(alice, 'Second')

    const res = await api('GET', '/api/projects', { cookie: alice })
    const projects = z.array(projectSchema).parse(await res.json())

    expect(projects.map((p) => p.name)).toEqual(['First', 'Second'])
  })

  it('renames a project', async () => {
    const project = await createProject(alice, 'Thesis')
    const res = await api('PATCH', `/api/projects/${project.id}`, {
      cookie: alice,
      body: { name: 'Master thesis' },
    })
    expect(projectSchema.parse(await res.json()).name).toBe('Master thesis')
  })

  it("responds 404 when renaming another user's project", async () => {
    const project = await createProject(alice, 'Thesis')
    const res = await api('PATCH', `/api/projects/${project.id}`, {
      cookie: bob,
      body: { name: 'Mine now' },
    })
    expect(res.status).toBe(404)
  })
})
