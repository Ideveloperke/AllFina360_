import { bigserial, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { firms } from './firms';

/**
 * Append-only audit trail (who did what, when). Required for SEC/FINRA
 * recordkeeping - never update or delete rows from application code.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial({ mode: 'number' }).primaryKey(),
    firmId: uuid().references(() => firms.id, { onDelete: 'set null' }),
    actorId: text(),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.firmId, t.createdAt), index().on(t.entityType, t.entityId)],
);

export type AuditLog = typeof auditLogs.$inferSelect;
