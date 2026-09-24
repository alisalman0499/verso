import nodemailer from 'nodemailer'
import { env } from '../env'

export type Email = {
  to: string
  subject: string
  text: string
}

// Emails "sent" while running tests. Nothing leaves the process; a test reads
// the verification or reset link out of here and follows it, the way a user
// would click it.
export const testOutbox: Email[] = []

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
})

export async function sendEmail(email: Email): Promise<void> {
  if (env.NODE_ENV === 'test') {
    testOutbox.push(email)
    return
  }
  await transport.sendMail({ from: env.MAIL_FROM, ...email })
}
