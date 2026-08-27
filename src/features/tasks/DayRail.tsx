import { useEffect, useState } from 'react'
import { formatTime, isSameDay, minutesSinceMidnight } from '../../lib/time'
import type { Task } from '../../types/task'

const BASE_START = 6 * 60 // 06:00
const BASE_END = 22 * 60 // 22:00

const floorToHour = (minutes: number) => Math.floor(minutes / 60) * 60
const ceilToHour = (minutes: number) => Math.ceil(minutes / 60) * 60

function percentAcross(minutes: number, start: number, end: number): number {
  return ((minutes - start) / (end - start)) * 100
}

type DayRailProps = {
  tasks: Task[]
}

// The day rail places ticks, task marks, and the now-line at exact
// computed percentages along the day. Tailwind can only generate classes
// for values written literally in source, not ones computed from task
// data at runtime — so this is the one component where a scoped `style`
// prop is unavoidable. Everything else here (color, size, spacing) still
// comes from Tailwind tokens.
export default function DayRail({ tasks }: DayRailProps) {
  // Holding "now" in state is what makes the now-line actually move:
  // re-rendering on a timer is the only way the line advances.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const todaysTasks = tasks.filter(
    (task): task is Task & { scheduledAt: string } =>
      task.scheduledAt !== null && isSameDay(new Date(task.scheduledAt), now),
  )

  // The rail covers 06:00–22:00 by default, but stretches out to whole
  // hours when a task (or the current time) falls outside that, so a
  // mark is never positioned off the end of the rail.
  const points = [
    ...todaysTasks.map((task) => minutesSinceMidnight(task.scheduledAt)),
    nowMinutes,
  ]
  const start = Math.min(BASE_START, ...points.map(floorToHour))
  const end = Math.max(BASE_END, ...points.map(ceilToHour))

  const ticks: { minutes: number; isHour: boolean }[] = []
  for (let minutes = start; minutes <= end; minutes += 15) {
    ticks.push({ minutes, isHour: minutes % 60 === 0 })
  }

  return (
    <div className="relative mt-6 h-[62px] border-b border-pure/16">
      {ticks.map((tick) => (
        <i
          key={tick.minutes}
          style={{ left: `${percentAcross(tick.minutes, start, end)}%` }}
          className={
            tick.isHour
              ? 'absolute bottom-0 h-[11px] w-px bg-pure/34'
              : 'absolute bottom-0 h-1 w-px bg-pure/18'
          }
        />
      ))}

      {ticks
        .filter((tick) => tick.isHour && (tick.minutes / 60) % 2 === 0)
        .map((tick) => (
          <span
            key={tick.minutes}
            style={{ left: `${percentAcross(tick.minutes, start, end)}%` }}
            className="absolute bottom-4 -translate-x-1/2 font-mono text-[9px] tracking-[0.1em] text-mute-2"
          >
            {String(tick.minutes / 60).padStart(2, '0')}
          </span>
        ))}

      {todaysTasks.map((task) => (
        <i
          key={task.id}
          style={{
            left: `${percentAcross(minutesSinceMidnight(task.scheduledAt), start, end)}%`,
          }}
          className={
            task.done
              ? 'absolute bottom-6 h-2 w-px bg-pure/16'
              : 'absolute bottom-6 h-[30px] w-px bg-pure'
          }
        />
      ))}

      <i
        style={{ left: `${percentAcross(nowMinutes, start, end)}%` }}
        className="absolute top-0 bottom-0 w-px bg-pure"
      />
      <span
        style={{ left: `${percentAcross(nowMinutes, start, end)}%` }}
        className="absolute top-0 ml-[9px] font-mono text-[10px] tracking-[0.08em] text-pure"
      >
        {formatTime(now.toISOString())} now
      </span>
    </div>
  )
}
