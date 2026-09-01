import type { Task } from '../../types/task'
import { LISTS, tasksForList, type ListKey } from './grouping'

type SidebarProps = {
  tasks: Task[]
  activeList: ListKey
  onSelectList: (key: ListKey) => void
  now: Date
}

export default function Sidebar({
  tasks,
  activeList,
  onSelectList,
  now,
}: SidebarProps) {
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
          const isActive = list.key === activeList
          return (
            <button
              key={list.key}
              type="button"
              onClick={() => onSelectList(list.key)}
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
      </nav>
    </aside>
  )
}
