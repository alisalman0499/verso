import { MAX_ESTIMATE_MINUTES } from '@verso/shared'
import { useState, type KeyboardEvent } from 'react'
import Checkbox from '../../components/Checkbox'
import { splitTrailingDuration } from '../../lib/time'
import type { Task } from '../../types/task'
import { isDone } from './grouping'
import SubtaskEstimate from './SubtaskEstimate'

type SubtaskListProps = {
  subtasks: Task[]
  isParentDone: boolean
  onAdd: (title: string, estimateMinutes: number | null) => void
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onSetEstimate: (id: string, estimateMinutes: number | null) => void
  onCompleteParent: () => void
}

export default function SubtaskList({
  subtasks,
  isParentDone,
  onAdd,
  onToggleDone,
  onDelete,
  onSetEstimate,
  onCompleteParent,
}: SubtaskListProps) {
  const [draft, setDraft] = useState('')

  const doneCount = subtasks.filter(isDone).length
  const allDone = subtasks.length > 0 && doneCount === subtasks.length

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setDraft('')
      event.currentTarget.blur()
      return
    }
    if (event.key !== 'Enter') return
    // "Write intro 45m" becomes the subtask "Write intro", estimated at 45m.
    const { title, minutes } = splitTrailingDuration(draft)
    if (title === '') return
    const withinLimit = minutes !== null && minutes <= MAX_ESTIMATE_MINUTES
    onAdd(withinLimit ? title : draft.trim(), withinLimit ? minutes : null)
    // The field stays focused and empty, so a list of steps can be typed in
    // one go without reaching for the mouse.
    setDraft('')
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase">
          Subtasks
        </h3>
        {subtasks.length > 0 && (
          <span className="font-mono text-[10px] text-mute-2">
            {doneCount}/{subtasks.length}
          </span>
        )}
      </div>

      <ul className="flex flex-col">
        {subtasks.map((subtask) => {
          const done = isDone(subtask)
          return (
            <li
              key={subtask.id}
              className="group flex items-center gap-2.5 py-1.5"
            >
              <Checkbox
                size="sm"
                checked={done}
                onToggle={() => onToggleDone(subtask.id)}
                label={
                  done
                    ? `Mark "${subtask.title}" not done`
                    : `Mark "${subtask.title}" done`
                }
              />
              <span
                className={
                  done
                    ? 'flex-1 truncate text-sm text-mute-2 line-through'
                    : 'flex-1 truncate text-sm text-bone'
                }
              >
                {subtask.title}
              </span>
              <SubtaskEstimate
                minutes={subtask.estimateMinutes}
                onChange={(minutes) => onSetEstimate(subtask.id, minutes)}
              />
              <button
                type="button"
                onClick={() => onDelete(subtask.id)}
                aria-label={`Delete "${subtask.title}"`}
                className="flex-none px-1 text-mute-2 opacity-0 group-hover:opacity-100 hover:text-bone focus-visible:opacity-100"
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>

      <input
        type="text"
        aria-label="Add a subtask"
        placeholder='Add a subtask… e.g. "Draft body 1h"'
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        className="mt-1 w-full bg-transparent py-1.5 text-sm text-bone placeholder-mute-2 outline-none"
      />

      {/* Offered, never done for you: the task may still need a final step
          that isn't on the list. */}
      {allDone && !isParentDone && (
        <div
          role="status"
          className="mt-3 flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2.5"
        >
          <span className="text-sm text-bone">All steps done.</span>
          <button
            type="button"
            onClick={onCompleteParent}
            className="text-sm text-pure underline-offset-4 hover:underline"
          >
            Mark the task done
          </button>
        </div>
      )}
    </section>
  )
}
