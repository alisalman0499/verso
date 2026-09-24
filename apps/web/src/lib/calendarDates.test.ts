import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  atMinutes,
  fromDateKey,
  minutesAtFraction,
  monthGrid,
  startOfWeek,
  weekDays,
} from './calendarDates'
import { toDateKey } from './time'

// Local-time fixtures, as in time.test.ts. Month is 0-indexed: 8 is
// September. 21 Sep 2026 is a Monday.

const keys = (dates: Date[]) => dates.map(toDateKey)

describe('startOfWeek', () => {
  it('goes back to Monday midnight', () => {
    expect(startOfWeek(new Date(2026, 8, 24, 15, 30))).toEqual(
      new Date(2026, 8, 21),
    )
  })

  it('keeps a Monday where it is', () => {
    expect(startOfWeek(new Date(2026, 8, 21, 9))).toEqual(new Date(2026, 8, 21))
  })

  it('counts Sunday as the end of the week, not the start', () => {
    expect(startOfWeek(new Date(2026, 8, 27, 22))).toEqual(
      new Date(2026, 8, 21),
    )
  })

  it('crosses a month boundary', () => {
    expect(startOfWeek(new Date(2026, 9, 1))).toEqual(new Date(2026, 8, 28))
  })
})

describe('weekDays', () => {
  it('lists Monday to Sunday', () => {
    expect(keys(weekDays(new Date(2026, 8, 24)))).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })
})

describe('addDays', () => {
  it('steps whole calendar days across a clock change', () => {
    // 25 Oct 2026 is when Europe goes back an hour: that day is 25 hours
    // long. Stepping by calendar days still lands on midnight.
    expect(addDays(new Date(2026, 9, 24), 2)).toEqual(new Date(2026, 9, 26))
  })

  it('steps backwards', () => {
    expect(addDays(new Date(2026, 0, 2), -3)).toEqual(new Date(2025, 11, 30))
  })
})

describe('addMonths', () => {
  it('lands on the 1st, even from the 31st', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1))
  })

  it('crosses a year both ways', () => {
    expect(addMonths(new Date(2026, 11, 5), 1)).toEqual(new Date(2027, 0, 1))
    expect(addMonths(new Date(2026, 0, 5), -1)).toEqual(new Date(2025, 11, 1))
  })
})

describe('monthGrid', () => {
  it('covers the month in whole Monday–Sunday weeks', () => {
    const grid = monthGrid(new Date(2026, 8, 15))
    // September 2026 runs Tue 1 – Wed 30.
    expect(grid).toHaveLength(5)
    expect(toDateKey(grid[0][0])).toBe('2026-08-31')
    expect(toDateKey(grid[4][6])).toBe('2026-10-04')
    for (const week of grid) expect(week).toHaveLength(7)
  })

  it('uses six weeks when the month needs them', () => {
    // August 2026 starts on a Saturday and ends on a Monday.
    const grid = monthGrid(new Date(2026, 7, 1))
    expect(grid).toHaveLength(6)
    expect(toDateKey(grid[0][0])).toBe('2026-07-27')
    expect(toDateKey(grid[5][0])).toBe('2026-08-31')
  })

  it('uses four weeks for a February that fits exactly', () => {
    // February 2027 starts on a Monday and has 28 days.
    const grid = monthGrid(new Date(2027, 1, 10))
    expect(grid).toHaveLength(4)
    expect(toDateKey(grid[3][6])).toBe('2027-02-28')
  })
})

describe('fromDateKey', () => {
  it('reads a date key as local midnight', () => {
    expect(fromDateKey('2026-09-21')).toEqual(new Date(2026, 8, 21))
  })

  it('round-trips with toDateKey', () => {
    expect(toDateKey(fromDateKey('2026-12-31') ?? new Date(0))).toBe(
      '2026-12-31',
    )
  })

  it('rejects dates that do not exist', () => {
    expect(fromDateKey('2026-02-30')).toBeNull()
    expect(fromDateKey('2026-13-01')).toBeNull()
  })

  it('rejects anything that is not a date key', () => {
    expect(fromDateKey('')).toBeNull()
    expect(fromDateKey('soon')).toBeNull()
    expect(fromDateKey('2026-9-21')).toBeNull()
  })
})

describe('atMinutes', () => {
  it('builds a time on a given day', () => {
    expect(atMinutes(new Date(2026, 8, 21, 18), 14 * 60 + 30)).toEqual(
      new Date(2026, 8, 21, 14, 30),
    )
  })
})

describe('minutesAtFraction', () => {
  const start = 6 * 60
  const end = 22 * 60

  it('maps a point in the column to a time', () => {
    // Halfway down 06:00–22:00 is 14:00.
    expect(minutesAtFraction(0.5, start, end)).toBe(14 * 60)
  })

  it('rounds to the nearest quarter hour', () => {
    // 0.51 of the way down is 14:09.6, nearer 14:15 than 14:00; 0.505 is
    // 14:04.8, nearer 14:00.
    expect(minutesAtFraction(0.51, start, end)).toBe(14 * 60 + 15)
    expect(minutesAtFraction(0.505, start, end)).toBe(14 * 60)
  })

  it('stays inside the column', () => {
    expect(minutesAtFraction(0, start, end)).toBe(start)
    expect(minutesAtFraction(-0.1, start, end)).toBe(start)
    expect(minutesAtFraction(1, start, end)).toBe(end - 15)
  })
})
