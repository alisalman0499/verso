import { weekDays } from '../../../lib/calendarDates'
import { isSameDay, toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
import AgendaEntry from './AgendaEntry'
import { entriesOn } from './calendarLayout'

type WeekAgendaProps = {
  // Any date in the week to show.
  date: Date
  tasks: Task[]
  onOpenTask: (id: string) => void
  now: Date
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})

// The week view on a phone: seven columns can't fit, so the week becomes a
// list — each day as a heading, its Do on times and deadlines below.
export default function WeekAgenda({
  date,
  tasks,
  onOpenTask,
  now,
}: WeekAgendaProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 pb-20 sm:hidden">
      {weekDays(date).map((day) => {
        const entries = entriesOn(tasks, day)
        const isToday = isSameDay(day, now)
        return (
          <section key={toDateKey(day)} className="mt-6">
            <div className="flex items-center gap-3 pb-1.5">
              <h3
                className={
                  isToday
                    ? 'font-mono text-[10px] tracking-[0.16em] text-pure uppercase'
                    : 'font-mono text-[10px] tracking-[0.16em] text-mute uppercase'
                }
              >
                {isToday ? 'Today · ' : ''}
                {dayFormatter.format(day)}
              </h3>
              <i className="h-px flex-1 bg-hairline" />
            </div>
            {entries.length === 0 ? (
              <p className="px-2 py-2 text-sm text-mute-2">Nothing planned.</p>
            ) : (
              entries.map((entry) => (
                <AgendaEntry
                  key={`${entry.kind}-${entry.task.id}`}
                  entry={entry}
                  onOpen={onOpenTask}
                />
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}
