import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatWhen,
  fromDatetimeLocalValue,
  isSameDay,
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

  it('drops the decimal on whole hours', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('keeps one decimal on partial hours', () => {
    expect(formatDuration(90)).toBe('1.5h')
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
