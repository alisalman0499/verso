import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/client'
import * as schema from '../db/schema'
import { sendEmail } from '../email/mailer'
import { env } from '../env'

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),

  emailAndPassword: {
    enabled: true,
    // No session until the address is verified: a SaaS needs to know it can
    // reach the account owner (password resets, billing) before anything else.
    requireEmailVerification: true,
    minPasswordLength: 10,
    // A password reset signs out every other device — if the reset happened
    // because the password leaked, those sessions may not be the owner's.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Verso password',
        text: `Someone asked to reset the password for this address.\n\nIf it was you, open this link within the hour:\n${url}\n\nIf it wasn't, ignore this email — nothing changes.`,
      })
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Confirm your email for Verso',
        text: `Welcome to Verso.\n\nConfirm your email address by opening this link within the hour:\n${url}`,
      })
    },
  },

  // Limits requests per IP on the auth endpoints (sign-in attempts, reset
  // requests). Stored in Postgres rather than memory, so the counts survive
  // restarts and are shared once there is more than one API instance.
  // Production only: it would get in the way of manual testing and tests.
  rateLimit: {
    enabled: env.NODE_ENV === 'production',
    storage: 'database',
  },
})
