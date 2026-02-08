import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(50),
  accountType: z.enum([
    'savings',
    'time_deposit',
    'cma',
    'regular',
    'pension_savings',
    'irp',
    'isa',
  ]),
  institutionId: z.string().min(1),
  memberId: z.string().min(1),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
