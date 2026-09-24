import type { Project } from '../../types/project'
import type { Task } from '../../types/task'
import TaskSummary from './TaskSummary'

type TaskDetailProps = {
  task: Task | null
  subtasks: Task[]
  projects: Project[]
  now: Date
  // The URL of the list being shown, so the task page's Back link can
  // return to it.
  returnTo: string
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
}

// The side panel on wide screens: a read-only summary of the selected task.
// Below `lg` it's hidden; the open row's "Go to task" leads to the page.
export default function TaskDetail({ task, ...summaryProps }: TaskDetailProps) {
  return (
    <aside className="hidden min-h-0 flex-col border-l border-hairline bg-ink-2 lg:flex">
      {task === null ? (
        <div className="flex-1 overflow-y-auto px-7 py-16 text-center">
          <p className="mb-1 font-serif text-xl text-bone">No task selected.</p>
          <span className="text-sm text-mute">
            Pick one from the list to see its detail.
          </span>
        </div>
      ) : (
        <TaskSummary key={task.id} task={task} {...summaryProps} />
      )}
    </aside>
  )
}
