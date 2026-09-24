import { describe, expect, it } from 'vitest'
import type { Task } from '../../types/task'
import { applyPatch } from './applyPatch'

const NOW = new Date(2026, 8, 3, 9, 0)
const EARLIER = new Date(2026, 8, 2, 16, 0).toISOString()

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    projectId: null,
    parentId: null,
    title: 'A task',
    notes: '',
    kind: 'task',
    dueAt: null,
    scheduledAt: null,
    estimateMinutes: null,
    completedAt: null,
    position: 0,
    source: 'user',
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...overrides,
  }
}

describe('applyPatch', () => {
  it('changes only the fields in the patch', () => {
    const task = applyPatch(makeTask({ notes: 'keep' }), { title: 'New' }, NOW)
    expect(task).toMatchObject({ title: 'New', notes: 'keep' })
  })

  it('stamps completedAt when completing an open task', () => {
    const task = applyPatch(makeTask(), { completed: true }, NOW)
    expect(task.completedAt).toBe(NOW.toISOString())
  })

  it('keeps the original completedAt when completing again', () => {
    const task = applyPatch(
      makeTask({ completedAt: EARLIER }),
      { completed: true },
      NOW,
    )
    expect(task.completedAt).toBe(EARLIER)
  })

  it('clears completedAt when reopening', () => {
    const task = applyPatch(
      makeTask({ completedAt: EARLIER }),
      { completed: false },
      NOW,
    )
    expect(task.completedAt).toBeNull()
  })

  it('never puts `completed` on the task itself', () => {
    const task = applyPatch(makeTask(), { completed: true }, NOW)
    expect(task).not.toHaveProperty('completed')
  })
})
