import { createBrowserRouter } from 'react-router-dom'

// Every route in the app is declared here, and only here (see CLAUDE.md).
// The placeholder element below gets replaced once the tasks feature exists.
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <main className="flex min-h-screen items-center justify-center bg-ink text-bone">
        <p className="font-sans text-lg">Verso — scaffold running.</p>
      </main>
    ),
  },
])
