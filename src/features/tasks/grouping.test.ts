import { describe, expect, it } from 'vitest'
import { classify, groupToday, isInList, tasksForList } from './grouping'
import type { Task } from '../../types/task'

// "Now" for every test in this file: 3 September 2026, 09:00 local time.
// Month is 0-indexed, so 8 is September. Fixtures are built from local
// components rather than UTC strings so the boundary tests below mean the
// same thing in any timezone.
const NOW = new Date(2026, 8, 3, 9, 0)

function at(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  return new Date(year, month, day, hour, minute).toISOString()
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'local-user',
    title: 'A task',
    notes: '',
    projectId: null,
    scheduledAt: null,
    estimateMinutes: null,
    done: false,
    createdAt: at(2026, 8, 1, 0),
    updatedAt: at(2026, 8, 1, 0),
    ...overrides,
  }
}

describe('isInList', () => {
  it('keeps a completed task in Today as well as Completed', () => {
    // The lists are deliberately not mutually exclusive: checking a task
    // off should not make it disappear from the list you are looking at.
    const task = makeTask({ scheduledAt: at(2026, 8, 3, 14), done: true })
    expect(isInList(task, 'today', NOW)).toBe(true)
    expect(isInList(task, 'done', NOW)).toBe(true)
    expect(isInList(task, 'upcoming', NOW)).toBe(false)
  })

  it('puts an open undated task in Today', () => {
    const task = makeTask({ scheduledAt: null })
    expect(isInList(task, 'today', NOW)).toBe(true)
  })

  it('drops a completed undated task out of Today', () => {
    const task = makeTask({ scheduledAt: null, done: true })
    expect(isInList(task, 'today', NOW)).toBe(false)
    expect(isInList(task, 'done', NOW)).toBe(true)
  })

  it('treats 23:59 tonight as today and 00:01 tomorrow as upcoming', () => {
    const tonight = makeTask({ scheduledAt: at(2026, 8, 3, 23, 59) })
    const tomorrow = makeTask({ scheduledAt: at(2026, 8, 4, 0, 1) })

    expect(isInList(tonight, 'today', NOW)).toBe(true)
    expect(isInList(tonight, 'upcoming', NOW)).toBe(false)
    expect(isInList(tomorrow, 'today', NOW)).toBe(false)
    expect(isInList(tomorrow, 'upcoming', NOW)).toBe(true)
  })

  it('surfaces an overdue task in Today rather than losing it', () => {
    const overdue = makeTask({ scheduledAt: at(2026, 8, 1, 10) })
    expect(isInList(overdue, 'today', NOW)).toBe(true)
    expect(isInList(overdue, 'upcoming', NOW)).toBe(false)
  })

  it('shows everything in All tasks', () => {
    const done = makeTask({ done: true })
    const upcoming = makeTask({ scheduledAt: at(2026, 8, 20, 10) })
    expect(isInList(done, 'all', NOW)).toBe(true)
    expect(isInList(upcoming, 'all', NOW)).toBe(true)
  })
})

describe('classify', () => {
  it('lets done win over the schedule', () => {
    const task = makeTask({ scheduledAt: at(2026, 8, 20, 10), done: true })
    expect(classify(task, NOW)).toBe('done')
  })

  it('files an undated open task under today', () => {
    expect(classify(makeTask(), NOW)).toBe('today')
  })

  it('files a future task under upcoming', () => {
    const task = makeTask({ scheduledAt: at(2026, 8, 20, 10) })
    expect(classify(task, NOW)).toBe('upcoming')
  })
})

describe('tasksForList', () => {
  it('sorts by scheduled time and puts undated tasks last', () => {
    const tasks = [
      makeTask({ id: 'c', scheduledAt: null }),
      makeTask({ id: 'b', scheduledAt: at(2026, 8, 3, 16) }),
      makeTask({ id: 'a', scheduledAt: at(2026, 8, 3, 8) }),
    ]
    expect(tasksForList(tasks, 'today', NOW).map((task) => task.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})

describe('groupToday', () => {
  it('gives undated tasks a bucket to render in', () => {
    // Regression: undated tasks matched the Today list but had no bucket,
    // so the list counted them and then rendered nothing.
    const groups = groupToday([makeTask({ scheduledAt: null })])
    expect(groups.map((group) => group.label)).toEqual(['No time set'])
    expect(groups[0].items).toHaveLength(1)
  })

  it('splits the day at 12:00 and 17:00', () => {
    const tasks = [
      makeTask({ id: 'morning', scheduledAt: at(2026, 8, 3, 11, 59) }),
      makeTask({ id: 'afternoon', scheduledAt: at(2026, 8, 3, 12, 0) }),
      makeTask({ id: 'late-afternoon', scheduledAt: at(2026, 8, 3, 16, 59) }),
      makeTask({ id: 'evening', scheduledAt: at(2026, 8, 3, 17, 0) }),
    ]
    const groups = groupToday(tasks)
    expect(
      groups.map((group) => [group.label, group.items.map((task) => task.id)]),
    ).toEqual([
      ['Morning', ['morning']],
      ['Afternoon', ['afternoon', 'late-afternoon']],
      ['Evening', ['evening']],
    ])
  })

  it('leaves out empty buckets', () => {
    const groups = groupToday([makeTask({ scheduledAt: at(2026, 8, 3, 9) })])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Morning')
  })
})
