// Stand-in for real auth. Every Task needs a userId (see CLAUDE.md's data
// model), but there's no sign-in yet — so every task in this browser is
// owned by the same fake user. When Supabase auth lands, this constant is
// the one place that gets replaced with the actual signed-in user's id.
export const CURRENT_USER_ID = 'local-user'
