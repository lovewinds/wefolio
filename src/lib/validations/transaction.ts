import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().nullable().optional(),
  user: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
