import { useState, type FocusEvent, type ReactNode } from 'react'
import {
  formatDuration,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../lib/time'
import type { Project } from '../../types/project'
import type { Task, UpdateTaskInput } from '../../types/task'
import EstimateField from './EstimateField'
import { classify, estimateFromSubtasks, isDone, LISTS } from './grouping'
import SubtaskList from './SubtaskList'

type TaskEditorProps = {
  task: Task
  subtasks: Task[]
  projects: Project[]
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, patch: UpdateTaskInput) => void
  onAddSubtask: (
    parentId: string,
    title: string,
    estimateMinutes: number | null,
  ) => void
  onDeleteSubtask: (id: string) => void
  now: Date
  // Shown at the top right, beside Open / Completed: the side panel puts an
  // "Open page" link here.
  headerAction?: ReactNode
}

// Everything you can see and change about one task. Used by the side panel
// (TaskDetail) and the task's own page (TaskPage), so there is one editor to
// maintain, not two.
//
// Callers must render it with `key={task.id}`. Switching tasks then builds a
// fresh editor, which resets everything held locally — the uncontrolled
// title and notes, and the armed delete button — without any effect.
export default function TaskEditor({
  task,
  subtasks,
  projects,
  onToggleDone,
  onDelete,
  onUpdateTask,
  onAddSubtask,
  onDeleteSubtask,
  now,
  headerAction,
}: TaskEditorProps) {
  // Delete takes two clicks. Because of the key, this starts false for
  // every task, so an armed button can't carry over to the next one.
  const [isConfirmingDelete, setConfirmingDelete] = useState(false)

  // With estimated subtasks, the task's estimate is theirs added up, not a
  // number typed separately that could disagree with them.
  const subtaskEstimate = estimateFromSubtasks(subtasks)

  const listLabel =
    LISTS.find((list) => list.key === classify(task, now))?.label ?? ''

  // Title and notes are uncontrolled: the browser owns what you type, and we
  // only read it back on blur. That's safe because every caller renders this
  // with `key={task.id}` — switching tasks remounts the editor, so a
  // half-typed title can never leak onto the task you clicked next.

  function handleTitleBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const title = event.target.value.trim()
    // A task with no title is unfindable in the list, so refuse the edit
    // and put the old one back rather than saving an empty string.
    if (title === '') {
      event.target.value = task.title
      return
    }
    if (title !== task.title) onUpdateTask(task.id, { title })
  }

  function handleNotesBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const notes = event.target.value
    if (notes !== task.notes) onUpdateTask(task.id, { notes })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-7 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
            {isDone(task) ? 'Completed' : 'Open'}
          </div>
          {headerAction}
        </div>
        <textarea
          defaultValue={task.title}
          rows={2}
          onBlur={handleTitleBlur}
          onKeyDown={(event) => {
            // Enter commits instead of inserting a newline — titles are one line.
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="mt-3 w-full resize-none bg-transparent font-serif text-2xl leading-tight text-pure outline-none"
        />

        <dl className="mt-6 border-t border-hairline">
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute-2 uppercase">
              Deadline
            </dt>
            <dd className="flex items-center justify-end gap-2 text-right text-sm text-bone">
              <input
                type="datetime-local"
                aria-label="Deadline"
                value={
                  task.dueAt !== null ? toDatetimeLocalValue(task.dueAt) : ''
                }
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(task.id, {
                    dueAt: value === '' ? null : fromDatetimeLocalValue(value),
                  })
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              />
              {task.dueAt !== null && (
                <button
                  type="button"
                  onClick={() => onUpdateTask(task.id, { dueAt: null })}
                  className="font-mono text-[10px] text-mute-2 hover:text-bone"
                >
                  clear
                </button>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute-2 uppercase">
              Do on
            </dt>
            <dd className="flex items-center justify-end gap-2 text-right text-sm text-bone">
              <input
                type="datetime-local"
                aria-label="Do on"
                value={
                  task.scheduledAt !== null
                    ? toDatetimeLocalValue(task.scheduledAt)
                    : ''
                }
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(task.id, {
                    scheduledAt:
                      value === '' ? null : fromDatetimeLocalValue(value),
                  })
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              />
              {task.scheduledAt !== null && (
                <button
                  type="button"
                  onClick={() => onUpdateTask(task.id, { scheduledAt: null })}
                  className="font-mono text-[10px] text-mute-2 hover:text-bone"
                >
                  clear
                </button>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              Estimate
            </dt>
            <dd>
              {subtaskEstimate === null ? (
                <EstimateField
                  minutes={task.estimateMinutes}
                  onChange={(estimateMinutes) =>
                    onUpdateTask(task.id, { estimateMinutes })
                  }
                />
              ) : (
                <span className="text-right text-sm text-bone">
                  {formatDuration(subtaskEstimate.total)}
                  <span className="ml-2 font-mono text-[10px] text-mute-2">
                    {subtaskEstimate.remaining === 0
                      ? 'from subtasks'
                      : `${formatDuration(subtaskEstimate.remaining)} left`}
                  </span>
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              Project
            </dt>
            <dd className="text-right text-sm text-bone">
              <select
                value={task.projectId ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(task.id, {
                    projectId: value === '' ? null : value,
                  })
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              List
            </dt>
            <dd className="text-right text-sm text-bone">{listLabel}</dd>
          </div>
        </dl>

        <SubtaskList
          subtasks={subtasks}
          isParentDone={isDone(task)}
          onAdd={(title, estimateMinutes) =>
            onAddSubtask(task.id, title, estimateMinutes)
          }
          onToggleDone={onToggleDone}
          onDelete={onDeleteSubtask}
          onSetEstimate={(id, estimateMinutes) =>
            onUpdateTask(id, { estimateMinutes })
          }
          onCompleteParent={() => onToggleDone(task.id)}
        />

        <textarea
          defaultValue={task.notes}
          rows={4}
          placeholder="No notes yet."
          onBlur={handleNotesBlur}
          className="mt-5 w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-mute placeholder-mute-2 outline-none"
        />
      </div>

      <footer className="flex items-center gap-2.5 border-t border-hairline px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleDone(task.id)}
          className="flex-1 rounded-full bg-pure px-4 py-2 text-center text-sm font-medium text-ink"
        >
          {isDone(task) ? 'Reopen task' : 'Mark done'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isConfirmingDelete) onDelete(task.id)
            else setConfirmingDelete(true)
          }}
          className={
            isConfirmingDelete
              ? 'rounded-full border border-pure/30 bg-ink-3 px-4 py-1.5 text-sm text-bone'
              : 'rounded-full border border-pure/16 px-4 py-1.5 text-sm text-mute hover:border-pure/30 hover:text-bone'
          }
        >
          {isConfirmingDelete ? 'Confirm delete' : 'Delete'}
        </button>
      </footer>
    </div>
  )
}
