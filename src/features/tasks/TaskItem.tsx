import type { Task } from '../../types/task'

type TaskItemProps = {
  task: Task
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({
  task,
  onToggleDone,
  onDelete,
}: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 border-b border-hairline py-3">
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggleDone(task.id)}
        className="h-4 w-4 accent-pure"
      />
      <span
        className={
          task.done ? 'flex-1 text-mute line-through' : 'flex-1 text-bone'
        }
      >
        {task.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="text-sm text-mute hover:text-bone"
      >
        Delete
      </button>
    </li>
  )
}
