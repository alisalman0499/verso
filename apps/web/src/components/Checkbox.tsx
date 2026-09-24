type CheckboxProps = {
  checked: boolean
  onToggle: () => void
  // What pressing it does, read out by screen readers ("Mark done").
  label: string
  // 'md' for a task row, 'sm' for a subtask.
  size?: 'md' | 'sm'
}

const BOX = {
  md: 'h-[17px] w-[17px] rounded-[5px]',
  sm: 'h-[15px] w-[15px] rounded-[4px]',
}
const TICK = { md: 'h-[9px] w-[9px]', sm: 'h-[8px] w-[8px]' }

// The one checkbox style in the app: white when checked, a faint outline
// that brightens on hover (or when its row is hovered, via `group`) when not.
// A <button> rather than an <input type="checkbox">, so it can be styled
// fully. The label says what a press does ("Mark done" / "Mark not done"),
// which also tells a screen reader the current state.
export default function Checkbox({
  checked,
  onToggle,
  label,
  size = 'md',
}: CheckboxProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        // Checkboxes sit inside clickable rows; ticking one must not also
        // count as clicking the row.
        event.stopPropagation()
        onToggle()
      }}
      className={
        checked
          ? `flex ${BOX[size]} flex-none items-center justify-center border border-pure bg-pure`
          : `flex ${BOX[size]} flex-none items-center justify-center border border-pure/16 group-hover:border-pure/36 hover:border-pure/36`
      }
    >
      {checked && (
        <svg
          viewBox="0 0 10 10"
          className={`${TICK[size]} fill-none stroke-ink`}
        >
          <path
            d="M1.6 5.2 3.9 7.4 8.4 2.6"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
