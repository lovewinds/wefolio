import { z } from 'zod';
import { ACCOUNT_TYPE } from '@/constants/asset';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(50),
  accountType: z.enum(ACCOUNT_TYPE),
  institutionId: z.string().min(1),
  memberId: z.string().min(1),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
