import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authClient } from '../../lib/authClient'
import AuthLayout from './AuthLayout'
import { genericAuthError } from './authErrors'
import Field from './Field'
import SubmitButton from './SubmitButton'

type Status =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'error'; message: string }
  | { type: 'done' }

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  const signInLink = (
    <Link to="/login" className="text-bone hover:text-pure">
      Back to sign in
    </Link>
  )

  // No token, or the API sent ?error=... because the link expired or was
  // already used.
  if (token === null || searchParams.get('error') !== null) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="Reset links work once, for an hour."
        footer={signInLink}
      >
        <Link
          to="/forgot-password"
          className="text-sm text-bone hover:text-pure"
        >
          Send a new link
        </Link>
      </AuthLayout>
    )
  }

  if (status.type === 'done') {
    return (
      <AuthLayout
        title="Password changed"
        subtitle="You've been signed out on every other device."
        footer={signInLink}
      >
        {null}
      </AuthLayout>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (token === null) return
    setStatus({ type: 'submitting' })
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    if (error === null) setStatus({ type: 'done' })
    else if (error.status === 400) {
      setStatus({
        type: 'error',
        message: 'This link has expired. Ask for a new one.',
      })
    } else setStatus({ type: 'error', message: genericAuthError(error) })
  }

  return (
    <AuthLayout title="Choose a new password" footer={signInLink}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          placeholder="At least 10 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {status.type === 'error' && (
          <p role="alert" className="text-sm text-bone">
            {status.message}
          </p>
        )}
        <SubmitButton
          label="Change password"
          pendingLabel="Saving…"
          isPending={status.type === 'submitting'}
        />
      </form>
    </AuthLayout>
  )
}
