import type { ComponentProps } from 'react'

type FieldProps = ComponentProps<'input'> & {
  label: string
}

// A labelled input. Wrapping the input in its <label> ties the two together
// for screen readers and makes the label text clickable, with no id needed.
export default function Field({ label, ...inputProps }: FieldProps) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
        {label}
      </span>
      <input
        {...inputProps}
        className="mt-2 w-full border-b border-hairline bg-transparent pb-2 text-bone placeholder-mute-2 outline-none focus:border-mute"
      />
    </label>
  )
}
