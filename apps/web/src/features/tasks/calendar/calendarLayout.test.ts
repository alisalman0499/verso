import { describe, expect, it } from 'vitest'
import type { Task } from '../../../types/task'
import {
  calendarFromSearchParams,
  calendarTitle,
  dayBlocks,
  deadlinesOn,
  entriesOn,
  hourRange,
  plannedMinutes,
  searchParamsForCalendar,
  shiftCalendar,
  type Block,
} from './calendarLayout'

// "Now": Thursday 24 September 2026, 09:00 local. Month is 0-indexed.
const NOW = new Date(2026, 8, 24, 9, 0)
const DAY = new Date(2026, 8, 24)

function at(month: number, day: number, hour: number, minute = 0) {
  return new Date(2026, month, day, hour, minute).toISOString()
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
    createdAt: at(8, 1, 0),
    updatedAt: at(8, 1, 0),
    ...overrides,
  }
}

// A task on DAY from one time to another, with its estimate as the length.
function slot(id: string, from: [number, number], minutes: number): Task {
  return makeTask({
    id,
    title: id,
    scheduledAt: at(8, 24, from[0], from[1]),
    estimateMinutes: minutes,
  })
}

const byEstimate = (task: Task) => task.estimateMinutes ?? 30

// Just the layout, for readable expectations: id → [column, columns].
function columnsOf(blocks: Block[]) {
  return Object.fromEntries(
    blocks.map((block) => [block.task.id, [block.column, block.columns]]),
  )
}

describe('calendarFromSearchParams', () => {
  it('defaults to this week', () => {
    expect(calendarFromSearchParams(new URLSearchParams(), NOW)).toEqual({
      mode: 'week',
      date: DAY,
    })
  })

  it('reads the mode and date', () => {
    const params = new URLSearchParams({ mode: 'month', date: '2026-11-05' })
    expect(calendarFromSearchParams(params, NOW)).toEqual({
      mode: 'month',
      date: new Date(2026, 10, 5),
    })
  })

  it('falls back on anything it does not recognise', () => {
    const params = new URLSearchParams({ mode: 'year', date: '2026-02-30' })
    expect(calendarFromSearchParams(params, NOW)).toEqual({
      mode: 'week',
      date: DAY,
    })
  })
})

describe('searchParamsForCalendar', () => {
  it('gives today the clean URL', () => {
    expect(
      searchParamsForCalendar({ mode: 'week', date: DAY }, NOW).toString(),
    ).toBe('')
  })

  it('writes the mode and any other date', () => {
    const params = searchParamsForCalendar(
      { mode: 'month', date: new Date(2026, 9, 5) },
      NOW,
    )
    expect(params.get('mode')).toBe('month')
    expect(params.get('date')).toBe('2026-10-05')
  })

  it('round-trips through the URL', () => {
    const position = { mode: 'week' as const, date: new Date(2026, 11, 31) }
    expect(
      calendarFromSearchParams(searchParamsForCalendar(position, NOW), NOW),
    ).toEqual(position)
  })
})

describe('shiftCalendar', () => {
  it('steps a week at a time in week view', () => {
    expect(shiftCalendar({ mode: 'week', date: DAY }, 1).date).toEqual(
      new Date(2026, 9, 1),
    )
    expect(shiftCalendar({ mode: 'week', date: DAY }, -1).date).toEqual(
      new Date(2026, 8, 17),
    )
  })

  it('steps a month at a time in month view', () => {
    expect(shiftCalendar({ mode: 'month', date: DAY }, 1).date).toEqual(
      new Date(2026, 9, 1),
    )
  })
})

describe('calendarTitle', () => {
  it('names a week inside one month', () => {
    expect(calendarTitle({ mode: 'week', date: DAY })).toEqual({
      year: '2026',
      title: '21–27 Sept',
    })
  })

  it('names a week across two months', () => {
    expect(
      calendarTitle({ mode: 'week', date: new Date(2026, 9, 1) }).title,
    ).toBe('28 Sept – 4 Oct')
  })

  it('gives both years for the week across New Year', () => {
    expect(
      calendarTitle({ mode: 'week', date: new Date(2026, 11, 30) }).year,
    ).toBe('2026–27')
  })

  it('names a month', () => {
    expect(calendarTitle({ mode: 'month', date: DAY })).toEqual({
      year: '2026',
      title: 'September',
    })
  })
})

describe('plannedMinutes', () => {
  it('prefers the subtasks’ total, then the own estimate, then 30m', () => {
    const task = makeTask({ estimateMinutes: 45 })
    const progress = {
      done: 0,
      total: 2,
      estimate: { total: 90, remaining: 90 },
    }
    expect(plannedMinutes(task, progress)).toBe(90)
    expect(plannedMinutes(task, { ...progress, estimate: null })).toBe(45)
    expect(plannedMinutes(makeTask(), null)).toBe(30)
  })
})

describe('dayBlocks', () => {
  it('places a task at its time, as long as its estimate', () => {
    const [block] = dayBlocks([slot('a', [14, 30], 90)], DAY, byEstimate)
    expect(block).toMatchObject({ start: 870, end: 960, column: 0, columns: 1 })
  })

  it('draws short tasks at least 30 minutes tall', () => {
    const [block] = dayBlocks([slot('a', [9, 0], 10)], DAY, byEstimate)
    expect(block.end - block.start).toBe(30)
  })

  it('cuts a task off at midnight', () => {
    const [block] = dayBlocks([slot('a', [23, 0], 180)], DAY, byEstimate)
    expect(block.end).toBe(24 * 60)
  })

  it('keeps a task at 00:00 at 00:00', () => {
    const [block] = dayBlocks([slot('a', [0, 0], 30)], DAY, byEstimate)
    expect(block.start).toBe(0)
  })

  it('only takes tasks with a Do on time on that day', () => {
    const tasks = [
      slot('today', [10, 0], 30),
      makeTask({ id: 'tomorrow', scheduledAt: at(8, 25, 10) }),
      makeTask({ id: 'undated' }),
    ]
    expect(dayBlocks(tasks, DAY, byEstimate).map((b) => b.task.id)).toEqual([
      'today',
    ])
  })

  it('gives tasks that do not overlap the full width', () => {
    const tasks = [slot('a', [9, 0], 60), slot('b', [10, 0], 60)]
    expect(columnsOf(dayBlocks(tasks, DAY, byEstimate))).toEqual({
      a: [0, 1],
      b: [0, 1],
    })
  })

  it('puts overlapping tasks side by side', () => {
    const tasks = [slot('a', [9, 0], 60), slot('b', [9, 30], 60)]
    expect(columnsOf(dayBlocks(tasks, DAY, byEstimate))).toEqual({
      a: [0, 2],
      b: [1, 2],
    })
  })

  it('reuses a column once it is free again', () => {
    // a runs all morning; b and c follow each other beside it. c can take
    // b's column, so the cluster is two wide, not three.
    const tasks = [
      slot('a', [9, 0], 180),
      slot('b', [9, 0], 60),
      slot('c', [10, 0], 60),
    ]
    expect(columnsOf(dayBlocks(tasks, DAY, byEstimate))).toEqual({
      a: [0, 2],
      b: [1, 2],
      c: [1, 2],
    })
  })

  it('gives every task in a chain of overlaps the same width', () => {
    // a overlaps b, b overlaps c, but a and c don't touch: still one
    // cluster, so all three line up in two columns.
    const tasks = [
      slot('a', [9, 0], 60),
      slot('b', [9, 30], 60),
      slot('c', [10, 0], 60),
    ]
    expect(columnsOf(dayBlocks(tasks, DAY, byEstimate))).toEqual({
      a: [0, 2],
      b: [1, 2],
      c: [0, 2],
    })
  })

  it('starts a new cluster after a gap', () => {
    const tasks = [
      slot('a', [9, 0], 60),
      slot('b', [9, 0], 60),
      slot('c', [13, 0], 60),
    ]
    expect(columnsOf(dayBlocks(tasks, DAY, byEstimate)).c).toEqual([0, 1])
  })
})

describe('hourRange', () => {
  it('shows 06–22 by default', () => {
    expect(hourRange([])).toEqual({ start: 360, end: 1320 })
  })

  it('stretches to whole hours around early and late tasks', () => {
    const blocks = dayBlocks(
      [slot('early', [5, 30], 30), slot('late', [22, 15], 60)],
      DAY,
      byEstimate,
    )
    expect(hourRange(blocks)).toEqual({ start: 300, end: 1440 })
  })
})

describe('entriesOn', () => {
  it('lists Do on times and deadlines on the day, in time order', () => {
    const essay = makeTask({
      id: 'essay',
      title: 'Essay',
      scheduledAt: at(8, 24, 14),
      dueAt: at(8, 24, 23, 59),
    })
    const call = makeTask({
      id: 'call',
      title: 'Call',
      scheduledAt: at(8, 24, 9),
    })
    const other = makeTask({ id: 'other', scheduledAt: at(8, 25, 9) })
    expect(
      entriesOn([essay, call, other], DAY).map((e) => [e.task.id, e.kind]),
    ).toEqual([
      ['call', 'do'],
      ['essay', 'do'],
      ['essay', 'due'],
    ])
  })
})

describe('deadlinesOn', () => {
  it('lists only deadlines', () => {
    const tasks = [
      makeTask({ id: 'do', scheduledAt: at(8, 24, 9) }),
      makeTask({ id: 'due', dueAt: at(8, 24, 17) }),
    ]
    expect(deadlinesOn(tasks, DAY).map((task) => task.id)).toEqual(['due'])
  })
})
