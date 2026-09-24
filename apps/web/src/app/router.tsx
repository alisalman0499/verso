import { createBrowserRouter } from 'react-router-dom'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import LoginPage from '../features/auth/LoginPage'
import ResetPasswordPage from '../features/auth/ResetPasswordPage'
import SignupPage from '../features/auth/SignupPage'
import TasksPage from '../features/tasks/TasksPage'
import RequireAuth from './RequireAuth'

// Every route in the app is declared here, and only here (see CLAUDE.md).
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    // A layout route with no path: its children only render once
    // RequireAuth has confirmed a session.
    element: <RequireAuth />,
    children: [{ path: '/', element: <TasksPage /> }],
  },
])
