import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type MenuAction = {
  label: string
  onSelect: () => void
  // Keep the menu open after this is chosen — for a step like "Delete"
  // turning into "Confirm delete", which needs a second click in place.
  keepOpen?: boolean
}

type ActionMenuProps = {
  // What the menu is, for screen readers ("Task actions").
  label: string
  actions: MenuAction[]
  // Called whenever the menu closes, however it closed — so a caller can
  // disarm a half-finished confirmation.
  onClose?: () => void
}

// A "⋯" button that opens a short list of actions. Follows the usual menu
// conventions: the button announces that it opens a menu and whether it's
// open, focus moves into the menu when it opens, Escape closes it and hands
// focus back to the button, and clicking outside or tabbing away closes it.
export default function ActionMenu({
  label,
  actions,
  onClose,
}: ActionMenuProps) {
  const [isOpen, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  // A unique id per menu, so the button can point at the list it controls.
  const menuId = useId()

  function close({ returnFocus }: { returnFocus: boolean }) {
    setOpen(false)
    onClose?.()
    if (returnFocus) buttonRef.current?.focus()
  }

  // Focus the first action as soon as the menu appears.
  useEffect(() => {
    if (isOpen) firstItemRef.current?.focus()
  }, [isOpen])

  // A click anywhere outside closes the menu. Listening on the document is
  // the only way to hear about clicks that aren't on the menu itself; the
  // listener only exists while the menu is open.
  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return
      }
      setOpen(false)
      onClose?.()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, onClose])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      close({ returnFocus: true })
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      // Tabbing out of the menu closes it: focus moved somewhere that isn't
      // inside this component.
      onBlur={(event) => {
        const next = event.relatedTarget
        if (
          isOpen &&
          next instanceof Node &&
          !event.currentTarget.contains(next)
        ) {
          close({ returnFocus: false })
        }
      }}
      className="relative"
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => (isOpen ? close({ returnFocus: false }) : setOpen(true))}
        className="rounded-md px-1.5 py-0.5 font-mono text-sm leading-none tracking-widest text-mute-2 hover:bg-ink-3 hover:text-bone"
      >
        ⋯
      </button>

      {isOpen && (
        <ul
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute top-full right-0 z-10 mt-1.5 min-w-40 rounded-md border border-hairline bg-ink-3 py-1"
        >
          {actions.map((action, index) => (
            // Keyed by position, not label: when "Delete" becomes "Confirm
            // delete", it stays the same button and keeps keyboard focus.
            <li key={index} role="none">
              <button
                ref={index === 0 ? firstItemRef : undefined}
                type="button"
                role="menuitem"
                onClick={() => {
                  action.onSelect()
                  if (!action.keepOpen) close({ returnFocus: true })
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-bone hover:bg-ink-4 focus:bg-ink-4 focus:outline-none"
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
