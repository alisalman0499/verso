import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../types/project'
import type { Task } from '../../types/task'
import { LISTS, openTaskCount, tasksForList, type View } from './grouping'

type SidebarProps = {
  tasks: Task[]
  projects: Project[]
  activeView: View
  onSelectView: (view: View) => void
  onAddProject: (name: string) => void
  now: Date
}

export default function Sidebar({
  tasks,
  projects,
  activeView,
  onSelectView,
  onAddProject,
  now,
}: SidebarProps) {
  const [isProjectsOpen, setProjectsOpen] = useState(true)
  const [isAddingProject, setAddingProject] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAddingProject) nameRef.current?.focus()
  }, [isAddingProject])

  function trySubmit() {
    const name = nameRef.current?.value.trim() ?? ''
    if (name !== '') onAddProject(name)
    setAddingProject(false)
  }

  return (
    <aside className="hidden min-h-0 flex-col border-r border-hairline bg-ink-2 md:flex">
      <div className="flex items-baseline gap-2 px-6 py-6">
        <h1 className="font-serif text-2xl text-pure">Verso</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="px-3 pb-2 pt-4 font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
          Lists
        </div>
        {LISTS.map((list) => {
          const count = tasksForList(tasks, list.key, now).length
          const isActive =
            activeView.type === 'list' && activeView.key === list.key
          return (
            <button
              key={list.key}
              type="button"
              onClick={() => onSelectView({ type: 'list', key: list.key })}
              className={
                isActive
                  ? 'flex w-full items-center gap-3 rounded-md bg-ink-4 px-3 py-2 text-left text-pure'
                  : 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-mute hover:bg-ink-3 hover:text-bone'
              }
            >
              <span className="flex-1 text-sm">{list.label}</span>
              <span className="font-mono text-[11px] text-mute-2">{count}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setProjectsOpen((open) => !open)}
          aria-expanded={isProjectsOpen}
          className="mt-2 flex w-full items-center justify-between px-3 pb-2 pt-4 font-mono text-[10px] tracking-[0.16em] text-mute uppercase"
        >
          <span>Projects</span>
          <svg
            viewBox="0 0 10 10"
            className={
              isProjectsOpen
                ? 'h-[7px] w-[7px] fill-none stroke-mute'
                : 'h-[7px] w-[7px] -rotate-90 fill-none stroke-mute'
            }
          >
            <path
              d="M2 3.5 5 6.5 8 3.5"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isProjectsOpen && (
          <>
            {isAddingProject ? (
              <div className="flex items-center rounded-md px-3 py-2">
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="Project name"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setAddingProject(false)
                    if (event.key === 'Enter') trySubmit()
                  }}
                  className="flex-1 bg-transparent text-sm text-bone placeholder-mute-2 outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingProject(true)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-mute-2 hover:bg-ink-3 hover:text-mute"
              >
                <span className="text-sm">+ New project</span>
              </button>
            )}

            {projects.map((project) => {
              const count = openTaskCount(tasks, project.id)
              const isActive =
                activeView.type === 'project' &&
                activeView.projectId === project.id
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    onSelectView({ type: 'project', projectId: project.id })
                  }
                  className={
                    isActive
                      ? 'flex w-full items-center gap-3 rounded-md bg-ink-4 px-3 py-2 text-left text-pure'
                      : 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-mute hover:bg-ink-3 hover:text-bone'
                  }
                >
                  <span
                    className={
                      isActive
                        ? 'h-[7px] w-[7px] flex-none rounded-[2px] border border-pure bg-pure'
                        : 'h-[7px] w-[7px] flex-none rounded-[2px] border border-pure/16'
                    }
                  />
                  <span className="flex-1 truncate text-sm">
                    {project.name}
                  </span>
                  <span className="font-mono text-[11px] text-mute-2">
                    {count}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
