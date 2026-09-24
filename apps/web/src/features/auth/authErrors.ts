// What to tell the person when an auth request fails in a way that isn't
// specific to one screen.
export function genericAuthError(error: { status: number }): string {
  if (error.status === 429) {
    return 'Too many attempts. Wait a minute, then try again.'
  }
  return 'Something went wrong. Try again.'
}
