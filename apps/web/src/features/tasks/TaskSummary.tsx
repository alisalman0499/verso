import { useState } from 'react'
import { Link } from 'react-router-dom'
import ActionMenu from '../../components/ActionMenu'
import { formatDuration, formatFullDateTime } from '../../lib/time'
import type { Project } from '../../types/project'
import type { Task } from '../../types/task'
import {
  classify,
  estimateFromSubtasks,
  isDone,
  isOverdue,
  LISTS,
} from './grouping'

type TaskSummaryProps = {
  task: Task
  subtasks: Task[]
  projects: Project[]
  now: Date
  returnTo: string
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
}

// A read-only look at one task, for the side panel. Editing happens on the
// task's own page; the panel is for glancing, so there are no fields to
// nudge by accident. Rendered with `key={task.id}`, so a half-armed delete
// never carries over to the next task.
export default function TaskSummary({
  task,
  subtasks,
  projects,
  now,
  returnTo,
  onToggleDone,
  onDelete,
}: TaskSummaryProps) {
  const [isConfirmingDelete, setConfirmingDelete] = useState(false)

  const done = isDone(task)
  const subtaskEstimate = estimateFromSubtasks(subtasks)
  const projectName =
    projects.find((project) => project.id === task.projectId)?.name ??
    'No project'
  const listLabel =
    LISTS.find((list) => list.key === classify(task, now))?.label ?? ''
  const doneSubtasks = subtasks.filter(isDone).length

  let estimate = '—'
  if (subtaskEstimate !== null) {
    estimate =
      subtaskEstimate.remaining === 0
        ? formatDuration(subtaskEstimate.total)
        : `${formatDuration(subtaskEstimate.total)} · ${formatDuration(subtaskEstimate.remaining)} left`
  } else if (task.estimateMinutes !== null) {
    estimate = formatDuration(task.estimateMinutes)
  }

  const rows: { label: string; value: string }[] = [
    {
      label: 'Deadline',
      value:
        task.dueAt === null
          ? '—'
          : `${formatFullDateTime(task.dueAt, now)}${isOverdue(task, now) ? ' · overdue' : ''}`,
    },
    {
      label: 'Do on',
      value:
        task.scheduledAt === null
          ? '—'
          : formatFullDateTime(task.scheduledAt, now),
    },
    { label: 'Estimate', value: estimate },
    { label: 'Project', value: projectName },
    { label: 'List', value: listLabel },
  ]

  return (
    <>
      <div className="flex-1 overflow-y-auto px-7 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
            {done ? 'Completed' : 'Open'}
          </div>
          <ActionMenu
            label="Task actions"
            actions={[
              isConfirmingDelete
                ? { label: 'Confirm delete', onSelect: () => onDelete(task.id) }
                : {
                    label: 'Delete',
                    onSelect: () => setConfirmingDelete(true),
                    keepOpen: true,
                  },
            ]}
            onClose={() => setConfirmingDelete(false)}
          />
        </div>

        <h2 className="mt-3 font-serif text-2xl leading-tight break-words text-pure">
          {task.title}
        </h2>

        <dl className="mt-6 border-t border-hairline">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 border-b border-hairline py-3"
            >
              <dt className="font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute-2 uppercase">
                {row.label}
              </dt>
              <dd className="text-right text-sm text-bone">{row.value}</dd>
            </div>
          ))}
        </dl>

        {subtasks.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
                Subtasks
              </h3>
              <span className="font-mono text-[10px] text-mute-2">
                {doneSubtasks}/{subtasks.length}
              </span>
            </div>
            <ul className="flex flex-col">
              {subtasks.map((subtask) => (
                <li
                  key={subtask.id}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  {/* A picture of a checkbox, not a control: this panel only
                      shows. Ticking happens in the list or on the page. */}
                  <span
                    aria-hidden
                    className={
                      isDone(subtask)
                        ? 'h-[9px] w-[9px] flex-none rounded-[3px] bg-pure'
                        : 'h-[9px] w-[9px] flex-none rounded-[3px] border border-pure/36'
                    }
                  />
                  <span
                    className={
                      isDone(subtask)
                        ? 'flex-1 truncate text-sm text-mute-2 line-through'
                        : 'flex-1 truncate text-sm text-bone'
                    }
                  >
                    {subtask.title}
                    <span className="sr-only">
                      {isDone(subtask) ? ' (done)' : ' (open)'}
                    </span>
                  </span>
                  {subtask.estimateMinutes !== null && (
                    <span className="flex-none font-mono text-[10px] text-mute-2">
                      {formatDuration(subtask.estimateMinutes)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* whitespace-pre-wrap keeps the line breaks typed into the notes. */}
        <p
          className={
            task.notes === ''
              ? 'mt-5 text-[13.5px] text-mute-2'
              : 'mt-5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-mute'
          }
        >
          {task.notes === '' ? 'No notes.' : task.notes}
        </p>
      </div>

      <footer className="flex items-center gap-2.5 border-t border-hairline px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleDone(task.id)}
          className="flex-1 rounded-full bg-pure px-4 py-2 text-center text-sm font-medium text-ink"
        >
          {done ? 'Reopen task' : 'Mark done'}
        </button>
        <Link
          to={`/tasks/${task.id}`}
          state={{ from: returnTo }}
          className="rounded-full border border-pure/16 px-4 py-1.5 text-sm text-bone hover:border-pure/30"
        >
          Go to task
        </Link>
      </footer>
    </>
  )
}
