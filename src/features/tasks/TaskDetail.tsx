import type { FocusEvent } from 'react'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/time'
import { classify, LISTS } from './grouping'
import type { TaskPatch } from './useTasks'
import type { Task } from '../../types/task'

type TaskDetailProps = {
  task: Task | null
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, patch: TaskPatch) => void
  now: Date
}

export default function TaskDetail({
  task,
  onToggleDone,
  onDelete,
  onUpdateTask,
  now,
}: TaskDetailProps) {
  if (task === null) {
    return (
      <aside className="flex min-h-0 flex-col border-l border-hairline bg-ink-2">
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

  const listLabel =
    LISTS.find((list) => list.key === classify(selected, now))?.label ?? ''

  // The three fields below are uncontrolled: the browser owns what you type,
  // and we only read it back on blur. `key={selected.id}` on the wrapper is what
  // makes that safe — switching tasks remounts the fields, so a half-typed
  // title can never leak onto the task you clicked next.

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

  function handleEstimateBlur(event: FocusEvent<HTMLInputElement>) {
    const raw = event.target.value.trim()
    if (raw === '') {
      if (selected.estimateMinutes !== null)
        onUpdateTask(selected.id, { estimateMinutes: null })
      return
    }
    const minutes = Number(raw)
    if (!Number.isFinite(minutes) || minutes < 0) {
      event.target.value =
        selected.estimateMinutes === null
          ? ''
          : String(selected.estimateMinutes)
      return
    }
    const rounded = Math.round(minutes)
    if (rounded !== selected.estimateMinutes)
      onUpdateTask(selected.id, { estimateMinutes: rounded })
  }

  return (
    <aside className="flex min-h-0 flex-col border-l border-hairline bg-ink-2">
      <div key={selected.id} className="flex-1 overflow-y-auto px-7 py-8">
        <div className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
          {selected.done ? 'Completed' : 'Open'}
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
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              When
            </dt>
            <dd className="flex items-center justify-end gap-2 text-right text-sm text-bone">
              <input
                type="datetime-local"
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
            <dd className="flex items-center justify-end gap-1.5 text-right text-sm text-bone">
              <input
                type="number"
                min="0"
                step="5"
                defaultValue={selected.estimateMinutes ?? ''}
                placeholder="—"
                onBlur={handleEstimateBlur}
                className="w-16 bg-transparent text-right text-sm text-bone placeholder-mute-2 outline-none [color-scheme:dark]"
              />
              <span className="font-mono text-[10px] text-mute-2">min</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              List
            </dt>
            <dd className="text-right text-sm text-bone">{listLabel}</dd>
          </div>
        </dl>

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
          {selected.done ? 'Reopen task' : 'Mark done'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(selected.id)}
          className="rounded-full border border-pure/16 px-4 py-1.5 text-sm text-mute hover:border-pure/30 hover:text-bone"
        >
          Delete
        </button>
      </footer>
    </aside>
  )
}
