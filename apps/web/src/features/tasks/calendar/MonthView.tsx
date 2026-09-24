import { monthGrid } from '../../../lib/calendarDates'
import { isSameDay, toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
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

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// The month as whole weeks, with each day's Do on times and deadlines. It's
// for seeing what's coming, so a busy day shows a few entries and a count;
// the week view is one click away for the full picture.
export default function MonthView({
  date,
  tasks,
  selectedTaskId,
  onOpenTask,
  onOpenWeek,
  now,
}: MonthViewProps) {
  const weeks = monthGrid(date)

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
            const entries = entriesOn(tasks, day)
            const hidden = entries.length - VISIBLE_ENTRIES
            return (
              <div
                key={toDateKey(day)}
                className="flex min-h-28 min-w-0 flex-col gap-1 border-l border-hairline p-1.5 first:border-l-0"
              >
                <button
                  type="button"
                  onClick={() => onOpenWeek(day)}
                  aria-label={`Show the week of ${day.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
                  className={[
                    'flex h-6 w-6 items-center justify-center self-end rounded-full font-serif text-base',
                    isToday
                      ? 'bg-pure text-ink'
                      : isInMonth
                        ? 'text-bone hover:bg-ink-3'
                        : 'text-mute-2 hover:bg-ink-3',
                  ].join(' ')}
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
                    className="px-1.5 text-left font-mono text-[10px] text-mute hover:text-bone"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
