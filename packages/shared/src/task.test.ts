import { describe, expect, it } from 'vitest'
import { createTaskInput, updateTaskInput } from './task'

describe('createTaskInput', () => {
  it('accepts a title on its own', () => {
    expect(createTaskInput.safeParse({ title: 'Read chapter 3' }).success).toBe(
      true,
    )
  })

  it('trims the title, and rejects one that is only whitespace', () => {
    expect(createTaskInput.parse({ title: '  Essay  ' }).title).toBe('Essay')
    expect(createTaskInput.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('rejects keys the API does not know about', () => {
    const result = createTaskInput.safeParse({ title: 'Essay', done: true })
    expect(result.success).toBe(false)
  })

  it('does not let the client choose the source', () => {
    const result = createTaskInput.safeParse({
      title: 'Essay',
      source: 'ai_breakdown',
    })
    expect(result.success).toBe(false)
  })

  it('accepts timestamps with a Z or with an explicit offset', () => {
    for (const dueAt of ['2026-09-30T21:59:00Z', '2026-09-30T23:59:00+02:00']) {
      expect(createTaskInput.safeParse({ title: 'Essay', dueAt }).success).toBe(
        true,
      )
    }
  })

  it('rejects a date without a time', () => {
    const result = createTaskInput.safeParse({
      title: 'Essay',
      dueAt: '2026-09-30',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateTaskInput', () => {
  it('accepts a single changed field', () => {
    expect(updateTaskInput.safeParse({ completed: true }).success).toBe(true)
  })

  it('rejects an empty patch', () => {
    expect(updateTaskInput.safeParse({}).success).toBe(false)
  })

  it('takes completion as a boolean, not a timestamp', () => {
    const result = updateTaskInput.safeParse({
      completedAt: '2026-09-30T12:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('allows clearing nullable fields', () => {
    const result = updateTaskInput.safeParse({ dueAt: null, projectId: null })
    expect(result.success).toBe(true)
  })
})
