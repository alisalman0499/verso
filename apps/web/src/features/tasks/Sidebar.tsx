import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Chevron from '../../components/Chevron'
import { authClient } from '../../lib/authClient'
import type { Project } from '../../types/project'
import type { Task } from '../../types/task'
import { LISTS, openTaskCount, pathForView, tasksForList } from './grouping'

// One look for every link in the nav; NavLink says which one is the page
// you're on.
function navItemClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'flex w-full items-center gap-3 rounded-md bg-ink-4 px-3 py-2 text-left text-pure'
    : 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-mute hover:bg-ink-3 hover:text-bone'
}

type SidebarProps = {
  tasks: Task[]
  projects: Project[]
  onAddProject: (name: string) => void
  now: Date
}

export default function Sidebar({
  tasks,
  projects,
  onAddProject,
  now,
}: SidebarProps) {
  const [isTasksOpen, setTasksOpen] = useState(true)
  const [isProjectsOpen, setProjectsOpen] = useState(true)
  const [isAddingProject, setAddingProject] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAddingProject) nameRef.current?.focus()
  }, [isAddingProject])

  function trySubmit() {
    const name = nameRef.current?.value.trim() ?? ''
    if (name !== '') onAddProject(name)
    setAddingProject(false)
  }

  async function handleSignOut() {
    await authClient.signOut()
    // Drop every cached query, not just the session: the next person to sign
    // in on this browser must never see a flash of the previous user's tasks.
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden min-h-0 flex-col border-r border-hairline bg-ink-2 md:flex">
      <div className="flex items-baseline gap-2 px-6 py-6">
        <h1 className="font-serif text-2xl text-pure">Verso</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {/* Views of your time rather than lists of tasks, so they sit apart,
            above Tasks. These are links, not buttons: each one is a page
            with its own URL. `end` keeps Overview from matching every path,
            since they all start with "/". */}
        <div className="mt-12">
          <NavLink to="/" end className={navItemClass}>
            <span className="flex-1 text-sm">Overview</span>
          </NavLink>
          <NavLink to="/calendar" className={navItemClass}>
            <span className="flex-1 text-sm">Calendar</span>
          </NavLink>
        </div>

        {/* Tasks is both a page (every task, the 'all' list) and the
            heading of the narrower lists, so the row has two targets: the
            name opens the page, the chevron folds the section. The chevron
            sits on top of the link rather than inside it, because a button
            can't go inside a link; `group` lights the whole row either way.
            No count: the chevron takes the count column, as on Projects. */}
        <div className="group relative mt-4">
          <NavLink
            to={pathForView({ type: 'list', key: 'all' })}
            className={(state) =>
              state.isActive
                ? navItemClass(state)
                : `${navItemClass(state)} group-hover:bg-ink-3 group-hover:text-bone`
            }
          >
            <span className="flex-1 text-sm">Tasks</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setTasksOpen((open) => !open)}
            aria-expanded={isTasksOpen}
            aria-label="Task lists"
            className="absolute inset-y-0 right-0 flex items-center px-3"
          >
            <Chevron isOpen={isTasksOpen} />
          </button>
        </div>
        {isTasksOpen && (
          <div className="pl-3">
            {LISTS.filter((list) => list.key !== 'all').map((list) => {
              const count = tasksForList(tasks, list.key, now).length
              return (
                <NavLink
                  key={list.key}
                  to={pathForView({ type: 'list', key: list.key })}
                  className={navItemClass}
                >
                  <span className="flex-1 text-sm">{list.label}</span>
                  <span className="font-mono text-[11px] text-mute-2">
                    {count}
                  </span>
                </NavLink>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setProjectsOpen((open) => !open)}
          aria-expanded={isProjectsOpen}
          className="mt-2 flex w-full items-center justify-between px-3 pb-2 pt-4 font-mono text-[10px] tracking-[0.16em] text-mute uppercase"
        >
          <span>Projects</span>
          <Chevron isOpen={isProjectsOpen} />
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
              return (
                <NavLink
                  key={project.id}
                  to={pathForView({ type: 'project', projectId: project.id })}
                  className={navItemClass}
                >
                  {({ isActive }) => (
                    <>
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
                    </>
                  )}
                </NavLink>
              )
            })}
          </>
        )}
      </nav>

      <div className="flex-none border-t border-hairline px-3 py-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-mute-2 hover:bg-ink-3 hover:text-mute"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
