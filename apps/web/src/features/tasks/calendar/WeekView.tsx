import { useState, type MouseEvent } from 'react'
import {
  atMinutes,
  minutesAtFraction,
  weekDays,
} from '../../../lib/calendarDates'
import { isSameDay, toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
import {
  dayBlocks,
  deadlinesOn,
  hourRange,
  percentDown,
} from './calendarLayout'
import DeadlineChip from './DeadlineChip'
import SlotComposer from './SlotComposer'
import TaskBlock from './TaskBlock'

type WeekViewProps = {
  // Any date in the week to show.
  date: Date
  tasks: Task[]
  // How many minutes a task fills (see plannedMinutes).
  lengthOf: (task: Task) => number
  selectedTaskId: string | null
  onOpenTask: (id: string) => void
  onAddTask: (
    title: string,
    scheduledAt: string,
    estimateMinutes: number | null,
  ) => void
  now: Date
}

// Each hour is 3rem tall: enough for a 30-minute block to show its title.
const REM_PER_HOUR = 3

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

// Seven days side by side, Monday first, with the hours down the left.
// Tasks sit at their Do on time, as tall as their estimate. Deadlines get
// a strip of their own above the grid: they're mostly at 23:59, and a block
// there would read as work to do at midnight.
export default function WeekView({
  date,
  tasks,
  lengthOf,
  selectedTaskId,
  onOpenTask,
  onAddTask,
  now,
}: WeekViewProps) {
  // The empty slot that was clicked, if its composer is open.
  const [composer, setComposer] = useState<{
    dayKey: string
    minutes: number
  } | null>(null)

  const days = weekDays(date)
  const blocksByDay = days.map((day) => dayBlocks(tasks, day, lengthOf))
  const deadlinesByDay = days.map((day) => deadlinesOn(tasks, day))
  const hasDeadlines = deadlinesByDay.some((deadlines) => deadlines.length > 0)

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const { start, end } = hourRange(blocksByDay.flat())
  const isNowOnGrid = nowMinutes >= start && nowMinutes <= end
  const hours: number[] = []
  for (let minutes = start; minutes < end; minutes += 60) hours.push(minutes)

  // Where in the column the click landed, as a time of day.
  function handleColumnClick(event: MouseEvent<HTMLDivElement>, day: Date) {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = (event.clientY - rect.top) / rect.height
    setComposer({
      dayKey: toDateKey(day),
      minutes: minutesAtFraction(fraction, start, end),
    })
  }

  const columns = 'grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))]'

  return (
    // Below `sm` the grid is swapped for WeekAgenda (see CalendarView).
    <div className="hidden flex-1 overflow-y-auto px-5 pb-20 sm:block lg:px-11">
      {/* The day names stay in view while the hours scroll under them. */}
      <div className={`${columns} sticky top-0 z-10 bg-ink pt-6`}>
        <span />
        {days.map((day) => {
          const isToday = isSameDay(day, now)
          return (
            <div
              key={toDateKey(day)}
              className="border-b border-hairline px-2 pb-2 text-center"
            >
              <div className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
                {weekdayFormatter.format(day)}
              </div>
              <div
                className={
                  isToday
                    ? 'mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-pure font-serif text-lg text-ink'
                    : 'mx-auto mt-1 flex h-7 w-7 items-center justify-center font-serif text-lg text-bone'
                }
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}

        {hasDeadlines && (
          <>
            <span className="border-b border-hairline pt-1.5 pr-2 text-right font-mono text-[9px] tracking-[0.1em] text-mute-2 uppercase">
              Due
            </span>
            {deadlinesByDay.map((deadlines, index) => (
              <div
                key={toDateKey(days[index])}
                className="flex min-w-0 flex-col gap-1 border-b border-l border-hairline p-1"
              >
                {deadlines.map((task) => (
                  <DeadlineChip
                    key={task.id}
                    task={task}
                    isSelected={task.id === selectedTaskId}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <div
        className={columns}
        style={{ height: `${((end - start) / 60) * REM_PER_HOUR}rem` }}
      >
        <div className="relative">
          {hours.map((minutes) => (
            <span
              key={minutes}
              style={{ top: percentDown(minutes, start, end) }}
              className="absolute right-2 -translate-y-1/2 font-mono text-[9px] tracking-[0.1em] text-mute-2"
            >
              {/* The first label would sit half above the grid; skip it. */}
              {minutes === start
                ? ''
                : String(minutes / 60).padStart(2, '0') + ':00'}
            </span>
          ))}
        </div>

        {days.map((day, index) => {
          const dayKey = toDateKey(day)
          const isToday = isSameDay(day, now)
          // The weekend columns open the composer leftwards, so it doesn't
          // run off the right edge of the page.
          const alignRight = index >= 5
          return (
            <div
              key={dayKey}
              onClick={(event) => handleColumnClick(event, day)}
              className="relative border-l border-hairline"
            >
              {hours.map((minutes) => (
                <i
                  key={minutes}
                  style={{ top: percentDown(minutes, start, end) }}
                  className="pointer-events-none absolute right-0 left-0 h-px bg-hairline"
                />
              ))}

              {blocksByDay[index].map((block) => (
                <TaskBlock
                  key={block.task.id}
                  block={block}
                  range={{ start, end }}
                  isSelected={block.task.id === selectedTaskId}
                  onOpen={onOpenTask}
                />
              ))}

              {isToday && isNowOnGrid && (
                <i
                  style={{ top: percentDown(nowMinutes, start, end) }}
                  className="pointer-events-none absolute right-0 left-0 z-[1] h-px bg-pure"
                />
              )}

              {composer?.dayKey === dayKey && (
                <div
                  style={{ top: percentDown(composer.minutes, start, end) }}
                  className={
                    alignRight
                      ? 'absolute right-0 z-20'
                      : 'absolute left-0 z-20'
                  }
                >
                  <SlotComposer
                    at={atMinutes(day, composer.minutes).toISOString()}
                    onSubmit={(title, estimateMinutes) => {
                      onAddTask(
                        title,
                        atMinutes(day, composer.minutes).toISOString(),
                        estimateMinutes,
                      )
                      setComposer(null)
                    }}
                    onClose={() => setComposer(null)}
                    now={now}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
