import { MAX_ESTIMATE_MINUTES } from '@verso/shared'
import { useRef, useState, type KeyboardEvent } from 'react'
import { formatDuration, parseDuration } from '../../lib/time'

// One tap for the most common sizes. Picking is less friction than typing,
// and small, concrete chunks are easier to start than a vague "a while".
const QUICK_PICKS = [15, 30, 60, 120]

type EstimateFieldProps = {
  minutes: number | null
  onChange: (minutes: number | null) => void
}

function display(minutes: number | null): string {
  return minutes === null ? '' : formatDuration(minutes)
}

export default function EstimateField({
  minutes,
  onChange,
}: EstimateFieldProps) {
  // What's in the box while you type, kept apart from the saved value so a
  // half-typed "1h 3" is never sent anywhere.
  const [draft, setDraft] = useState(() => display(minutes))

  // When the saved value changes from outside (a quick pick, or the server's
  // response), the draft follows. Comparing with the previous value during
  // render is React's recommended pattern for this: an effect would render
  // the stale text once and then correct it.
  const [previousMinutes, setPreviousMinutes] = useState(minutes)
  if (minutes !== previousMinutes) {
    setPreviousMinutes(minutes)
    setDraft(display(minutes))
  }

  // Set by Escape so the blur that follows discards the draft instead of
  // saving it. A ref, not state: it changes no pixels, so it shouldn't
  // cause a re-render.
  const isCancelling = useRef(false)

  function commit() {
    if (isCancelling.current) {
      isCancelling.current = false
      setDraft(display(minutes))
      return
    }
    const text = draft.trim()
    if (text === '') {
      if (minutes !== null) onChange(null)
      return
    }
    const parsed = parseDuration(text)
    // Unreadable or too big: put back what was there rather than guess.
    if (parsed === null || parsed > MAX_ESTIMATE_MINUTES) {
      setDraft(display(minutes))
      return
    }
    // Normalise what was typed ("90" becomes "1h 30m"), even if unchanged.
    setDraft(display(parsed))
    if (parsed !== minutes) onChange(parsed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Blurring commits, through onBlur, so Enter and clicking away behave
    // the same way.
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      isCancelling.current = true
      event.currentTarget.blur()
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          aria-label="Estimate"
          placeholder="—"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-24 bg-transparent text-right text-sm text-bone placeholder-mute-2 outline-none"
        />
        {minutes !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-mono text-[10px] text-mute-2 hover:text-bone"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick}
            type="button"
            aria-pressed={pick === minutes}
            onClick={() => onChange(pick)}
            className={
              pick === minutes
                ? 'rounded-full border border-pure/36 px-2 py-0.5 font-mono text-[10px] text-bone'
                : 'rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] text-mute-2 hover:text-bone'
            }
          >
            {formatDuration(pick)}
          </button>
        ))}
      </div>
    </div>
  )
}
