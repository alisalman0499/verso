import { RouterProvider } from 'react-router-dom'
import { router } from './router'

// App is just the shell: it hands control straight to the router.
// Page content and layout come from whatever route is active.
export default function App() {
  return <RouterProvider router={router} />
}
