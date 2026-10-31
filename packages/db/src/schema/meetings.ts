import { ACTION_ITEM_OWNERS, MEETING_SOURCES, MEETING_STATUSES } from '@allfina/shared';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_columns';
import { user } from './auth';
import { clients } from './clients';
import { firms } from './firms';

export const meetingStatus = pgEnum('meeting_status', MEETING_STATUSES);
export const meetingSource = pgEnum('meeting_source', MEETING_SOURCES);
export const actionItemOwner = pgEnum('action_item_owner', ACTION_ITEM_OWNERS);

export const meetings = pgTable(
  'meetings',
  {
    id: uuid().primaryKey().defaultRandom(),
    firmId: uuid()
      .notNull()
      .references(() => firms.id, { onDelete: 'cascade' }),
    advisorId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    clientId: uuid().references(() => clients.id, { onDelete: 'set null' }),
    title: text().notNull(),
    status: meetingStatus().notNull().default('draft'),
    source: meetingSource().notNull(),
    scheduledAt: timestamp({ withTimezone: true }),
    /** Object storage key of the original recording. */
    recordingKey: text(),
    durationSeconds: integer(),
    errorMessage: text(),
    ...timestamps,
  },
  (t) => [index().on(t.firmId, t.createdAt), index().on(t.clientId)],
);

export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export const transcripts = pgTable('transcripts', {
  id: uuid().primaryKey().defaultRandom(),
  meetingId: uuid()
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  text: text().notNull(),
  segments: jsonb().$type<TranscriptSegment[]>().notNull().default([]),
  provider: text().notNull(),
  ...timestamps,
});

export const meetingSummaries = pgTable('meeting_summaries', {
  id: uuid().primaryKey().defaultRandom(),
  meetingId: uuid()
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  summary: text().notNull(),
  keyPoints: jsonb().$type<string[]>().notNull().default([]),
  followUpEmailSubject: text().notNull(),
  followUpEmailBody: text().notNull(),
  complianceFlags: jsonb().$type<string[]>().notNull().default([]),
  /** Model that produced this summary, kept for audit/recordkeeping. */
  model: text().notNull(),
  ...timestamps,
});

export const actionItems = pgTable(
  'action_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    firmId: uuid()
      .notNull()
      .references(() => firms.id, { onDelete: 'cascade' }),
    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    description: text().notNull(),
    owner: actionItemOwner().notNull().default('advisor'),
    dueDate: date({ mode: 'string' }),
    completed: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index().on(t.meetingId), index().on(t.firmId, t.completed)],
);

export type Meeting = typeof meetings.$inferSelect;
export type Transcript = typeof transcripts.$inferSelect;
export type MeetingSummary = typeof meetingSummaries.$inferSelect;
export type ActionItem = typeof actionItems.$inferSelect;
