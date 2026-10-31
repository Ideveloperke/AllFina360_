import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_columns';
import { user } from './auth';
import { firms } from './firms';

/** An advisor's client (person or household contact). */
export const clients = pgTable(
  'clients',
  {
    id: uuid().primaryKey().defaultRandom(),
    firmId: uuid()
      .notNull()
      .references(() => firms.id, { onDelete: 'cascade' }),
    advisorId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    phone: text(),
    notes: text(),
    /** ID of the matching record in the firm's CRM (Salesforce, Wealthbox, Redtail). */
    crmExternalId: text(),
    ...timestamps,
  },
  (t) => [index().on(t.firmId), index().on(t.advisorId)],
);

export type Client = typeof clients.$inferSelect;
