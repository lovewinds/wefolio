import { z } from 'zod';

export const createAssetMasterSchema = z.object({
  name: z.string().min(1).max(100),
  assetClass: z.enum(['stock', 'bond', 'deposit', 'gold', 'fund', 'etf']),
  currency: z.enum(['KRW', 'USD']).default('KRW'),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
});

export type CreateAssetMasterInput = z.infer<typeof createAssetMasterSchema>;
