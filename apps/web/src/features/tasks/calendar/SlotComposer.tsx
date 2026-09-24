import { useEffect, useRef, type KeyboardEvent } from 'react'
import { formatFullDateTime, splitTrailingDuration } from '../../../lib/time'

type SlotComposerProps = {
  // When the new task is for: its Do on time, as an ISO string.
  at: string
  onSubmit: (title: string, estimateMinutes: number | null) => void
  onClose: () => void
  now: Date
}

// The little box that opens where you click an empty slot in the week view.
// A duration at the end of the title ("Essay draft 1h") becomes the task's
// estimate, as it does when typing steps, so the block is the right length.
export default function SlotComposer({
  at,
  onSubmit,
  onClose,
  now,
}: SlotComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      // Don't let the page's own Escape handling see this one too.
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key === 'Enter') {
      const { title, minutes } = splitTrailingDuration(
        event.currentTarget.value,
      )
      if (title === '') return
      onSubmit(title, minutes)
    }
  }

  return (
    <div
      // Clicks inside the box mustn't reach the day column underneath, which
      // would read them as a click on another empty slot.
      onClick={(event) => event.stopPropagation()}
      className="w-56 rounded-md border border-hairline bg-ink-3 px-3 py-2.5"
    >
      <div className="font-mono text-[10px] text-mute">
        {formatFullDateTime(at, now)}
      </div>
      <input
        ref={inputRef}
        type="text"
        aria-label="New task title"
        placeholder="What needs doing?"
        onKeyDown={handleKeyDown}
        // Leaving the box (clicking elsewhere, tabbing away) cancels it.
        onBlur={onClose}
        className="mt-1 w-full bg-transparent text-sm text-bone placeholder-mute-2 outline-none"
      />
      <div className="mt-1.5 font-mono text-[10px] text-mute-2">
        enter to add · esc to cancel
      </div>
    </div>
  )
}
