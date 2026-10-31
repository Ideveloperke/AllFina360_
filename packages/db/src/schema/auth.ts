import { USER_ROLES } from '@allfina/shared';
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_columns';
import { firms } from './firms';

// Tables required by Better Auth (https://www.better-auth.com/docs/concepts/database).
// Property names must match Better Auth's field names; column names are snake_case.

export const user = pgTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  firmId: uuid().references(() => firms.id, { onDelete: 'set null' }),
  role: text({ enum: USER_ROLES }).notNull().default('advisor'),
  ...timestamps,
});

export const session = pgTable(
  'sessions',
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  'accounts',
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable(
  'verifications',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.identifier)],
);

export type User = typeof user.$inferSelect;
