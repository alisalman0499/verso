// Generic time formatting — no knowledge of Task, reusable anywhere.

export function formatTime(iso: string): string {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// "45m", "2h", "1h 30m". Hours and minutes rather than decimal hours: "1.5h"
// makes you do arithmetic to know it means an hour and a half.
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

// The units people type, as regex fragments. `?:` makes a group
// non-capturing, so only the numbers end up in the match results.
const NUMBER = String.raw`(\d+(?:\.\d+)?)`
const MINUTE_UNIT = String.raw`(?:m|min|mins|minutes?)`
const HOUR_UNIT = String.raw`(?:h|hr|hrs|hours?)`

const MINUTES_ONLY = new RegExp(String.raw`^${NUMBER}\s*${MINUTE_UNIT}?$`)
const HOURS_ONLY = new RegExp(String.raw`^${NUMBER}\s*${HOUR_UNIT}$`)
const HOURS_AND_MINUTES = new RegExp(
  String.raw`^(\d+)\s*${HOUR_UNIT}\s*(\d+)\s*${MINUTE_UNIT}?$`,
)

// Reads a duration the way people type one and returns whole minutes, or
// null when it can't make sense of the input. Accepts:
//   "90", "90m", "90 min"      a bare number means minutes
//   "2h", "1.5h", "1,5 h"      hours, with either decimal separator
//   "1h 30m", "1h30", "1 h 30 min"
// Empty input is the caller's to handle: it usually means "clear".
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase().replace(',', '.')

  const minutes = text.match(MINUTES_ONLY)
  if (minutes !== null) return Math.round(Number(minutes[1]))

  const hours = text.match(HOURS_ONLY)
  if (hours !== null) return Math.round(Number(hours[1]) * 60)

  const both = text.match(HOURS_AND_MINUTES)
  if (both !== null) return Number(both[1]) * 60 + Number(both[2])

  return null
}

const dayMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
})

// "14:30" when it's today, "3 Sep 14:30" otherwise. A flat list that shows
// only the time can't tell today apart from next month.
export function formatWhen(iso: string, now: Date): string {
  const date = new Date(iso)
  if (isSameDay(date, now)) return formatTime(iso)
  return `${dayMonthFormatter.format(date)} ${formatTime(iso)}`
}

// Minutes since midnight, local time — used to place a task on the day rail.
export function minutesSinceMidnight(iso: string): number {
  const date = new Date(iso)
  return date.getHours() * 60 + date.getMinutes()
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Converts to/from the format <input type="datetime-local"> uses:
// "YYYY-MM-DDTHH:mm", always local time, no timezone or seconds.
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString()
}

// "YYYY-MM-DD", local time. For grouping tasks by day — never
// `toISOString().slice(0, 10)`, which is UTC and shifts the day near
// midnight in any timezone ahead of it.
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

// A duration at the very end of a line, with an explicit unit: "30m",
// "1h 30m", "1.5h", "2 hours". The unit is required so that a title ending
// in a plain number ("Read chapter 3") is never mistaken for an estimate.
const TRAILING_DURATION = new RegExp(
  String.raw`^(.*?\S)\s+(\d+(?:[.,]\d+)?\s*${HOUR_UNIT}(?:\s*\d+\s*${MINUTE_UNIT}?)?|\d+\s*${MINUTE_UNIT})$`,
  'i',
)

// Splits "Write intro 45m" into the title "Write intro" and 45 minutes, so
// a list of steps can be typed in one go. Returns the text untouched, with
// no minutes, when it doesn't end in a duration.
export function splitTrailingDuration(text: string): {
  title: string
  minutes: number | null
} {
  const trimmed = text.trim()
  const match = trimmed.match(TRAILING_DURATION)
  if (match === null) return { title: trimmed, minutes: null }
  const minutes = parseDuration(match[2])
  if (minutes === null) return { title: trimmed, minutes: null }
  return { title: match[1], minutes }
}

const weekdayDayMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

// "Fri 2 Oct, 23:59" — a date written out in full, for places with room to
// read it (the task summary). The year is added only when it isn't this
// year's, so the common case stays short without next year's deadline
// looking like this year's.
export function formatFullDateTime(iso: string, now: Date): string {
  const date = new Date(iso)
  const day = weekdayDayMonthFormatter.format(date)
  const year =
    date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`
  return `${day}${year}, ${formatTime(iso)}`
}
