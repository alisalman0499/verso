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

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ type: 'submitting' })
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      // Where the verification link sends the user once it has signed them
      // in. The login page forwards a signed-in user to the app.
      callbackURL: '/login',
    })
    setStatus(
      error === null
        ? { type: 'sent' }
        : { type: 'error', message: genericAuthError(error) },
    )
  }

  // Shown for an address that already has an account too: the API answers
  // sign-up the same way either way, so this page can't be used to find out
  // who has an account.
  if (status.type === 'sent') {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`We sent a link to ${email}. Open it within the hour to finish setting up your account.`}
        footer={
          <Link to="/login" className="text-bone hover:text-pure">
            Back to sign in
          </Link>
        }
      >
        {null}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Plan your week around what's actually due."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-bone hover:text-pure">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Name"
          autoComplete="given-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          label="Create account"
          pendingLabel="Creating…"
          isPending={status.type === 'submitting'}
        />
      </form>
    </AuthLayout>
  )
}
