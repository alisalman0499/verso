# Verso

A web-based task manager. Personal project, built to a high standard.

## Context for you (Claude)

The owner is a first-year datamatiker student with Java/OOP fundamentals and
limited JavaScript, React, and CSS experience. They are learning to direct
agentic development, not to type every line themselves.

This means:

- **Explain your choices.** When you introduce a pattern, a library, or a
  language feature they may not know, say what it does and why you reached for
  it. One or two sentences, inline — not a tutorial.
- **Do not silently make architectural decisions.** If a task requires a
  decision not covered by this file, stop and ask.
- **Prefer the boring, readable solution** over the clever one. Code that has to
  be explained twice is the wrong code for this project.
- **Never say a change is complete without saying what you actually changed.**

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Router
- Local storage for persistence (Supabase planned later — do not add it yet)

Do not add dependencies without asking. Do not introduce Next.js, Redux,
styled-components, or a component library. Docker is deliberately out of scope
for now.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build (must pass before any commit)
npm run lint      # ESLint
```

## Structure

```
src/
  app/          shell, router, auth guard
  components/   shared UI — no domain knowledge
  features/     one folder per domain (auth, tasks)
  lib/          pure functions, no React
  styles/
```

### Structural rules

1. **Features never import from other features.** If `auth` and `tasks` both
   need something, lift it to `components/` or `lib/`.
2. **`components/` stays domain-agnostic.** A component that knows what a Task
   is belongs in `features/tasks/`.
3. **`lib/` contains no React.** No hooks, no JSX, no component imports.
4. **All routes are declared in `app/router.tsx`.** Never register a route
   anywhere else.

## Conventions

- Components: `PascalCase.tsx`, one component per file, default export.
- Hooks: `useThing.ts`, named export.
- Everything else: `camelCase.ts`.
- Types live in the feature's `types.ts`; shared types in `src/types/`.
- No `any`. No `as` casts to silence the compiler. If types fight you, the model
  is wrong — say so rather than working around it.
- No inline styles and no separate CSS files. Tailwind only.
- Use the theme tokens (`bg-ink`, `text-bone`, `border-hairline`), never raw hex
  or arbitrary values like `bg-[#09090B]`.

## Data model

Every task carries an owner from day one, even though there is no server yet.

```ts
type Task = {
  id: string;
  userId: string;
  title: string;
  notes: string;
  projectId: string | null;
  scheduledAt: string | null;  // ISO 8601
  estimateMinutes: number | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Dates are ISO 8601 strings in storage, converted at the edges. Never store a
`Date` object.

## Persistence

All reads and writes go through `lib/storage.ts`. No component or hook touches
`localStorage` directly. This boundary is what makes the Supabase migration a
contained change — do not breach it.

## Design

The visual design is settled: near-black surfaces, bone-white text, no accent
colour. White is the accent and is used sparingly — primary buttons, the
now-line, checked checkboxes. Do not introduce colour, gradients, or shadows.
Do not redesign components while implementing features.

## Working agreement

- **Plan before editing.** For anything beyond a one-file change, propose the
  approach and wait for approval.
- **One feature per session.** Do not opportunistically refactor unrelated code.
- **Small commits**, present tense, describing the change: `Add task editing`.
- Never edit `package-lock.json` by hand.
- Never commit `.env` files or keys.
- If you are unsure what the owner wants, ask. A question costs less than a
  wrong implementation.
