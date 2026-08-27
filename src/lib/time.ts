// Generic time formatting — no knowledge of Task, reusable anywhere.

export function formatTime(iso: string): string {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
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
