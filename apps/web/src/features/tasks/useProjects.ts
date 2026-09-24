import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Project } from '../../types/project'

const PROJECTS_KEY = ['projects']

export function useProjects() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: PROJECTS_KEY, queryFn: api.listProjects })

  const createMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: (project) =>
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (previous) =>
        previous === undefined ? previous : [...previous, project],
      ),
  })

  function addProject(name: string) {
    createMutation.mutate({ name })
  }

  return { projects: query.data ?? [], addProject }
}
