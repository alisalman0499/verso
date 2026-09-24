type SubmitButtonProps = {
  label: string
  pendingLabel: string
  isPending: boolean
}

export default function SubmitButton({
  label,
  pendingLabel,
  isPending,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-full bg-pure px-4 py-2.5 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? pendingLabel : label}
    </button>
  )
}
