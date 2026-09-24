import { formatDuration, formatWhen } from '../../lib/time'
import type { Task } from '../../types/task'
import { isDone, isOverdue } from './grouping'

type TaskItemProps = {
  task: Task
  isSelected: boolean
  onToggleDone: (id: string) => void
  onSelect: (id: string) => void
  now: Date
}

export default function TaskItem({
  task,
  isSelected,
  onToggleDone,
  onSelect,
  now,
}: TaskItemProps) {
  return (
    <div
      onClick={() => onSelect(task.id)}
      className={
        isSelected
          ? 'group flex items-center gap-3 rounded-md border border-hairline bg-ink-3 px-4 py-3'
          : 'group flex items-center gap-3 rounded-md border border-transparent px-4 py-3 hover:bg-ink-2'
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggleDone(task.id)
        }}
        aria-label={isDone(task) ? 'Mark not done' : 'Mark done'}
        className={
          isDone(task)
            ? 'flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] border border-pure bg-pure'
            : 'flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] border border-pure/16 group-hover:border-pure/36'
        }
      >
        {isDone(task) && (
          <svg
            viewBox="0 0 10 10"
            className="h-[9px] w-[9px] fill-none stroke-ink"
          >
            <path
              d="M1.6 5.2 3.9 7.4 8.4 2.6"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onSelect(task.id)
        }}
        className={
          isDone(task)
            ? 'flex-1 truncate text-left text-mute-2 line-through'
            : 'flex-1 truncate text-left text-bone'
        }
      >
        {task.title}
      </button>

      {task.estimateMinutes !== null && (
        <span className="flex-none font-mono text-[10px] text-mute-2">
          {formatDuration(task.estimateMinutes)}
        </span>
      )}

      {task.dueAt !== null && !isDone(task) && (
        // Overdue reads brighter, not louder: no red, no warning icon. The
        // point is to be noticed, not to make the list feel like a scolding.
        <span
          className={
            isOverdue(task, now)
              ? 'flex-none font-mono text-[10px] whitespace-nowrap text-bone'
              : 'flex-none font-mono text-[10px] whitespace-nowrap text-mute-2'
          }
        >
          {isOverdue(task, now)
            ? 'overdue'
            : `due ${formatWhen(task.dueAt, now)}`}
        </span>
      )}

      <span className="min-w-[52px] flex-none text-right font-mono text-[11px] whitespace-nowrap text-mute">
        {task.scheduledAt !== null ? formatWhen(task.scheduledAt, now) : '—'}
      </span>
    </div>
  )
}
