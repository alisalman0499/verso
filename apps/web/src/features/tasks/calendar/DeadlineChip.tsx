import { formatTime } from '../../../lib/time'
import type { Task } from '../../../types/task'
import { isDone } from '../grouping'

type DeadlineChipProps = {
  task: Task
  isSelected: boolean
  onOpen: (id: string) => void
}

// A deadline in the strip above the week grid.
export default function DeadlineChip({
  task,
  isSelected,
  onOpen,
}: DeadlineChipProps) {
  const done = isDone(task)
  const due = task.dueAt === null ? '' : `, due ${formatTime(task.dueAt)}`
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      aria-label={`${task.title}${due}${done ? ', done' : ''}`}
      className={[
        'truncate rounded-[4px] border px-1.5 py-0.5 text-left text-[11px]',
        isSelected
          ? 'border-pure/36 bg-ink-4'
          : 'border-pure/16 hover:bg-ink-3',
        done ? 'text-mute-2 line-through' : 'text-bone',
      ].join(' ')}
    >
      {task.title}
    </button>
  )
}
