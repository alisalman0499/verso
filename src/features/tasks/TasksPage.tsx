import { useEffect, useState } from 'react'
import { isSameDay } from '../../lib/time'
import DayRail from './DayRail'
import { LISTS, tasksForList, type ListKey } from './grouping'
import Sidebar from './Sidebar'
import TaskDetail from './TaskDetail'
import TaskList from './TaskList'
import { useTasks } from './useTasks'

export default function TasksPage() {
  const { tasks, addTask, toggleDone, deleteTask, setScheduledAt } = useTasks()
  const [view, setView] = useState<ListKey>('today')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isComposerOpen, setComposerOpen] = useState(false)

  const now = new Date()
  const visibleTasks = tasksForList(tasks, view, now)
  const listLabel = LISTS.find((list) => list.key === view)?.label ?? ''
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  const todaysTasks = tasks.filter(
    (task) =>
      task.scheduledAt !== null && isSameDay(new Date(task.scheduledAt), now),
  )
  const doneToday = todaysTasks.filter((task) => task.done).length

  // "N" opens the composer from anywhere except while typing; Escape closes it.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (event.key === 'Escape') setComposerOpen(false)
      if (!isTyping && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setComposerOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleAddTask(title: string, scheduledAt: string) {
    addTask(title, scheduledAt)
    setComposerOpen(false)
  }

  function handleDeleteTask(id: string) {
    deleteTask(id)
    setSelectedTaskId(null)
  }

  return (
    <div className="grid h-dvh grid-cols-[254px_minmax(0,1fr)_348px] bg-ink text-bone">
      <Sidebar tasks={tasks} activeList={view} onSelectList={setView} />

      <main className="flex min-h-0 min-w-0 flex-col">
        <div className="flex-none px-11 pt-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
                {view === 'today'
                  ? now.toLocaleDateString('en-GB', { weekday: 'long' })
                  : 'List'}
              </div>
              <h2 className="mt-1.5 font-serif text-[clamp(34px,4.2vw,52px)] leading-none tracking-tight text-pure">
                {view === 'today' ? (
                  <>
                    {now.getDate()}{' '}
                    <em className="text-bone">
                      {now.toLocaleDateString('en-GB', { month: 'long' })}
                    </em>
                  </>
                ) : (
                  <em className="text-bone">{listLabel}</em>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-3.5 pb-1.5">
              <span className="font-mono text-[11px] whitespace-nowrap text-mute">
                <b className="font-normal text-pure">{doneToday}</b> of{' '}
                {todaysTasks.length} done today
              </span>
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-pure px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
              >
                New task{' '}
                <span className="font-mono text-[10px] opacity-50">N</span>
              </button>
            </div>
          </div>

          <DayRail tasks={tasks} />
        </div>

        <TaskList
          listKey={view}
          listLabel={listLabel}
          tasks={visibleTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onToggleDone={toggleDone}
          isComposerOpen={isComposerOpen}
          onCloseComposer={() => setComposerOpen(false)}
          onAddTask={handleAddTask}
        />
      </main>

      <TaskDetail
        task={selectedTask}
        onToggleDone={toggleDone}
        onDelete={handleDeleteTask}
        onSetScheduledAt={setScheduledAt}
      />
    </div>
  )
}
