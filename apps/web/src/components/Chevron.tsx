// The small ⌄ on a section that folds open and shut. It points down while
// the section is open and right while it's folded.
export default function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={
        isOpen
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
  )
}
