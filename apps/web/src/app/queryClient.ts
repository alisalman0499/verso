import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api'
import { SESSION_QUERY_KEY } from '../lib/authClient'

// A 401 from the API means the session ended (expired, or revoked by a
// password reset elsewhere). Refetching the session makes RequireAuth see
// that and send the user to /login, wherever the 401 came from.
function handleError(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
  }
}

// One cache for all server data in the app. Components that ask for the
// same query key share the same data and the same request, which is what
// lets several parts of the page read tasks without holding copies.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      // Data counts as fresh for 30 seconds: switching views or remounting
      // a component within that window reuses the cache instead of refetching.
      staleTime: 30_000,
      // Retrying can't fix a 4xx — the request itself is wrong, or the
      // session is gone. Retry network errors and 5xx a couple of times.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
})
