import { formatTime } from '../../../lib/time'
import { isDone } from '../grouping'
import type { CalendarEntry } from './calendarLayout'

type AgendaEntryProps = {
  entry: CalendarEntry
  onOpen: (id: string) => void
}

// A row in the phone calendar's day lists: the time (or "due") on the
// left, the title beside it. Phones have no side panel, so opening one
// goes to the task's page.
export default function AgendaEntry({ entry, onOpen }: AgendaEntryProps) {
  const { task, kind, at } = entry
  const done = isDone(task)
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex w-full items-baseline gap-3 rounded-md px-2 py-2 text-left hover:bg-ink-2"
    >
      <span className="w-12 flex-none font-mono text-[11px] text-mute">
        {formatTime(at)}
      </span>
      <span
        className={
          done
            ? 'flex-1 truncate text-mute-2 line-through'
            : 'flex-1 truncate text-bone'
        }
      >
        {task.title}
      </span>
      {kind === 'due' && (
        <span className="flex-none rounded-[4px] border border-pure/16 px-1.5 font-mono text-[10px] text-mute">
          due
        </span>
      )}
      {done && <span className="sr-only">, done</span>}
    </button>
  )
}
