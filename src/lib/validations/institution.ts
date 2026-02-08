import { z } from 'zod';

export const createInstitutionSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['bank', 'brokerage']),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
