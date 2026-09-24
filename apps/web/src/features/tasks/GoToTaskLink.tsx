import { Link } from 'react-router-dom'

// The way from a list row to the task's own page, where editing happens.
export default function GoToTaskLink({
  taskId,
  returnTo,
  className = '',
}: {
  taskId: string
  returnTo: string
  className?: string
}) {
  return (
    <Link
      to={`/tasks/${taskId}`}
      state={{ from: returnTo }}
      // The row itself is clickable; following the link shouldn't also
      // count as clicking the row.
      onClick={(event) => event.stopPropagation()}
      className={`${className} flex-none rounded-full border border-pure/16 px-2.5 py-0.5 text-xs whitespace-nowrap text-bone hover:border-pure/36`}
    >
      Go to task
    </Link>
  )
}
