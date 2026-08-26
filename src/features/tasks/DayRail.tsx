import { isSameDay, minutesSinceMidnight, formatTime } from '../../lib/time'
import type { Task } from '../../types/task'

const START = 6 * 60 // 06:00
const END = 22 * 60 // 22:00

function percentAcross(minutes: number): number {
  return ((minutes - START) / (END - START)) * 100
}

type DayRailProps = {
  tasks: Task[]
}

// The day rail places ticks, task marks, and the now-line at exact
// computed percentages along a 06:00–22:00 timeline. Tailwind can only
// generate classes for values written literally in source, not ones
// computed from task data at runtime — so this is the one component
// where a scoped `style` prop is unavoidable. Everything else here
// (color, size, spacing) still comes from Tailwind tokens.
export default function DayRail({ tasks }: DayRailProps) {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const ticks: { minutes: number; isHour: boolean }[] = []
  for (let minutes = START; minutes <= END; minutes += 15) {
    ticks.push({ minutes, isHour: minutes % 60 === 0 })
  }

  const todaysTasks = tasks.filter(
    (task): task is Task & { scheduledAt: string } =>
      task.scheduledAt !== null && isSameDay(new Date(task.scheduledAt), now),
  )

  return (
    <div className="relative mt-6 h-[62px] border-b border-pure/16">
      {ticks.map((tick) => (
        <i
          key={tick.minutes}
          style={{ left: `${percentAcross(tick.minutes)}%` }}
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
            style={{ left: `${percentAcross(tick.minutes)}%` }}
            className="absolute bottom-4 -translate-x-1/2 font-mono text-[9px] tracking-[0.1em] text-mute-2"
          >
            {String(tick.minutes / 60).padStart(2, '0')}
          </span>
        ))}

      {todaysTasks.map((task) => (
        <i
          key={task.id}
          style={{
            left: `${percentAcross(minutesSinceMidnight(task.scheduledAt))}%`,
          }}
          className={
            task.done
              ? 'absolute bottom-6 h-2 w-px bg-pure/16'
              : 'absolute bottom-6 h-[30px] w-px bg-pure'
          }
        />
      ))}

      {nowMinutes >= START && nowMinutes <= END && (
        <>
          <i
            style={{ left: `${percentAcross(nowMinutes)}%` }}
            className="absolute top-0 bottom-0 w-px bg-pure"
          />
          <span
            style={{ left: `${percentAcross(nowMinutes)}%` }}
            className="absolute top-0 ml-[9px] font-mono text-[10px] tracking-[0.08em] text-pure"
          >
            {formatTime(now.toISOString())} now
          </span>
        </>
      )}
    </div>
  )
}
