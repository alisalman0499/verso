import { useEffect, useState } from 'react'
import { CURRENT_USER_ID } from '../../lib/currentUser'
import { getProjects, saveProjects } from '../../lib/storage'
import type { Project } from '../../types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => getProjects())

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  function addProject(name: string) {
    const now = new Date().toISOString()
    const project: Project = {
      id: crypto.randomUUID(),
      userId: CURRENT_USER_ID,
      name,
      createdAt: now,
      updatedAt: now,
    }
    setProjects((prev) => [...prev, project])
  }

  return { projects, addProject }
}
