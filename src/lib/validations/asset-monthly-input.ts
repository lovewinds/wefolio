import { z } from 'zod';
import { yearMonthSchema } from './common';

export const monthlyInputRowSchema = z.object({
  holdingId: z.string().min(1).nullable().optional(),
  accountId: z.string().min(1),
  assetMasterId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantity: z.coerce.number().nonnegative(),
  priceOriginal: z.coerce.number().nonnegative(),
  exchangeRate: z.coerce.number().positive().nullable().optional(),
  priceKRW: z.coerce.number().nonnegative(),
  totalValueKRW: z.coerce.number().nonnegative(),
});

export const saveMonthlyInputSchema = yearMonthSchema.extend({
  rows: z.array(monthlyInputRowSchema).min(1),
});

export type SaveMonthlyInputInput = z.infer<typeof saveMonthlyInputSchema>;
