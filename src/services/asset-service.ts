import { assetRepository } from '@/repositories/asset-repository';
import type { Asset, Prisma } from '@prisma/client';
import type { AssetType } from '@/types';

export const assetService = {
  async getAll(): Promise<Asset[]> {
    return assetRepository.findAll();
  },

  async getById(id: string): Promise<Asset | null> {
    return assetRepository.findById(id);
  },

  async getByType(type: AssetType): Promise<Asset[]> {
    return assetRepository.findByType(type);
  },

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return assetRepository.create(data);
  },

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return assetRepository.update(id, data);
  },

  async delete(id: string): Promise<Asset> {
    return assetRepository.delete(id);
  },

  async getTotalBalance(): Promise<number> {
    return assetRepository.getTotalBalance();
  },

  async getSummaryByType(): Promise<{ type: AssetType; total: number }[]> {
    const assets = await assetRepository.findAll();
    const summary = new Map<AssetType, number>();

    for (const asset of assets) {
      const type = asset.type as AssetType;
      summary.set(type, (summary.get(type) ?? 0) + asset.balance);
    }

    return Array.from(summary.entries()).map(([type, total]) => ({ type, total }));
  },
};
