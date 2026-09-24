import { formatTime } from '../../../lib/time'
import { isDone } from '../grouping'
import type { CalendarEntry } from './calendarLayout'

type MonthEntryProps = {
  entry: CalendarEntry
  isSelected: boolean
  onOpen: (id: string) => void
}

// One line in a month-view day: "14:00 Essay" for a Do on time, or an
// outlined "Essay" for a deadline — the same outline as the week view's
// deadline strip, so the two read alike.
export default function MonthEntry({
  entry,
  isSelected,
  onOpen,
}: MonthEntryProps) {
  const { task, kind, at } = entry
  const done = isDone(task)
  const label =
    kind === 'due'
      ? `${task.title}, due ${formatTime(at)}`
      : `${task.title}, ${formatTime(at)}`
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      aria-label={`${label}${done ? ', done' : ''}`}
      className={[
        'flex min-w-0 items-baseline gap-1.5 rounded-[4px] border px-1.5 py-0.5 text-left text-[11px]',
        kind === 'due' ? 'border-pure/16' : 'border-transparent',
        isSelected ? 'bg-ink-4' : 'hover:bg-ink-3',
      ].join(' ')}
    >
      {kind === 'do' && (
        <span className="flex-none font-mono text-[9px] text-mute-2">
          {formatTime(at)}
        </span>
      )}
      <span
        className={
          done ? 'truncate text-mute-2 line-through' : 'truncate text-bone'
        }
      >
        {task.title}
      </span>
    </button>
  )
}
