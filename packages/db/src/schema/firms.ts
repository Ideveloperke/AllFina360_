import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_columns';

/** A firm (RIA / broker-dealer branch) is the tenant boundary for all data. */
export const firms = pgTable('firms', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  ...timestamps,
});

export type Firm = typeof firms.$inferSelect;
