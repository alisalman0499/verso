import { formatDuration, formatTime } from '../../../lib/time'
import { isDone } from '../grouping'
import { percentDown, type Block } from './calendarLayout'

type TaskBlockProps = {
  block: Block
  // The hours the column spans, in minutes since midnight.
  range: { start: number; end: number }
  isSelected: boolean
  onOpen: (id: string) => void
}

// A task in the week grid: at its Do on time, as tall as its length, and
// as wide as its share of any overlap.
export default function TaskBlock({
  block,
  range,
  isSelected,
  onOpen,
}: TaskBlockProps) {
  const { task, start, end, column, columns } = block
  const done = isDone(task)
  const top = percentDown(start, range.start, range.end)
  const bottom = percentDown(end, range.start, range.end)
  return (
    <button
      type="button"
      onClick={(event) => {
        // A block isn't an empty slot: the column mustn't open a composer.
        event.stopPropagation()
        onOpen(task.id)
      }}
      aria-label={`${task.title}, ${formatTime(task.scheduledAt)}${done ? ', done' : ''}`}
      // The small gaps keep neighbouring blocks from touching.
      style={{
        top,
        height: `calc(${bottom} - ${top} - 2px)`,
        left: `${(column / columns) * 100}%`,
        width: `calc(${100 / columns}% - 3px)`,
      }}
      className={[
        'absolute ml-0.5 flex flex-col overflow-hidden rounded-[5px] border px-1.5 py-1 text-left',
        isSelected
          ? 'z-[2] border-pure/36 bg-ink-4'
          : 'border-hairline bg-ink-3 hover:bg-ink-4',
      ].join(' ')}
    >
      <span
        className={
          done
            ? 'truncate text-xs leading-tight text-mute-2 line-through'
            : 'truncate text-xs leading-tight text-bone'
        }
      >
        {task.title}
      </span>
      {/* Room for a second line from about 45 minutes. */}
      {end - start >= 45 && (
        <span className="truncate font-mono text-[9px] text-mute">
          {formatTime(task.scheduledAt)} · {formatDuration(end - start)}
        </span>
      )}
    </button>
  )
}
