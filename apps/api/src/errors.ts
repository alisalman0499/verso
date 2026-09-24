// Errors the service layer throws. They describe what went wrong in domain
// terms; app.onError (in app.ts) is the one place that turns them into HTTP
// status codes. Services stay free of HTTP so the same functions can be
// called from somewhere other than a route — the AI's tools, later.

// The thing doesn't exist, or belongs to someone else. The two are
// deliberately indistinguishable, so a caller can't probe for other users'
// ids.
export class NotFoundError extends Error {}

// The request was well-formed but refers to something it may not, e.g. a
// project that isn't the caller's.
export class InvalidInputError extends Error {}
