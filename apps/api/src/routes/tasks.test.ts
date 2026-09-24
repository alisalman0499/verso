import { taskSchema } from '@verso/shared'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { api, signUpVerified } from '../../test/auth'
import { resetDatabase } from '../../test/fixtures'
import { pool } from '../db/client'

// Every task response is parsed with the shared schema: if the API ever
// drifted from the contract the web app relies on, these tests would fail.
async function readTask(res: Response) {
  return taskSchema.parse(await res.json())
}

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

async function createTask(cookie: string, body: object) {
  const res = await api('POST', '/api/tasks', { cookie, body })
  expect(res.status).toBe(201)
  return readTask(res)
}

async function createProject(cookie: string, name: string) {
  const res = await api('POST', '/api/projects', { cookie, body: { name } })
  return z.object({ id: z.string() }).parse(await res.json())
}

describe('without a session', () => {
  it.each([
    ['GET', '/api/tasks'],
    ['POST', '/api/tasks'],
    ['PATCH', '/api/tasks/00000000-0000-4000-8000-000000000000'],
    ['DELETE', '/api/tasks/00000000-0000-4000-8000-000000000000'],
  ] as const)('%s %s responds 401', async (method, path) => {
    // GET requests can't carry a body; the others get a valid one, so the
    // 401 can only come from the missing session.
    const body = method === 'GET' ? undefined : { title: 'x' }
    const res = await api(method, path, { body })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/tasks', () => {
  it('creates a task with defaults filled in', async () => {
    const task = await createTask(alice, { title: 'Read chapter 3' })
    expect(task).toMatchObject({
      title: 'Read chapter 3',
      notes: '',
      kind: 'task',
      source: 'user',
      projectId: null,
      parentId: null,
      dueAt: null,
      completedAt: null,
    })
  })

  it('stores timestamps as instants, returned in UTC', async () => {
    const task = await createTask(alice, {
      title: 'Essay',
      dueAt: '2026-09-30T23:59:00+02:00',
    })
    expect(task.dueAt).toBe('2026-09-30T21:59:00.000Z')
  })

  it('puts new tasks after their siblings', async () => {
    const first = await createTask(alice, { title: 'One' })
    const second = await createTask(alice, { title: 'Two' })
    expect(second.position).toBe(first.position + 1)
  })

  it('responds 400 for an invalid body', async () => {
    for (const body of [{}, { title: '' }, { title: 'x', done: true }]) {
      const res = await api('POST', '/api/tasks', { cookie: alice, body })
      expect(res.status).toBe(400)
    }
  })

  it("rejects another user's project", async () => {
    const project = await createProject(bob, 'Bob things')
    const res = await api('POST', '/api/tasks', {
      cookie: alice,
      body: { title: 'Sneaky', projectId: project.id },
    })
    expect(res.status).toBe(400)
  })

  it('accepts a subtask of your own task', async () => {
    const parent = await createTask(alice, { title: 'Essay' })
    const child = await createTask(alice, {
      title: 'Outline',
      parentId: parent.id,
    })
    expect(child.parentId).toBe(parent.id)
  })

  it("rejects a subtask of another user's task", async () => {
    const parent = await createTask(bob, { title: 'Bob essay' })
    const res = await api('POST', '/api/tasks', {
      cookie: alice,
      body: { title: 'Sneaky', parentId: parent.id },
    })
    expect(res.status).toBe(400)
  })

  it('rejects a subtask of a subtask', async () => {
    const parent = await createTask(alice, { title: 'Essay' })
    const child = await createTask(alice, {
      title: 'Outline',
      parentId: parent.id,
    })
    const res = await api('POST', '/api/tasks', {
      cookie: alice,
      body: { title: 'Too deep', parentId: child.id },
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/tasks', () => {
  it("returns only the caller's tasks", async () => {
    await createTask(alice, { title: 'Alice task' })
    await createTask(bob, { title: 'Bob task' })

    const res = await api('GET', '/api/tasks', { cookie: alice })
    const tasks = z.array(taskSchema).parse(await res.json())

    expect(tasks.map((t) => t.title)).toEqual(['Alice task'])
  })
})

describe('PATCH /api/tasks/:id', () => {
  it('updates only the fields sent', async () => {
    const task = await createTask(alice, { title: 'Essay', notes: 'Draft' })
    const res = await api('PATCH', `/api/tasks/${task.id}`, {
      cookie: alice,
      body: { title: 'Final essay' },
    })
    expect(await readTask(res)).toMatchObject({
      title: 'Final essay',
      notes: 'Draft',
    })
  })

  it('stamps completedAt, keeps it on repeat, and clears it', async () => {
    const task = await createTask(alice, { title: 'Essay' })
    const path = `/api/tasks/${task.id}`

    const done = await readTask(
      await api('PATCH', path, { cookie: alice, body: { completed: true } }),
    )
    expect(done.completedAt).not.toBeNull()

    const again = await readTask(
      await api('PATCH', path, { cookie: alice, body: { completed: true } }),
    )
    expect(again.completedAt).toBe(done.completedAt)

    const reopened = await readTask(
      await api('PATCH', path, { cookie: alice, body: { completed: false } }),
    )
    expect(reopened.completedAt).toBeNull()
  })

  it("responds 404 for another user's task, and leaves it alone", async () => {
    const task = await createTask(alice, { title: 'Essay' })
    const res = await api('PATCH', `/api/tasks/${task.id}`, {
      cookie: bob,
      body: { title: 'Hijacked' },
    })
    expect(res.status).toBe(404)

    const list = await api('GET', '/api/tasks', { cookie: alice })
    expect(await list.json()).toMatchObject([{ title: 'Essay' }])
  })

  it('responds 400 for an empty patch or a malformed id', async () => {
    const task = await createTask(alice, { title: 'Essay' })
    const empty = await api('PATCH', `/api/tasks/${task.id}`, {
      cookie: alice,
      body: {},
    })
    expect(empty.status).toBe(400)

    const badId = await api('PATCH', '/api/tasks/not-a-uuid', {
      cookie: alice,
      body: { title: 'x' },
    })
    expect(badId.status).toBe(400)
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task', async () => {
    const task = await createTask(alice, { title: 'Essay' })
    const res = await api('DELETE', `/api/tasks/${task.id}`, { cookie: alice })
    expect(res.status).toBe(204)

    const again = await api('DELETE', `/api/tasks/${task.id}`, {
      cookie: alice,
    })
    expect(again.status).toBe(404)
  })

  it("responds 404 for another user's task", async () => {
    const task = await createTask(alice, { title: 'Essay' })
    const res = await api('DELETE', `/api/tasks/${task.id}`, { cookie: bob })
    expect(res.status).toBe(404)
  })
})
