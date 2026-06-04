import { z } from 'zod';
import { ASSET_CLASS, CURRENCY, RISK_LEVEL } from '@/constants/asset';

export const createAssetMasterSchema = z.object({
  name: z.string().min(1).max(100),
  assetClass: z.enum(ASSET_CLASS),
  currency: z.enum(CURRENCY).default('KRW'),
  riskLevel: z.enum(RISK_LEVEL).default('위험자산'),
});

export type CreateAssetMasterInput = z.infer<typeof createAssetMasterSchema>;
