import { account, firms, session, user, verification, type Database } from '@allfina/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Env } from '../config/env';

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    appName: 'AllFina',
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_URL],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
    },
    session: {
      expiresIn: 60 * 60 * 12, // 12h - financial apps should keep sessions short
      updateAge: 60 * 60,
    },
    user: {
      additionalFields: {
        firmId: { type: 'string', required: false, input: false },
        role: { type: 'string', required: false, defaultValue: 'advisor', input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Every new sign-up gets its own firm (tenant) and becomes its owner.
          // Invitations into an existing firm can be added later.
          before: async (newUser) => {
            const [firm] = await db
              .insert(firms)
              .values({ name: `${newUser.name}'s Practice` })
              .returning({ id: firms.id });
            return { data: { ...newUser, firmId: firm!.id, role: 'owner' } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export const AUTH = Symbol('AUTH');
