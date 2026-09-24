import { Link } from 'react-router-dom'
import Checkbox from '../../components/Checkbox'
import { formatDuration, formatWhen } from '../../lib/time'
import type { Task } from '../../types/task'
import { isDone, isOverdue, type Progress } from './grouping'

type TaskItemProps = {
  task: Task
  // null for a task without subtasks.
  progress: Progress | null
  isSelected: boolean
  // Whether its subtasks are folded open under the row. Only meaningful for
  // a task that has subtasks.
  isExpanded: boolean
  // The task's subtasks, in order. Empty unless the row is expanded.
  subtasks: Task[]
  // The list's URL, so the task page's Back link returns here.
  returnTo: string
  onToggleDone: (id: string) => void
  onSelect: (id: string) => void
  now: Date
}

export default function TaskItem({
  task,
  progress,
  isSelected,
  isExpanded,
  subtasks,
  returnTo,
  onToggleDone,
  onSelect,
  now,
}: TaskItemProps) {
  const hasSubtasks = progress !== null
  const showSubtasks = hasSubtasks && isExpanded && subtasks.length > 0
  const subtaskListId = `subtasks-${task.id}`

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={
        isSelected
          ? 'group rounded-md border border-hairline bg-ink-3 px-4 py-3'
          : 'group rounded-md border border-transparent px-4 py-3 hover:bg-ink-2'
      }
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isDone(task)}
          onToggle={() => onToggleDone(task.id)}
          label={isDone(task) ? 'Mark not done' : 'Mark done'}
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(task.id)
          }}
          // Tells screen readers this row folds open, and whether it is.
          aria-expanded={hasSubtasks ? showSubtasks : undefined}
          aria-controls={showSubtasks ? subtaskListId : undefined}
          className={
            isDone(task)
              ? 'flex min-w-0 flex-1 items-center gap-1.5 text-left text-mute-2 line-through'
              : 'flex min-w-0 flex-1 items-center gap-1.5 text-left text-bone'
          }
        >
          {/* Space is kept on every row, arrow or not, so titles line up. */}
          <span aria-hidden className="flex w-2.5 flex-none justify-center">
            {hasSubtasks && (
              <svg
                viewBox="0 0 10 10"
                className={
                  showSubtasks
                    ? 'h-2 w-2 rotate-90 fill-mute-2'
                    : 'h-2 w-2 fill-mute-2'
                }
              >
                <path d="M3 1.5 7.5 5 3 8.5Z" />
              </svg>
            )}
          </span>
          <span className="truncate">{task.title}</span>
        </button>

        {progress !== null && (
          <span
            aria-label={`${progress.done} of ${progress.total} subtasks done`}
            className="flex-none font-mono text-[10px] text-mute-2"
          >
            {progress.done}/{progress.total}
          </span>
        )}

        {/* With estimated subtasks, their total is the task's estimate. */}
        {progress !== null && progress.estimate !== null ? (
          <span className="flex-none font-mono text-[10px] text-mute-2">
            {formatDuration(progress.estimate.total)}
          </span>
        ) : (
          task.estimateMinutes !== null && (
            <span className="flex-none font-mono text-[10px] text-mute-2">
              {formatDuration(task.estimateMinutes)}
            </span>
          )
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

        {/* Phones have no side panel, so each row links to the task's page.
            Wide screens use the panel's "Open page" link instead. */}
        <Link
          to={`/tasks/${task.id}`}
          state={{ from: returnTo }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Open "${task.title}"`}
          className="-my-2 -mr-2 flex-none px-2 py-2 text-lg leading-none text-mute-2 hover:text-bone lg:hidden"
        >
          ›
        </Link>
      </div>

      {showSubtasks && (
        // Indented so the checkboxes line up under the task's title: the
        // row's checkbox (17px) + gap (12px) + arrow slot (10px) + gap (6px).
        // Clicks inside stop here, so ticking or clicking a step doesn't
        // also fold the task closed.
        <ul
          id={subtaskListId}
          onClick={(event) => event.stopPropagation()}
          className="mt-2.5 flex flex-col gap-1.5 pl-[45px]"
        >
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2.5">
              <Checkbox
                size="sm"
                checked={isDone(subtask)}
                onToggle={() => onToggleDone(subtask.id)}
                label={
                  isDone(subtask)
                    ? `Mark "${subtask.title}" not done`
                    : `Mark "${subtask.title}" done`
                }
              />
              <span
                className={
                  isDone(subtask)
                    ? 'flex-1 truncate text-sm text-mute-2 line-through'
                    : 'flex-1 truncate text-sm text-mute'
                }
              >
                {subtask.title}
              </span>
              {subtask.estimateMinutes !== null && (
                <span className="flex-none font-mono text-[10px] text-mute-2">
                  {formatDuration(subtask.estimateMinutes)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
