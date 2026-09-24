import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Task, UpdateTaskInput } from '../../types/task'
import { applyPatch } from './applyPatch'
import { isDone } from './grouping'

// The cache key for the signed-in user's tasks. Also used as the mutation
// key, so the hook can ask "are any task changes still in flight?".
const TASKS_KEY = ['tasks']

// Server state lives in TanStack Query's cache, not in this hook. Every
// component that calls useTasks reads the same cached list, so there are no
// competing copies to overwrite each other.
export function useTasks() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: TASKS_KEY, queryFn: api.listTasks })

  function setTasks(update: (tasks: Task[]) => Task[]) {
    queryClient.setQueryData<Task[]>(TASKS_KEY, (previous) =>
      previous === undefined ? previous : update(previous),
    )
  }

  // Shared by the optimistic mutations below. Before the request goes out:
  // stop any refetch that could overwrite the optimistic change, remember
  // the current list, then apply the change locally.
  async function optimistically(update: (tasks: Task[]) => Task[]) {
    await queryClient.cancelQueries({ queryKey: TASKS_KEY })
    const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
    setTasks(update)
    return { previous }
  }

  function rollBack(context: { previous: Task[] | undefined } | undefined) {
    if (context?.previous !== undefined) {
      queryClient.setQueryData(TASKS_KEY, context.previous)
    }
  }

  // Two quick changes can overlap, and rolling one back restores a snapshot
  // that predates the other. So once the *last* in-flight change settles,
  // refetch the real list from the server.
  function resyncWhenIdle() {
    if (queryClient.isMutating({ mutationKey: TASKS_KEY }) === 1) {
      void queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    }
  }

  // Not optimistic: the server assigns the id, and a request to localhost or
  // a nearby region comes back before anyone notices the difference.
  const createMutation = useMutation({
    mutationKey: TASKS_KEY,
    mutationFn: api.createTask,
    onSuccess: (task) => setTasks((tasks) => [...tasks, task]),
  })

  const updateMutation = useMutation({
    mutationKey: TASKS_KEY,
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      api.updateTask(id, patch),
    onMutate: ({ id, patch }) =>
      optimistically((tasks) =>
        tasks.map((task) =>
          task.id === id ? applyPatch(task, patch, new Date()) : task,
        ),
      ),
    onError: (_error, _variables, context) => rollBack(context),
    onSettled: resyncWhenIdle,
  })

  const deleteMutation = useMutation({
    mutationKey: TASKS_KEY,
    mutationFn: api.deleteTask,
    // The database deletes a task's subtasks with it; the cache does the same
    // so they don't linger until the next refetch.
    onMutate: (id: string) =>
      optimistically((tasks) =>
        tasks.filter((task) => task.id !== id && task.parentId !== id),
      ),
    onError: (_error, _id, context) => rollBack(context),
    onSettled: resyncWhenIdle,
  })

  function addTask(
    title: string,
    scheduledAt: string,
    projectId: string | null,
    estimateMinutes: number | null = null,
  ) {
    createMutation.mutate({ title, scheduledAt, projectId, estimateMinutes })
  }

  // Subtasks have no Do on time of their own yet, and the server gives them
  // their parent's project.
  function addSubtask(
    parentId: string,
    title: string,
    estimateMinutes: number | null,
  ) {
    createMutation.mutate({ title, parentId, estimateMinutes })
  }

  function updateTask(id: string, patch: UpdateTaskInput) {
    updateMutation.mutate({ id, patch })
  }

  function toggleDone(id: string) {
    // Reads the cache, not the last render, so two quick clicks toggle
    // twice instead of sending "complete" twice.
    const task = queryClient
      .getQueryData<Task[]>(TASKS_KEY)
      ?.find((candidate) => candidate.id === id)
    if (task !== undefined) updateTask(id, { completed: !isDone(task) })
  }

  function deleteTask(id: string) {
    deleteMutation.mutate(id)
  }

  return {
    tasks: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    retry: () => void query.refetch(),
    addTask,
    addSubtask,
    toggleDone,
    deleteTask,
    updateTask,
  }
}
