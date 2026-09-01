import { useEffect, useState } from 'react'
import DayRail from './DayRail'
import { LISTS, tasksForList, tasksForView, type View } from './grouping'
import Sidebar from './Sidebar'
import TaskDetail from './TaskDetail'
import TaskList from './TaskList'
import { useProjects } from './useProjects'
import { useTasks } from './useTasks'

export default function TasksPage() {
  const { tasks, addTask, toggleDone, deleteTask, updateTask } = useTasks()
  const { projects, addProject } = useProjects()
  const [view, setView] = useState<View>({ type: 'list', key: 'today' })
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isComposerOpen, setComposerOpen] = useState(false)

  // The one clock for the whole page: held in state and ticked on a timer,
  // rather than `new Date()` read fresh in every component that needs it.
  // Reading it fresh looks harmless but means nothing re-renders on its own
  // at midnight — the Today list would keep yesterday's contents until the
  // user happened to click something.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const visibleTasks = tasksForView(tasks, view, now)
  const listLabel =
    view.type === 'list'
      ? (LISTS.find((list) => list.key === view.key)?.label ?? '')
      : (projects.find((project) => project.id === view.projectId)?.name ?? '')
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const isTodayView = view.type === 'list' && view.key === 'today'

  // The tally counts exactly what the Today list shows, so the numbers in
  // the header always agree with the rows on screen.
  const todaysTasks = tasksForList(tasks, 'today', now)
  const doneToday = todaysTasks.filter((task) => task.done).length

  // "N" opens the composer from anywhere except while typing; Escape closes it.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (event.key === 'Escape') setComposerOpen(false)
      // Ignore Ctrl+N / Cmd+N — that's the browser's "new window".
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey
      if (!isTyping && !hasModifier && event.key.toLowerCase() === 'n') {
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
    <div className="grid h-dvh grid-cols-1 bg-ink text-bone md:grid-cols-[254px_minmax(0,1fr)] lg:grid-cols-[254px_minmax(0,1fr)_348px]">
      <Sidebar
        tasks={tasks}
        projects={projects}
        activeView={view}
        onSelectView={setView}
        onAddProject={addProject}
        now={now}
      />

      <main className="flex min-h-0 min-w-0 flex-col">
        <div className="flex-none px-5 pt-8 lg:px-11">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
                {isTodayView
                  ? now.toLocaleDateString('en-GB', { weekday: 'long' })
                  : 'List'}
              </div>
              <h2 className="mt-1.5 font-serif text-[clamp(34px,4.2vw,52px)] leading-none tracking-tight text-pure">
                {isTodayView ? (
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
            {/* ml-auto rather than relying on the parent's justify-between:
                that only spaces items apart when they share a line. Below
                ~500px this row wraps and the tally+button become the only
                thing on their line — without ml-auto they'd snap to the
                left edge instead of staying right-aligned. */}
            <div className="ml-auto flex items-center gap-3.5 pb-1.5">
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

          <DayRail tasks={tasks} now={now} />
        </div>

        <TaskList
          view={view}
          listLabel={listLabel}
          tasks={visibleTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onToggleDone={toggleDone}
          isComposerOpen={isComposerOpen}
          onCloseComposer={() => setComposerOpen(false)}
          onAddTask={handleAddTask}
          now={now}
        />
      </main>

      <TaskDetail
        task={selectedTask}
        projects={projects}
        onToggleDone={toggleDone}
        onDelete={handleDeleteTask}
        onUpdateTask={updateTask}
        now={now}
      />
    </div>
  )
}
