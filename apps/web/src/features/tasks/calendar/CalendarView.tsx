import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Task } from '../../../types/task'
import type { Progress } from '../grouping'
import {
  calendarFromSearchParams,
  calendarTitle,
  plannedMinutes,
  searchParamsForCalendar,
  shiftCalendar,
  type CalendarPosition,
} from './calendarLayout'
import WeekView from './WeekView'

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

      <WeekView
        date={position.date}
        tasks={tasks}
        lengthOf={(task) => plannedMinutes(task, progress.get(task.id) ?? null)}
        selectedTaskId={selectedTaskId}
        onOpenTask={onOpenTask}
        onAddTask={onAddTask}
        now={now}
      />
    </>
  )
}
