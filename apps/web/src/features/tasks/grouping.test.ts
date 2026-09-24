import { describe, expect, it } from 'vitest'
import {
  classify,
  estimateFromSubtasks,
  groupToday,
  groupUpcoming,
  isInList,
  isOverdue,
  openTaskCount,
  pathForView,
  progressByParent,
  projectIdForView,
  subtasksOf,
  tasksForList,
  tasksForView,
  topLevelTasks,
  viewFromLegacySearch,
  viewFromRouteParams,
  type View,
} from './grouping'
import type { Task } from '../../types/task'

// "Now" for every test in this file: 3 September 2026, 09:00 local time.
// Month is 0-indexed, so 8 is September. Fixtures are built from local
// components rather than UTC strings so the boundary tests below mean the
// same thing in any timezone.
const NOW = new Date(2026, 8, 3, 9, 0)

// When "done" fixtures were completed. The exact time doesn't matter to
// grouping — only whether completedAt is set.
const DONE_AT = new Date(2026, 8, 3, 8, 0).toISOString()

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
    createdAt: at(2026, 8, 1, 0),
    updatedAt: at(2026, 8, 1, 0),
    ...overrides,
  }
}

describe('isInList', () => {
  it('keeps a completed task in Today as well as Completed', () => {
    // The lists are deliberately not mutually exclusive: checking a task
    // off should not make it disappear from the list you are looking at.
    const task = makeTask({
      scheduledAt: at(2026, 8, 3, 14),
      completedAt: DONE_AT,
    })
    expect(isInList(task, 'today', NOW)).toBe(true)
    expect(isInList(task, 'done', NOW)).toBe(true)
    expect(isInList(task, 'upcoming', NOW)).toBe(false)
  })

  it('puts an open undated task in Today', () => {
    const task = makeTask({ scheduledAt: null })
    expect(isInList(task, 'today', NOW)).toBe(true)
  })

  it('drops a completed undated task out of Today', () => {
    const task = makeTask({ scheduledAt: null, completedAt: DONE_AT })
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
    const done = makeTask({ completedAt: DONE_AT })
    const upcoming = makeTask({ scheduledAt: at(2026, 8, 20, 10) })
    expect(isInList(done, 'all', NOW)).toBe(true)
    expect(isInList(upcoming, 'all', NOW)).toBe(true)
  })
})

describe('classify', () => {
  it('lets done win over the schedule', () => {
    const task = makeTask({
      scheduledAt: at(2026, 8, 20, 10),
      completedAt: DONE_AT,
    })
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

describe('tasksForView', () => {
  it('matches tasksForList for a list view', () => {
    const tasks = [
      makeTask({ id: 'a', scheduledAt: at(2026, 8, 3, 8) }),
      makeTask({ id: 'b', scheduledAt: at(2026, 8, 20, 10) }),
    ]
    expect(
      tasksForView(tasks, { type: 'list', key: 'today' }, NOW).map(
        (task) => task.id,
      ),
    ).toEqual(tasksForList(tasks, 'today', NOW).map((task) => task.id))
  })

  it('returns only that project’s tasks, sorted by date, for a project view', () => {
    const tasks = [
      makeTask({ id: 'other', projectId: 'proj-2' }),
      makeTask({ id: 'undated', projectId: 'proj-1', scheduledAt: null }),
      makeTask({
        id: 'next-week',
        projectId: 'proj-1',
        scheduledAt: at(2026, 8, 10, 9),
      }),
      makeTask({
        id: 'later-today',
        projectId: 'proj-1',
        scheduledAt: at(2026, 8, 3, 16),
      }),
      makeTask({
        id: 'earlier-today',
        projectId: 'proj-1',
        scheduledAt: at(2026, 8, 3, 8),
      }),
    ]
    expect(
      tasksForView(tasks, { type: 'project', projectId: 'proj-1' }, NOW).map(
        (task) => task.id,
      ),
    ).toEqual(['earlier-today', 'later-today', 'next-week', 'undated'])
  })

  it('keeps completed tasks in their project view', () => {
    const tasks = [
      makeTask({ id: 'done', projectId: 'proj-1', completedAt: DONE_AT }),
      makeTask({ id: 'open', projectId: 'proj-1', completedAt: null }),
    ]
    expect(
      tasksForView(tasks, { type: 'project', projectId: 'proj-1' }, NOW)
        .map((task) => task.id)
        .sort(),
    ).toEqual(['done', 'open'])
  })
})

describe('projectIdForView', () => {
  it('assigns the project when one is being viewed', () => {
    expect(projectIdForView({ type: 'project', projectId: 'proj-1' })).toBe(
      'proj-1',
    )
  })

  it('leaves a task unassigned when a fixed list is being viewed', () => {
    expect(projectIdForView({ type: 'list', key: 'today' })).toBeNull()
    expect(projectIdForView({ type: 'list', key: 'all' })).toBeNull()
  })
})

describe('openTaskCount', () => {
  it('counts only open tasks in the project', () => {
    const tasks = [
      makeTask({ id: 'open', projectId: 'proj-1', completedAt: null }),
      makeTask({ id: 'done', projectId: 'proj-1', completedAt: DONE_AT }),
      makeTask({ id: 'other-project', projectId: 'proj-2', completedAt: null }),
      makeTask({ id: 'no-project', projectId: null, completedAt: null }),
    ]
    expect(openTaskCount(tasks, 'proj-1')).toBe(1)
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

describe('groupUpcoming', () => {
  it('keeps the same day-and-month a year apart as two groups', () => {
    // Regression: grouping used to key on the formatted label
    // ("Sun 30 Aug"), which carries no year, so this pair collapsed into
    // one group.
    const tasks = [
      makeTask({ id: 'this-year', scheduledAt: at(2026, 7, 30, 10) }),
      makeTask({ id: 'next-year', scheduledAt: at(2027, 7, 30, 10) }),
    ]
    const groups = groupUpcoming(tasks)
    expect(groups).toHaveLength(2)
    expect(
      groups.flatMap((group) => group.items.map((task) => task.id)),
    ).toEqual(['this-year', 'next-year'])
  })

  it('groups same-day tasks together under one label', () => {
    const tasks = [
      makeTask({ id: 'a', scheduledAt: at(2026, 8, 20, 9) }),
      makeTask({ id: 'b', scheduledAt: at(2026, 8, 20, 16) }),
    ]
    const groups = groupUpcoming(tasks)
    expect(groups).toHaveLength(1)
    expect(groups[0].items.map((task) => task.id)).toEqual(['a', 'b'])
  })
})

describe('isOverdue', () => {
  it('is true for an open task whose deadline has passed', () => {
    const task = makeTask({ dueAt: at(2026, 8, 3, 8, 59) })
    expect(isOverdue(task, NOW)).toBe(true)
  })

  it('is false while the deadline is still ahead, even later today', () => {
    const task = makeTask({ dueAt: at(2026, 8, 3, 9, 1) })
    expect(isOverdue(task, NOW)).toBe(false)
  })

  it('is false for a task with no deadline', () => {
    expect(isOverdue(makeTask({ dueAt: null }), NOW)).toBe(false)
  })

  it('is false once the task is done, even if it was done late', () => {
    const task = makeTask({ dueAt: at(2026, 8, 1, 12), completedAt: DONE_AT })
    expect(isOverdue(task, NOW)).toBe(false)
  })
})

describe('subtasks', () => {
  const parent = makeTask({ id: 'parent' })
  const first = makeTask({
    id: 'first',
    parentId: 'parent',
    position: 0,
    estimateMinutes: 30,
    completedAt: DONE_AT,
  })
  const second = makeTask({
    id: 'second',
    parentId: 'parent',
    position: 1,
    estimateMinutes: 45,
  })
  const unestimated = makeTask({ id: 'third', parentId: 'parent', position: 2 })
  const other = makeTask({ id: 'other' })

  it('keeps only top-level tasks for the lists', () => {
    const tasks = [parent, first, second, other]
    expect(topLevelTasks(tasks).map((t) => t.id)).toEqual(['parent', 'other'])
  })

  it("returns a task's subtasks in position order", () => {
    const tasks = [second, other, unestimated, first, parent]
    expect(subtasksOf(tasks, 'parent').map((t) => t.id)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('counts done and total subtasks per parent', () => {
    const progress = progressByParent([parent, first, second, other])
    expect(progress.get('parent')).toEqual({
      done: 1,
      total: 2,
      estimate: { total: 75, remaining: 45 },
    })
    expect(progress.has('other')).toBe(false)
  })

  it('adds up subtask estimates, and what is left of them', () => {
    expect(estimateFromSubtasks([first, second, unestimated])).toEqual({
      total: 75,
      remaining: 45,
    })
  })

  it('has no estimate when no subtask has one', () => {
    expect(estimateFromSubtasks([unestimated])).toBeNull()
    expect(estimateFromSubtasks([])).toBeNull()
  })
})

describe('views in the URL', () => {
  it('puts lists under /lists and projects under /projects', () => {
    expect(pathForView({ type: 'list', key: 'upcoming' })).toBe(
      '/lists/upcoming',
    )
    expect(pathForView({ type: 'project', projectId: 'abc' })).toBe(
      '/projects/abc',
    )
  })

  it('reads a fixed list and a project from the route', () => {
    expect(viewFromRouteParams({ listKey: 'done' })).toEqual({
      type: 'list',
      key: 'done',
    })
    expect(viewFromRouteParams({ projectId: 'abc' })).toEqual({
      type: 'project',
      projectId: 'abc',
    })
  })

  it('falls back to Today for a list it does not recognise', () => {
    expect(viewFromRouteParams({ listKey: 'someday' })).toEqual({
      type: 'list',
      key: 'today',
    })
    expect(viewFromRouteParams({})).toEqual({ type: 'list', key: 'today' })
  })

  it('reads back every view it writes', () => {
    const views: View[] = [
      { type: 'list', key: 'today' },
      { type: 'list', key: 'upcoming' },
      { type: 'list', key: 'done' },
      { type: 'list', key: 'all' },
      { type: 'project', projectId: 'abc' },
    ]
    for (const view of views) {
      const [, kind, param] = pathForView(view).split('/')
      const params =
        kind === 'projects' ? { projectId: param } : { listKey: param }
      expect(viewFromRouteParams(params)).toEqual(view)
    }
  })
})

describe('old query-string links', () => {
  const read = (query: string) =>
    viewFromLegacySearch(new URLSearchParams(query))

  it('reads the views old links pointed at', () => {
    expect(read('list=upcoming')).toEqual({ type: 'list', key: 'upcoming' })
    expect(read('project=abc')).toEqual({ type: 'project', projectId: 'abc' })
  })

  it('finds nothing when the query names no view', () => {
    expect(read('')).toBeNull()
    expect(read('list=someday')).toBeNull()
    expect(read('project=')).toBeNull()
  })
})
