import { useEffect, useState } from 'react'
import { CURRENT_USER_ID } from '../../lib/currentUser'
import { getTasks, saveTasks } from '../../lib/storage'
import type { Task } from '../../types/task'

// The shape updateTask accepts: one function for every editable field,
// instead of a setter per field. `Partial<...>` makes each key optional so
// a caller passes only what changed; `Omit<...>` drops the four fields
// nothing may edit — identity and timestamps are ours to manage.
export type TaskPatch = Partial<
  Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => getTasks())

  // Whatever the tasks look like after a change, persist all of them.
  // storage.ts stays a dumb "read the list / write the list" boundary —
  // this is where the actual mutation logic lives.
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function addTask(title: string, scheduledAt: string) {
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      userId: CURRENT_USER_ID,
      title,
      notes: '',
      projectId: null,
      scheduledAt,
      estimateMinutes: null,
      done: false,
      createdAt: now,
      updatedAt: now,
    }
    setTasks((prev) => [...prev, task])
  }

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, done: !task.done, updatedAt: new Date().toISOString() }
          : task,
      ),
    )
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  function updateTask(id: string, patch: TaskPatch) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, ...patch, updatedAt: new Date().toISOString() }
          : task,
      ),
    )
  }

  return { tasks, addTask, toggleDone, deleteTask, updateTask }
}
