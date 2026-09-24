// Calendar date arithmetic — weeks, months, grids. Generic: no knowledge of
// tasks. Everything works in local time and returns new Date objects; the
// argument is never mutated.
//
// Why not just add 24 hours to step a day: on the two days a year the
// clocks change, a day is 23 or 25 hours long, and "midnight + 24h" lands
// at 23:00 or 01:00. setDate() steps by calendar days and lets the Date
// object sort out the hours.

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const result = startOfDay(date)
  result.setDate(result.getDate() + days)
  return result
}

// Weeks start on Monday. getDay() counts from Sunday (0), so shift it to
// count from Monday: Monday 0 … Sunday 6.
export function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return addDays(date, -daysSinceMonday)
}

export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Always lands on the 1st. Stepping "31 Jan + 1 month" by setting the month
// would give 3 March (there's no 31 Feb); from the 1st that can't happen.
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

// The weeks a month view shows: whole Monday–Sunday weeks, from the one
// holding the 1st to the one holding the last day. That's 4 to 6 weeks,
// with days from the neighbouring months filling the edges.
export function monthGrid(date: Date): Date[][] {
  const first = startOfMonth(date)
  const last = addDays(addMonths(date, 1), -1)
  const weeks: Date[][] = []
  for (
    let monday = startOfWeek(first);
    monday <= last;
    monday = addDays(monday, 7)
  ) {
    weeks.push(weekDays(monday))
  }
  return weeks
}

// The reverse of toDateKey (lib/time): "2026-09-21" → local midnight that
// day, or null for anything that isn't a real date ("2026-02-30", "soon").
export function fromDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (match === null) return null
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ]
  const date = new Date(year, month, day)
  // new Date() quietly rolls overflow into the next month (30 Feb → 2 Mar);
  // if any part changed, the key wasn't a real date.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

// Local midnight of `day` plus a number of minutes, as a Date.
export function atMinutes(day: Date, minutes: number): Date {
  const result = startOfDay(day)
  result.setMinutes(minutes)
  return result
}

// The time of day at a point down a time column. `fraction` is how far down
// (0 = top, 1 = bottom) the column spans `start`–`end` minutes. Rounded to
// the nearest quarter hour, since nobody means 14:07 when they click, and
// kept inside the column so the last slot still starts before it ends.
export function minutesAtFraction(
  fraction: number,
  start: number,
  end: number,
): number {
  const raw = start + fraction * (end - start)
  const snapped = Math.round(raw / 15) * 15
  return Math.min(Math.max(snapped, start), end - 15)
}
