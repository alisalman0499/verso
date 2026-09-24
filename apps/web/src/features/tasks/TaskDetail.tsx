import { Link } from 'react-router-dom'
import type { Project } from '../../types/project'
import type { Task, UpdateTaskInput } from '../../types/task'
import TaskEditor from './TaskEditor'

type TaskDetailProps = {
  task: Task | null
  subtasks: Task[]
  projects: Project[]
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, patch: UpdateTaskInput) => void
  onAddSubtask: (
    parentId: string,
    title: string,
    estimateMinutes: number | null,
  ) => void
  onDeleteSubtask: (id: string) => void
  now: Date
  // The URL of the list being shown, so the task page's Back link can
  // return to it.
  returnTo: string
}

// The side panel on wide screens. Below `lg` it's hidden; phones open a
// task's own page instead.
export default function TaskDetail({
  task,
  returnTo,
  ...editorProps
}: TaskDetailProps) {
  if (task === null) {
    return (
      <aside className="hidden min-h-0 flex-col border-l border-hairline bg-ink-2 lg:flex">
        <div className="flex-1 overflow-y-auto px-7 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-bone">No task selected.</p>
          <span className="text-sm text-mute">
            Pick one from the list to see its detail.
          </span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden min-h-0 flex-col border-l border-hairline bg-ink-2 lg:flex">
      <TaskEditor
        key={task.id}
        task={task}
        {...editorProps}
        headerAction={
          <Link
            to={`/tasks/${task.id}`}
            state={{ from: returnTo }}
            className="font-mono text-[10px] tracking-[0.14em] text-mute-2 uppercase hover:text-bone"
          >
            Open page ↗
          </Link>
        }
      />
    </aside>
  )
}
