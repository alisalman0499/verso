import { useState, type FormEvent } from 'react'
import TaskItem from './TaskItem'
import { useTasks } from './useTasks'

export default function TasksPage() {
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    addTask(trimmed)
    setTitle('')
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-12 text-bone">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl">Verso</h1>

        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a task"
            className="flex-1 rounded border border-hairline bg-ink-2 px-3 py-2 text-bone placeholder-mute outline-none focus:border-mute"
          />
          <button type="submit" className="rounded bg-pure px-4 py-2 text-ink">
            Add
          </button>
        </form>

        {tasks.length === 0 ? (
          <p className="text-mute">No tasks yet.</p>
        ) : (
          <ul>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleDone={toggleDone}
                onDelete={deleteTask}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
