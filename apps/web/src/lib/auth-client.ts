import { createAuthClient } from 'better-auth/react';

// Same-origin: Next.js proxies /api/auth/* to the NestJS API.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
