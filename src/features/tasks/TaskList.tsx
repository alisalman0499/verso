import { useEffect, useRef, type KeyboardEvent } from 'react'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/time'
import {
  groupFlat,
  groupToday,
  groupUpcoming,
  type ListKey,
  type TaskGroup,
} from './grouping'
import TaskItem from './TaskItem'
import type { Task } from '../../types/task'

type TaskListProps = {
  listKey: ListKey
  listLabel: string
  tasks: Task[]
  selectedTaskId: string | null
  onSelectTask: (id: string) => void
  onToggleDone: (id: string) => void
  isComposerOpen: boolean
  onCloseComposer: () => void
  onAddTask: (title: string, scheduledAt: string) => void
}

export default function TaskList({
  listKey,
  listLabel,
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleDone,
  isComposerOpen,
  onCloseComposer,
  onAddTask,
}: TaskListProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isComposerOpen) titleRef.current?.focus()
  }, [isComposerOpen])

  function trySubmit() {
    const title = titleRef.current?.value.trim() ?? ''
    if (title === '') return

    // The date field defaults to now, but the user may have changed it —
    // an empty value (they cleared it) still falls back to now rather
    // than failing to create the task.
    const dateValue = dateRef.current?.value ?? ''
    const scheduledAt =
      dateValue === ''
        ? new Date().toISOString()
        : fromDatetimeLocalValue(dateValue)

    onAddTask(title, scheduledAt)
    if (titleRef.current) titleRef.current.value = ''
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      onCloseComposer()
      return
    }
    if (event.key === 'Enter') trySubmit()
  }

  let groups: TaskGroup[]
  if (listKey === 'today') groups = groupToday(tasks)
  else if (listKey === 'upcoming') groups = groupUpcoming(tasks)
  else groups = groupFlat(tasks)

  return (
    <div className="flex-1 overflow-y-auto px-11 pt-2 pb-20">
      {isComposerOpen && (
        <div className="mb-4 rounded-md border border-hairline bg-ink-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="h-[17px] w-[17px] flex-none rounded-[5px] border border-pure/16 opacity-40" />
            <input
              ref={titleRef}
              type="text"
              placeholder="What needs doing?"
              onKeyDown={handleComposerKeyDown}
              className="flex-1 text-bone placeholder-mute-2 outline-none"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 pl-[29px]">
            <input
              ref={dateRef}
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(new Date().toISOString())}
              onKeyDown={handleComposerKeyDown}
              className="font-mono text-[11px] text-mute outline-none [color-scheme:dark]"
            />
            <span className="flex-none font-mono text-[10px] text-mute-2">
              enter to add · esc to cancel
            </span>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-1 font-serif text-xl text-bone">Clear.</p>
          <span className="text-sm text-mute">
            Nothing in {listLabel.toLowerCase()}. Press{' '}
            <span className="font-mono">N</span> to add the first task.
          </span>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.label ?? 'all'} className="mt-6">
            {group.label !== null && (
              <div className="flex items-center gap-3 pb-1.5">
                <span className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
                  {group.label}
                </span>
                <i className="h-px flex-1 bg-hairline" />
                <span className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
                  {group.items.length}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onToggleDone={onToggleDone}
                  onSelect={onSelectTask}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
