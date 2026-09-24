import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  authClient,
  fetchSession,
  SESSION_QUERY_KEY,
} from '../../lib/authClient'
import AuthLayout from './AuthLayout'
import { genericAuthError } from './authErrors'
import Field from './Field'
import SubmitButton from './SubmitButton'

// Everything the form can be doing, as one value. A tagged union rather than
// several booleans, so impossible combinations (submitting *and* showing an
// error) can't be represented.
type Status =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'error'; message: string }
  | { type: 'unverified' }
  | { type: 'verificationResent' }

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  // The email verification link lands here. On success Better Auth has
  // already signed the user in and the redirect below takes over; on
  // failure (expired or reused link) it adds ?error=... to the URL.
  const linkFailed = searchParams.get('error') !== null

  if (session.data) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ type: 'submitting' })
    const { error } = await authClient.signIn.email({ email, password })
    if (error === null) {
      // Refetch the session so RequireAuth sees the new one, then go in.
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      navigate('/', { replace: true })
      return
    }
    if (error.status === 403) setStatus({ type: 'unverified' })
    else if (error.status === 401) {
      setStatus({ type: 'error', message: 'Wrong email or password.' })
    } else setStatus({ type: 'error', message: genericAuthError(error) })
  }

  async function resendVerification() {
    setStatus({ type: 'submitting' })
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/login',
    })
    setStatus(
      error === null
        ? { type: 'verificationResent' }
        : { type: 'error', message: genericAuthError(error) },
    )
  }

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-bone hover:text-pure">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {linkFailed && status.type === 'idle' && (
          <p role="alert" className="text-sm text-bone">
            That link has expired or was already used. Sign in to get a new one.
          </p>
        )}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {status.type === 'error' && (
          <p role="alert" className="text-sm text-bone">
            {status.message}
          </p>
        )}
        {status.type === 'unverified' && (
          <p role="alert" className="text-sm text-bone">
            Confirm your email first — check your inbox for the link.{' '}
            <button
              type="button"
              onClick={resendVerification}
              className="text-mute underline underline-offset-4 hover:text-bone"
            >
              Send it again
            </button>
          </p>
        )}
        {status.type === 'verificationResent' && (
          <p role="status" className="text-sm text-bone">
            Sent. The new link works for an hour.
          </p>
        )}

        <SubmitButton
          label="Sign in"
          pendingLabel="Signing in…"
          isPending={status.type === 'submitting'}
        />
        <Link
          to="/forgot-password"
          className="self-start text-sm text-mute hover:text-bone"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthLayout>
  )
}
