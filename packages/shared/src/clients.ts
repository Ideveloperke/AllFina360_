import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const createClientSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z.string().trim().max(50).optional(),
  notes: optionalText,
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export interface ClientDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
