import { index, jsonb, pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';
import { firms } from './firms';

/** Embedding dimension (matches Voyage AI voyage-3 family; change with the embedding model). */
export const EMBEDDING_DIMENSIONS = 1024;

/** Chunks of meetings, notes and documents for semantic search / RAG (pgvector). */
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid().primaryKey().defaultRandom(),
    firmId: uuid()
      .notNull()
      .references(() => firms.id, { onDelete: 'cascade' }),
    sourceType: text({ enum: ['meeting', 'note', 'document'] }).notNull(),
    sourceId: uuid().notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: EMBEDDING_DIMENSIONS }),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.firmId, t.sourceType, t.sourceId),
    index('document_chunks_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ],
);

export type DocumentChunk = typeof documentChunks.$inferSelect;
