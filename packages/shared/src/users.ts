export const USER_ROLES = ['owner', 'advisor', 'assistant', 'compliance'] as const;
export type UserRole = (typeof USER_ROLES)[number];
