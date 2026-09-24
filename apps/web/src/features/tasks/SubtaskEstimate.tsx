import { MAX_ESTIMATE_MINUTES } from '@verso/shared'
import { useRef, useState, type KeyboardEvent } from 'react'
import { formatDuration, parseDuration } from '../../lib/time'

type SubtaskEstimateProps = {
  minutes: number | null
  onChange: (minutes: number | null) => void
}

// A subtask's estimate: plain text until clicked, then a small input that
// reads the same "1h 30m" / "90" / "1,5h" as the task's own estimate field.
export default function SubtaskEstimate({
  minutes,
  onChange,
}: SubtaskEstimateProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const isCancelling = useRef(false)

  function startEditing() {
    setDraft(minutes === null ? '' : formatDuration(minutes))
  }

  function commit() {
    const text = draft?.trim() ?? ''
    setDraft(null)
    if (isCancelling.current) {
      isCancelling.current = false
      return
    }
    if (text === '') {
      if (minutes !== null) onChange(null)
      return
    }
    const parsed = parseDuration(text)
    if (parsed === null || parsed > MAX_ESTIMATE_MINUTES) return
    if (parsed !== minutes) onChange(parsed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      isCancelling.current = true
      event.currentTarget.blur()
    }
  }

  if (draft !== null) {
    return (
      <input
        type="text"
        aria-label="Subtask estimate"
        // Focus the input the moment it replaces the button, so one click is
        // enough to start typing.
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-14 flex-none bg-transparent text-right font-mono text-[11px] text-bone outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      aria-label={
        minutes === null
          ? 'Add an estimate'
          : `Estimate ${formatDuration(minutes)}, change`
      }
      className={
        minutes === null
          ? 'flex-none font-mono text-[11px] text-mute-2 opacity-0 group-hover:opacity-100 hover:text-bone focus-visible:opacity-100'
          : 'flex-none font-mono text-[11px] text-mute hover:text-bone'
      }
    >
      {minutes === null ? '+ time' : formatDuration(minutes)}
    </button>
  )
}
