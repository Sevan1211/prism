import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const libraries = sqliteTable('sync_libraries', {
  id: text().primaryKey(), recoveryHash: text('recovery_hash').notNull(),
  head: integer().notNull().default(0), lastMutation: text('last_mutation'),
  created: integer().notNull(), deleted: integer().notNull().default(0),
})
export const devices = sqliteTable('sync_devices', {
  library: text().notNull(), id: text().notNull(), tokenHash: text('token_hash').notNull(),
  created: integer().notNull(), revoked: integer().notNull().default(0),
}, t => [primaryKey({ columns: [t.library, t.id] })])
export const objects = sqliteTable('sync_objects', {
  library: text().notNull(), id: text().notNull(), bytes: integer().notNull(),
}, t => [primaryKey({ columns: [t.library, t.id] })])
export const commits = sqliteTable('sync_commits', {
  library: text().notNull(), revision: integer().notNull(), mutation: text().notNull(),
  objects: text().notNull(), created: integer().notNull(),
}, t => [primaryKey({ columns: [t.library, t.revision] }), uniqueIndex('sync_mutation').on(t.library, t.mutation)])
export const limits = sqliteTable('sync_limits', {
  key: text().primaryKey(), count: integer().notNull(), expires: integer().notNull(),
})
