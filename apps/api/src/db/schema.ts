import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './authSchema'

export * from './authSchema'

// Column names are spelled out in snake_case (the Postgres convention) while
// the TypeScript properties stay camelCase. Drizzle maps between the two.

export const projectKind = pgEnum('project_kind', ['general', 'course'])
export const taskKind = pgEnum('task_kind', ['task', 'assignment'])
export const taskSource = pgEnum('task_source', [
  'user',
  'ai_breakdown',
  'ai_chat',
])

// timestamptz for every timestamp: Postgres stores an absolute instant, and
// the client decides which timezone to show it in.
const timestamptz = (name: string) => timestamp(name, { withTimezone: true })

const timestamps = {
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: projectKind('kind').notNull().default('general'),
    archivedAt: timestamptz('archived_at'),
    ...timestamps,
  },
  (t) => [
    index('projects_user_id_idx').on(t.userId),
    // Redundant as a uniqueness rule (id alone is unique) but required as the
    // target of the composite foreign key on tasks below.
    unique('projects_id_user_id_unique').on(t.id, t.userId),
  ],
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Deleting a user deletes everything they own, in one statement. That is
    // what account deletion (a GDPR requirement) relies on.
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id'),
    parentId: uuid('parent_id'),
    title: text('title').notNull(),
    notes: text('notes').notNull().default(''),
    kind: taskKind('kind').notNull().default('task'),
    dueAt: timestamptz('due_at'),
    scheduledAt: timestamptz('scheduled_at'),
    estimateMinutes: integer('estimate_minutes'),
    completedAt: timestamptz('completed_at'),
    position: integer('position').notNull().default(0),
    source: taskSource('source').notNull().default('user'),
    ...timestamps,
  },
  (t) => [
    // The query every list view runs: one user's tasks, open ones first,
    // ordered by deadline.
    index('tasks_user_id_completed_at_due_at_idx').on(
      t.userId,
      t.completedAt,
      t.dueAt,
    ),
    index('tasks_parent_id_idx').on(t.parentId),
    unique('tasks_id_user_id_unique').on(t.id, t.userId),

    // Composite foreign keys: (project_id, user_id) must match a project row
    // with the *same* user_id. The database itself refuses to attach a task
    // to another user's project, even if a service-layer check were missed.
    // While project_id is null, Postgres skips the check entirely.
    //
    // No onDelete action (Postgres' NO ACTION): deleting a project that
    // still has tasks is refused. What should happen to those tasks is not
    // decided yet, and this keeps that decision from being made by accident.
    foreignKey({
      name: 'tasks_project_fk',
      columns: [t.projectId, t.userId],
      foreignColumns: [projects.id, projects.userId],
    }),
    // Same rule for subtasks. Deleting a parent deletes its subtasks.
    foreignKey({
      name: 'tasks_parent_fk',
      columns: [t.parentId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete('cascade'),
  ],
)
