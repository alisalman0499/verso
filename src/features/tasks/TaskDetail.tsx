import {
  formatDuration,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../lib/time'
import { classify, LISTS } from './grouping'
import type { Task } from '../../types/task'

type TaskDetailProps = {
  task: Task | null
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onSetScheduledAt: (id: string, scheduledAt: string | null) => void
}

export default function TaskDetail({
  task,
  onToggleDone,
  onDelete,
  onSetScheduledAt,
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

  const listLabel =
    LISTS.find((list) => list.key === classify(task, new Date()))?.label ?? ''

  return (
    <aside className="flex min-h-0 flex-col border-l border-hairline bg-ink-2">
      <div className="flex-1 overflow-y-auto px-7 py-8">
        <div className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
          {task.done ? 'Completed' : 'Open'}
        </div>
        <h3 className="mt-3 font-serif text-2xl leading-tight text-pure">
          {task.title}
        </h3>

        <dl className="mt-6 border-t border-hairline">
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              When
            </dt>
            <dd className="flex items-center justify-end gap-2 text-right text-sm text-bone">
              <input
                type="datetime-local"
                value={
                  task.scheduledAt !== null
                    ? toDatetimeLocalValue(task.scheduledAt)
                    : ''
                }
                onChange={(event) => {
                  const value = event.target.value
                  onSetScheduledAt(
                    task.id,
                    value === '' ? null : fromDatetimeLocalValue(value),
                  )
                }}
                className="bg-transparent text-right text-sm text-bone outline-none [color-scheme:dark]"
              />
              {task.scheduledAt !== null && (
                <button
                  type="button"
                  onClick={() => onSetScheduledAt(task.id, null)}
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
            <dd className="text-right text-sm text-bone">
              {task.estimateMinutes !== null
                ? formatDuration(task.estimateMinutes)
                : 'Unestimated'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-hairline py-3">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
              List
            </dt>
            <dd className="text-right text-sm text-bone">{listLabel}</dd>
          </div>
        </dl>

        <p
          className={
            task.notes
              ? 'mt-5 text-[13.5px] leading-relaxed text-mute'
              : 'mt-5 text-[13.5px] leading-relaxed text-mute-2'
          }
        >
          {task.notes || 'No notes yet.'}
        </p>
      </div>

      <footer className="flex items-center gap-2.5 border-t border-hairline px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleDone(task.id)}
          className="flex-1 rounded-full bg-pure px-4 py-2 text-center text-sm font-medium text-ink"
        >
          {task.done ? 'Reopen task' : 'Mark done'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-full border border-pure/16 px-4 py-1.5 text-sm text-mute hover:border-pure/30 hover:text-bone"
        >
          Delete
        </button>
      </footer>
    </aside>
  )
}
