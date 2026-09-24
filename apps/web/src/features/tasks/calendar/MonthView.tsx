import { useState } from 'react'
import { monthGrid } from '../../../lib/calendarDates'
import { isSameDay, toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
import { isDone } from '../grouping'
import AgendaEntry from './AgendaEntry'
import { entriesOn } from './calendarLayout'
import MonthEntry from './MonthEntry'

type MonthViewProps = {
  // Any date in the month to show.
  date: Date
  tasks: Task[]
  selectedTaskId: string | null
  onOpenTask: (id: string) => void
  // Show the week holding this day.
  onOpenWeek: (day: Date) => void
  now: Date
}

// How many entries fit in a day before it says "+2 more".
const VISIBLE_ENTRIES = 3
// How many dots a day gets on a phone; more would just be a smudge.
const VISIBLE_DOTS = 3

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const longDayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

// The month as whole weeks, with each day's Do on times and deadlines. It's
// for seeing what's coming, so a busy day shows a few entries and a count;
// the week view is one click away for the full picture.
//
// A phone has no room for titles in a day, so there each day shows dots,
// and tapping it lists that day's tasks under the grid. The two layouts
// share the grid; `sm:` classes switch between their contents.
export default function MonthView({
  date,
  tasks,
  selectedTaskId,
  onOpenTask,
  onOpenWeek,
  now,
}: MonthViewProps) {
  const weeks = monthGrid(date)
  // The day tapped on a phone. Until one is, today — if it's in this month.
  const [pickedDay, setPickedDay] = useState<Date | null>(null)
  const isThisMonth =
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear()
  const listedDay = pickedDay ?? (isThisMonth ? now : null)
  const listedEntries = listedDay === null ? [] : entriesOn(tasks, listedDay)

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-6 pb-20 lg:px-11">
      <div className="grid grid-cols-7 border-b border-hairline pb-2">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="text-center font-mono text-[10px] tracking-[0.16em] text-mute uppercase"
          >
            {weekday}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div
          key={toDateKey(week[0])}
          className="grid grid-cols-7 border-b border-hairline"
        >
          {week.map((day) => {
            const isToday = isSameDay(day, now)
            const isInMonth = day.getMonth() === date.getMonth()
            const isListed = listedDay !== null && isSameDay(day, listedDay)
            const entries = entriesOn(tasks, day)
            const hidden = entries.length - VISIBLE_ENTRIES
            const numberClass = [
              'flex h-6 w-6 items-center justify-center rounded-full font-serif text-base',
              isToday
                ? 'bg-pure text-ink'
                : isInMonth
                  ? 'text-bone'
                  : 'text-mute-2',
            ].join(' ')
            return (
              <div
                key={toDateKey(day)}
                className="flex min-h-14 min-w-0 flex-col gap-1 border-l border-hairline first:border-l-0 sm:min-h-28 sm:p-1.5"
              >
                {/* Phone: the whole day is one button that lists its tasks. */}
                <button
                  type="button"
                  onClick={() => setPickedDay(day)}
                  aria-pressed={isListed}
                  aria-label={`${longDayFormatter.format(day)}, ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                  className={
                    isListed
                      ? 'flex flex-1 flex-col items-center gap-1 bg-ink-3 pt-1.5 sm:hidden'
                      : 'flex flex-1 flex-col items-center gap-1 pt-1.5 sm:hidden'
                  }
                >
                  <span className={numberClass}>{day.getDate()}</span>
                  <span className="flex gap-0.5">
                    {entries.slice(0, VISIBLE_DOTS).map((entry) => (
                      <i
                        key={`${entry.kind}-${entry.task.id}`}
                        className={
                          isDone(entry.task)
                            ? 'h-1 w-1 rounded-full bg-mute-2'
                            : 'h-1 w-1 rounded-full bg-bone'
                        }
                      />
                    ))}
                  </span>
                </button>

                {/* Wider screens: the day number opens its week, and the
                    entries are listed in the day itself. */}
                <button
                  type="button"
                  onClick={() => onOpenWeek(day)}
                  aria-label={`Show the week of ${longDayFormatter.format(day)}`}
                  className={`${numberClass} hidden self-end hover:ring-1 hover:ring-pure/36 sm:flex`}
                >
                  {day.getDate()}
                </button>
                {entries.slice(0, VISIBLE_ENTRIES).map((entry) => (
                  <MonthEntry
                    key={`${entry.kind}-${entry.task.id}`}
                    entry={entry}
                    isSelected={entry.task.id === selectedTaskId}
                    onOpen={onOpenTask}
                  />
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenWeek(day)}
                    className="hidden px-1.5 text-left font-mono text-[10px] text-mute hover:text-bone sm:block"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {listedDay !== null && (
        <section className="mt-6 sm:hidden">
          <div className="flex items-center gap-3 pb-1.5">
            <h3 className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
              {longDayFormatter.format(listedDay)}
            </h3>
            <i className="h-px flex-1 bg-hairline" />
          </div>
          {listedEntries.length === 0 ? (
            <p className="px-2 py-2 text-sm text-mute-2">Nothing planned.</p>
          ) : (
            listedEntries.map((entry) => (
              <AgendaEntry
                key={`${entry.kind}-${entry.task.id}`}
                entry={entry}
                onOpen={onOpenTask}
              />
            ))
          )}
        </section>
      )}
    </div>
  )
}
