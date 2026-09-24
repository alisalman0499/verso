import { useState, type FocusEvent } from 'react'
import {
  formatDuration,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../lib/time'
import EstimateField from './EstimateField'
import { classify, estimateFromSubtasks, isDone, LISTS } from './grouping'
import SubtaskList from './SubtaskList'
import type { UpdateTaskInput } from '../../types/task'
import type { Project } from '../../types/project'
import type { Task } from '../../types/task'

type TaskDetailProps = {
  task: Task | null
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
}

export default function TaskDetail({
  task,
  subtasks,
  projects,
  onToggleDone,
  onDelete,
  onUpdateTask,
  onAddSubtask,
  onDeleteSubtask,
  now,
}: TaskDetailProps) {
  // Which task's delete button is armed, not a plain boolean — so that
  // switching to a different task, whose id won't match, disarms it for
  // free. A boolean would need an effect to reset it, and would leave a
  // window where the wrong task gets deleted if you click through fast.
  // Hooks can't run after a conditional return, so this sits above the
  // null guard below.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (task === null) {
    return (
      <aside className="hidden min-h-0 flex-col border-l border-hairline bg-ink-2 lg:flex">
        <div className="flex-1 overflow-y-auto px-7 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-bone">No task selected.</p>
          <span className="text-sm text-mute">
            Pick one from the list to see its detail.
          </span>
        </div>
      </aside>
    )
  }

  // TypeScript narrows `task` to non-null after the guard above, but that
  // narrowing does not reach inside the blur handlers below: `task` is a
  // parameter, and parameters can be reassigned. Copying it into a const
  // carries the narrowed type in, so no `as` cast is needed.
  const selected = task
  const isConfirmingDelete = confirmDeleteId === selected.id

  // With estimated subtasks, the task's estimate is theirs added up, not a
  // number typed separately that could disagree with them.
  const subtaskEstimate = estimateFromSubtasks(subtasks)

  const listLabel =
    LISTS.find((list) => list.key === classify(selected, now))?.label ?? ''

  // Title and notes are uncontrolled: the browser owns what you type, and we
  // only read it back on blur. `key={selected.id}` on the wrapper is what
  // makes that safe — switching tasks remounts the fields, so a half-typed
  // title can never leak onto the task you clicked next. EstimateField keeps
  // its own draft in state, and the same remount resets it.

  function handleTitleBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const title = event.target.value.trim()
    // A task with no title is unfindable in the list, so refuse the edit
    // and put the old one back rather than saving an empty string.
    if (title === '') {
      event.target.value = selected.title
      return
    }
    if (title !== selected.title) onUpdateTask(selected.id, { title })
  }

  function handleNotesBlur(event: FocusEvent<HTMLTextAreaElement>) {
    const notes = event.target.value
    if (notes !== selected.notes) onUpdateTask(selected.id, { notes })
  }

  return (
    <aside className="hidden min-h-0 flex-col border-l border-hairline bg-ink-2 lg:flex">
      <div key={selected.id} className="flex-1 overflow-y-auto px-7 py-8">
        <div className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
          {isDone(selected) ? 'Completed' : 'Open'}
        </div>
        <textarea
          defaultValue={selected.title}
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
                  selected.dueAt !== null
                    ? toDatetimeLocalValue(selected.dueAt)
                    : ''
                }
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(selected.id, {
                    dueAt: value === '' ? null : fromDatetimeLocalValue(value),
                  })
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              />
              {selected.dueAt !== null && (
                <button
                  type="button"
                  onClick={() => onUpdateTask(selected.id, { dueAt: null })}
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
                  selected.scheduledAt !== null
                    ? toDatetimeLocalValue(selected.scheduledAt)
                    : ''
                }
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(selected.id, {
                    scheduledAt:
                      value === '' ? null : fromDatetimeLocalValue(value),
                  })
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              />
              {selected.scheduledAt !== null && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTask(selected.id, { scheduledAt: null })
                  }
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
                  minutes={selected.estimateMinutes}
                  onChange={(estimateMinutes) =>
                    onUpdateTask(selected.id, { estimateMinutes })
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
                value={selected.projectId ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  onUpdateTask(selected.id, {
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
          isParentDone={isDone(selected)}
          onAdd={(title, estimateMinutes) =>
            onAddSubtask(selected.id, title, estimateMinutes)
          }
          onToggleDone={onToggleDone}
          onDelete={onDeleteSubtask}
          onSetEstimate={(id, estimateMinutes) =>
            onUpdateTask(id, { estimateMinutes })
          }
          onCompleteParent={() => onToggleDone(selected.id)}
        />

        <textarea
          defaultValue={selected.notes}
          rows={4}
          placeholder="No notes yet."
          onBlur={handleNotesBlur}
          className="mt-5 w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-mute placeholder-mute-2 outline-none"
        />
      </div>

      <footer className="flex items-center gap-2.5 border-t border-hairline px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleDone(selected.id)}
          className="flex-1 rounded-full bg-pure px-4 py-2 text-center text-sm font-medium text-ink"
        >
          {isDone(selected) ? 'Reopen task' : 'Mark done'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isConfirmingDelete) {
              onDelete(selected.id)
            } else {
              setConfirmDeleteId(selected.id)
            }
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
    </aside>
  )
}
