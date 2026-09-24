import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router-dom'
import { fetchSession, SESSION_QUERY_KEY } from '../lib/authClient'

// Wraps every route that needs a signed-in user. It renders the matched
// child route (<Outlet />) only once a session is confirmed.
//
// This is a convenience, not the security boundary: the API refuses data
// requests without a session regardless of what the browser shows.
export default function RequireAuth() {
  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
  })

  if (session.isPending) return <div className="h-dvh bg-ink" />

  if (session.isError) {
    return (
      <div className="grid h-dvh place-items-center bg-ink px-5 text-center">
        <div>
          <p className="mb-1 font-serif text-xl text-bone">
            Can&rsquo;t reach Verso.
          </p>
          <button
            type="button"
            onClick={() => session.refetch()}
            className="text-sm text-mute underline-offset-4 hover:text-bone hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (session.data === null) return <Navigate to="/login" replace />

  return <Outlet />
}
