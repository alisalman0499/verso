import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatFullDateTime,
  formatWhen,
  fromDatetimeLocalValue,
  isSameDay,
  parseDuration,
  splitTrailingDuration,
  toDateKey,
  toDatetimeLocalValue,
} from './time'

// Every function here reads local-time getters, so fixtures are built with
// `new Date(year, month, day, ...)` rather than a UTC string like
// "2026-09-03T14:30:00Z". A UTC literal would make these tests pass only in
// whatever timezone they were written in. Note month is 0-indexed: 8 is
// September.

describe('formatDuration', () => {
  it('shows minutes below an hour', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('shows whole hours without minutes', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('shows hours and minutes on partial hours', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(735)).toBe('12h 15m')
  })

  it('shows zero as 0m', () => {
    expect(formatDuration(0)).toBe('0m')
  })
})

describe('parseDuration', () => {
  it.each([
    ['90', 90],
    ['90m', 90],
    ['90 min', 90],
    ['45 minutes', 45],
    ['2h', 120],
    ['2 hours', 120],
    ['1.5h', 90],
    ['1,5 h', 90],
    ['1h 30m', 90],
    ['1h30', 90],
    ['1 h 30 min', 90],
    ['  1H 30M  ', 90],
    ['0', 0],
  ])('reads %j as %i minutes', (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes)
  })

  it('rounds fractional minutes', () => {
    expect(parseDuration('0.1h')).toBe(6)
    expect(parseDuration('12.6')).toBe(13)
  })

  it.each(['', 'soon', '-30', '1h 30m 10s', 'h', '1.5h 30m', '2d'])(
    'rejects %j',
    (input) => {
      expect(parseDuration(input)).toBeNull()
    },
  )

  it('reads back everything formatDuration writes', () => {
    for (const minutes of [0, 5, 45, 60, 90, 135, 600, 10_080]) {
      expect(parseDuration(formatDuration(minutes))).toBe(minutes)
    }
  })
})

describe('datetime-local conversion', () => {
  it('formats an ISO string as the input element expects', () => {
    const iso = new Date(2026, 8, 3, 14, 30).toISOString()
    expect(toDatetimeLocalValue(iso)).toBe('2026-09-03T14:30')
  })

  it('pads single-digit months, days, and hours', () => {
    const iso = new Date(2026, 0, 5, 9, 5).toISOString()
    expect(toDatetimeLocalValue(iso)).toBe('2026-01-05T09:05')
  })

  it('round-trips back to the same minute', () => {
    const original = new Date(2026, 8, 3, 14, 30)
    const roundTripped = new Date(
      fromDatetimeLocalValue(toDatetimeLocalValue(original.toISOString())),
    )
    expect(roundTripped.getTime()).toBe(original.getTime())
  })
})

describe('formatWhen', () => {
  const now = new Date(2026, 8, 3, 9, 0)

  it('shows only the time for today', () => {
    const iso = new Date(2026, 8, 3, 14, 30).toISOString()
    expect(formatWhen(iso, now)).toBe('14:30')
  })

  it('adds the date for any other day', () => {
    // en-GB abbreviates September as "Sept", not "Sep".
    const iso = new Date(2026, 8, 5, 14, 30).toISOString()
    expect(formatWhen(iso, now)).toBe('5 Sept 14:30')
  })

  it('adds the date for a past day too', () => {
    const iso = new Date(2026, 7, 31, 8, 5).toISOString()
    expect(formatWhen(iso, now)).toBe('31 Aug 08:05')
  })
})

describe('toDateKey', () => {
  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('distinguishes the same day and month across years', () => {
    expect(toDateKey(new Date(2026, 7, 30))).not.toBe(
      toDateKey(new Date(2027, 7, 30)),
    )
  })
})

describe('isSameDay', () => {
  it('is true for two times on the same date', () => {
    expect(
      isSameDay(new Date(2026, 8, 3, 0, 1), new Date(2026, 8, 3, 23, 59)),
    ).toBe(true)
  })

  it('is false across a month boundary', () => {
    expect(isSameDay(new Date(2026, 7, 31), new Date(2026, 8, 1))).toBe(false)
  })

  it('is false for the same date in different years', () => {
    expect(isSameDay(new Date(2026, 8, 3), new Date(2027, 8, 3))).toBe(false)
  })
})

describe('splitTrailingDuration', () => {
  it.each([
    ['Write intro 45m', 'Write intro', 45],
    ['Draft body 1h', 'Draft body', 60],
    ['Draft body 1h 30m', 'Draft body', 90],
    ['Draft body 1h30', 'Draft body', 90],
    ['Revise 1,5h', 'Revise', 90],
    ['Watch lecture 2 hours', 'Watch lecture', 120],
    ['Email Anna 5 min', 'Email Anna', 5],
  ])('splits %j', (text, title, minutes) => {
    expect(splitTrailingDuration(text)).toEqual({ title, minutes })
  })

  it.each([
    'Read chapter 3',
    'Room 101',
    '45m',
    'Watch 2 hours of lecture',
    'Just a title',
  ])('leaves %j alone', (text) => {
    expect(splitTrailingDuration(text)).toEqual({ title: text, minutes: null })
  })

  it('trims surrounding whitespace', () => {
    expect(splitTrailingDuration('  Outline 20m  ')).toEqual({
      title: 'Outline',
      minutes: 20,
    })
  })
})

describe('formatFullDateTime', () => {
  const now = new Date(2026, 8, 3, 9, 0)

  it('writes weekday, day, month and time', () => {
    const iso = new Date(2026, 9, 2, 23, 59).toISOString()
    expect(formatFullDateTime(iso, now)).toBe('Fri 2 Oct, 23:59')
  })

  it('adds the year when it is not the current one', () => {
    const iso = new Date(2027, 0, 15, 9, 0).toISOString()
    expect(formatFullDateTime(iso, now)).toBe('Fri 15 Jan 2027, 09:00')
  })
})
