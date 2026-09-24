import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toDateKey } from '../../../lib/time'
import type { Task } from '../../../types/task'
import type { Progress } from '../grouping'
import {
  calendarFromSearchParams,
  calendarTitle,
  plannedMinutes,
  searchParamsForCalendar,
  shiftCalendar,
  type CalendarMode,
  type CalendarPosition,
} from './calendarLayout'
import MonthView from './MonthView'
import WeekAgenda from './WeekAgenda'
import WeekView from './WeekView'

const MODES: { key: CalendarMode; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

type CalendarViewProps = {
  // Top-level tasks only, as everywhere else.
  tasks: Task[]
  progress: Map<string, Progress>
  selectedTaskId: string | null
  onOpenTask: (id: string) => void
  onAddTask: (
    title: string,
    scheduledAt: string,
    estimateMinutes: number | null,
  ) => void
  now: Date
}

// The calendar's main column: the heading, the controls to move through
// time, and the week or month itself.
export default function CalendarView({
  tasks,
  progress,
  selectedTaskId,
  onOpenTask,
  onAddTask,
  now,
}: CalendarViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const position = calendarFromSearchParams(searchParams, now)
  const { year, title } = calendarTitle(position)

  function goTo(next: CalendarPosition) {
    setSearchParams(searchParamsForCalendar(next, now))
  }

  // ← and → step through weeks (or months), T comes back to today. Not while
  // typing, and not with a modifier held: those belong to the browser.
  // No dependency list: the listener is swapped on every render, so it
  // always steps from the position on screen rather than a stale one.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey
      if (isTyping || hasModifier) return
      if (event.key === 'ArrowLeft') goTo(shiftCalendar(position, -1))
      else if (event.key === 'ArrowRight') goTo(shiftCalendar(position, 1))
      else if (event.key.toLowerCase() === 't') goTo({ ...position, date: now })
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <>
      <div className="flex flex-none flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pt-8 lg:px-11">
        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
            Calendar · {year}
          </div>
          <h2 className="mt-1.5 font-serif text-[clamp(34px,4.2vw,52px)] leading-none tracking-tight text-pure">
            <em className="text-bone">{title}</em>
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-2 pb-1.5">
          {/* Switching keeps the date: the month holding this week, or the
              week of the date that was in view. */}
          <div className="mr-2 flex rounded-full border border-pure/16 p-0.5">
            {MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => goTo({ ...position, mode: mode.key })}
                aria-pressed={position.mode === mode.key}
                className={
                  position.mode === mode.key
                    ? 'rounded-full bg-pure px-3 py-1 text-sm text-ink'
                    : 'rounded-full px-3 py-1 text-sm text-mute hover:text-bone'
                }
              >
                {mode.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(shiftCalendar(position, -1))}
            aria-label={
              position.mode === 'week' ? 'Previous week' : 'Previous month'
            }
            className="rounded-full border border-pure/16 px-3 py-1.5 text-sm text-bone hover:border-pure/36"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo({ ...position, date: now })}
            className="rounded-full border border-pure/16 px-3.5 py-1.5 text-sm text-bone hover:border-pure/36"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goTo(shiftCalendar(position, 1))}
            aria-label={position.mode === 'week' ? 'Next week' : 'Next month'}
            className="rounded-full border border-pure/16 px-3 py-1.5 text-sm text-bone hover:border-pure/36"
          >
            ›
          </button>
        </div>
      </div>

      {position.mode === 'week' ? (
        <>
          {/* Both are rendered and CSS picks one by screen width: the grid
              from `sm` up, the list on phones. */}
          <WeekAgenda
            date={position.date}
            tasks={tasks}
            onOpenTask={onOpenTask}
            now={now}
          />
          <WeekView
            date={position.date}
            tasks={tasks}
            lengthOf={(task) =>
              plannedMinutes(task, progress.get(task.id) ?? null)
            }
            selectedTaskId={selectedTaskId}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
            now={now}
          />
        </>
      ) : (
        <MonthView
          // A fresh day selection (on phones) for every month shown.
          key={toDateKey(position.date)}
          date={position.date}
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onOpenTask={onOpenTask}
          onOpenWeek={(day) => goTo({ mode: 'week', date: day })}
          now={now}
        />
      )}
    </>
  )
}
