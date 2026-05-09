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

export const listTransactionsByMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2200),
  month: z.coerce.number().int().min(1).max(12),
});

export const listTransactionsByRangeQuerySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(data => data.startDate <= data.endDate, {
    message: 'startDate must be before or equal to endDate',
    path: ['endDate'],
  });
