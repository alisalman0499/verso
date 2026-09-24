import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '../../lib/authClient'
import AuthLayout from './AuthLayout'
import { genericAuthError } from './authErrors'
import Field from './Field'
import SubmitButton from './SubmitButton'

type Status =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'error'; message: string }
  | { type: 'sent' }

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ type: 'submitting' })
    const { error } = await authClient.requestPasswordReset({
      email,
      // The emailed link goes through the API, which redirects here with
      // ?token=... once it has checked the token is real.
      redirectTo: '/reset-password',
    })
    setStatus(
      error === null
        ? { type: 'sent' }
        : { type: 'error', message: genericAuthError(error) },
    )
  }

  const footer = (
    <Link to="/login" className="text-bone hover:text-pure">
      Back to sign in
    </Link>
  )

  // Worded as "if": the API gives the same answer whether or not the address
  // has an account, so nobody can use this form to check.
  if (status.type === 'sent') {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`If ${email} has an account, a reset link is on its way. It works for an hour.`}
        footer={footer}
      >
        {null}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email you a link to choose a new one."
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {status.type === 'error' && (
          <p role="alert" className="text-sm text-bone">
            {status.message}
          </p>
        )}
        <SubmitButton
          label="Send link"
          pendingLabel="Sending…"
          isPending={status.type === 'submitting'}
        />
      </form>
    </AuthLayout>
  )
}
