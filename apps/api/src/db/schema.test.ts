import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db, pool } from './client'
import { projects, tasks } from './schema'

// These test the database's own rules, not application code: the
// constraints hold even if a service forgets a check.

beforeEach(async () => {
  await pool.query('TRUNCATE tasks, projects CASCADE')
})

// Postgres' error code for a foreign key violation. Asserting the code, not
// just "it threw", means a typo in the query can't make these tests pass.
// Drizzle wraps the driver's error, so the code is on `cause`.
const FOREIGN_KEY_VIOLATION = { cause: { code: '23503' } }

afterAll(async () => {
  await pool.end()
})

async function createProject(userId: string) {
  const [project] = await db
    .insert(projects)
    .values({ userId, name: 'Thesis' })
    .returning()
  return project
}

describe('tasks table', () => {
  it('fills in defaults for a minimal task', async () => {
    const [task] = await db
      .insert(tasks)
      .values({ userId: 'alice', title: 'Read chapter 3' })
      .returning()
    expect(task).toMatchObject({
      notes: '',
      kind: 'task',
      source: 'user',
      position: 0,
      completedAt: null,
    })
    expect(task.createdAt).toBeInstanceOf(Date)
  })

  it("accepts a project owned by the task's user", async () => {
    const project = await createProject('alice')
    await expect(
      db
        .insert(tasks)
        .values({ userId: 'alice', title: 'Outline', projectId: project.id }),
    ).resolves.toBeDefined()
  })

  it('refuses a project owned by another user', async () => {
    const project = await createProject('alice')
    await expect(
      db
        .insert(tasks)
        .values({ userId: 'bob', title: 'Outline', projectId: project.id }),
    ).rejects.toMatchObject(FOREIGN_KEY_VIOLATION)
  })

  it('refuses a parent task owned by another user', async () => {
    const [parent] = await db
      .insert(tasks)
      .values({ userId: 'alice', title: 'Essay' })
      .returning()
    await expect(
      db
        .insert(tasks)
        .values({ userId: 'bob', title: 'Intro', parentId: parent.id }),
    ).rejects.toMatchObject(FOREIGN_KEY_VIOLATION)
  })

  it('deletes subtasks along with their parent', async () => {
    const [parent] = await db
      .insert(tasks)
      .values({ userId: 'alice', title: 'Essay' })
      .returning()
    await db
      .insert(tasks)
      .values({ userId: 'alice', title: 'Intro', parentId: parent.id })

    await db.delete(tasks).where(eq(tasks.id, parent.id))

    expect(await db.select().from(tasks)).toHaveLength(0)
  })

  it('refuses to delete a project that still has tasks', async () => {
    const project = await createProject('alice')
    await db
      .insert(tasks)
      .values({ userId: 'alice', title: 'Outline', projectId: project.id })

    await expect(
      db.delete(projects).where(eq(projects.id, project.id)),
    ).rejects.toMatchObject(FOREIGN_KEY_VIOLATION)
  })
})
