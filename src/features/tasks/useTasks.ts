import { useEffect, useState } from 'react'
import { CURRENT_USER_ID } from '../../lib/currentUser'
import { getTasks, saveTasks } from '../../lib/storage'
import type { Task } from '../../types/task'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => getTasks())

  // Whatever the tasks look like after a change, persist all of them.
  // storage.ts stays a dumb "read the list / write the list" boundary —
  // this is where the actual mutation logic lives.
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function addTask(title: string) {
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      userId: CURRENT_USER_ID,
      title,
      notes: '',
      projectId: null,
      scheduledAt: null,
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

  function setScheduledAt(id: string, scheduledAt: string | null) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, scheduledAt, updatedAt: new Date().toISOString() }
          : task,
      ),
    )
  }

  return { tasks, addTask, toggleDone, deleteTask, setScheduledAt }
}
