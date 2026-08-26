import { createBrowserRouter } from 'react-router-dom'
import TasksPage from '../features/tasks/TasksPage'

// Every route in the app is declared here, and only here (see CLAUDE.md).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <TasksPage />,
  },
])
