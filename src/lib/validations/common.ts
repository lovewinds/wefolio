import { z } from 'zod';

export const yearMonthSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type YearMonthInput = z.infer<typeof yearMonthSchema>;
