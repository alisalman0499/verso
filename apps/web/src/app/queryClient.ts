import { QueryClient } from '@tanstack/react-query'

// One cache for all server data in the app. Components that ask for the
// same query key share the same data and the same request, which is what
// lets several parts of the page read tasks without holding copies.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data counts as fresh for 30 seconds: switching views or remounting
      // a component within that window reuses the cache instead of refetching.
      staleTime: 30_000,
    },
  },
})
