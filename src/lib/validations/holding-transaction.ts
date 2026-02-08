import { z } from 'zod';

export const createHoldingTransactionSchema = z.object({
  holdingId: z.string().min(1),
  transactionType: z.enum(['buy', 'sell', 'dividend', 'transfer_in', 'transfer_out']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantity: z.coerce.number().positive(),
  priceOriginal: z.coerce.number().nonnegative(),
  priceKRW: z.coerce.number().nonnegative(),
  exchangeRate: z.coerce.number().positive().nullable().optional(),
  fees: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateHoldingTransactionInput = z.infer<typeof createHoldingTransactionSchema>;
