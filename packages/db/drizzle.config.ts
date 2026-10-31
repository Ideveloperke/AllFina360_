import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: ['.env', '../../.env'], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env at the repo root.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
