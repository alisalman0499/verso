import type { ReactNode } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { returnPathFrom } from '../../lib/returnPath'
import { subtasksOf } from './grouping'
import TaskEditor from './TaskEditor'
import { useNow } from './useNow'
import { useProjects } from './useProjects'
import { useTasks } from './useTasks'

// One task on its own page, at /tasks/:taskId. The same editor as the side
// panel, with room to breathe — and the only way to edit a task on a phone,
// where the panel is hidden. The AI chat about a task (Step 5) will live here.
export default function TaskPage() {
  const { taskId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const now = useNow()
  const {
    tasks,
    isLoading,
    isError,
    retry,
    addSubtask,
    toggleDone,
    deleteTask,
    updateTask,
  } = useTasks()
  const { projects } = useProjects()

  const backTo = returnPathFrom(location.state)
  const task = tasks.find((candidate) => candidate.id === taskId)

  const backLink = (
    <Link
      to={backTo}
      className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase hover:text-bone"
    >
      ← Back
    </Link>
  )

  function message(title: string, action: ReactNode) {
    return (
      <div className="min-h-dvh bg-ink px-7 py-6 text-bone">
        {backLink}
        <div className="py-24 text-center">
          <p className="mb-1 font-serif text-xl text-bone">{title}</p>
          {action}
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="min-h-dvh bg-ink" />

  if (isError) {
    return message(
      'Couldn’t load this task.',
      <button
        type="button"
        onClick={retry}
        className="text-sm text-mute underline-offset-4 hover:text-bone hover:underline"
      >
        Try again
      </button>,
    )
  }

  if (task === undefined) {
    return message(
      'This task doesn’t exist.',
      <span className="text-sm text-mute">
        It may have been deleted, or the link is wrong.
      </span>,
    )
  }

  // Subtasks don't get pages of their own: show the task they belong to.
  if (task.parentId !== null) {
    return (
      <Navigate to={`/tasks/${task.parentId}`} replace state={location.state} />
    )
  }

  return (
    <div className="h-dvh bg-ink text-bone">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <header className="flex-none px-7 pt-6">{backLink}</header>
        <TaskEditor
          key={task.id}
          task={task}
          subtasks={subtasksOf(tasks, task.id)}
          projects={projects}
          onToggleDone={toggleDone}
          onDelete={(id) => {
            deleteTask(id)
            // The page would have nothing to show; go back to the list.
            navigate(backTo, { replace: true })
          }}
          onUpdateTask={updateTask}
          onAddSubtask={addSubtask}
          onDeleteSubtask={deleteTask}
          now={now}
        />
      </div>
    </div>
  )
}
