import { prisma } from '@/lib/prisma';
import type { Asset, Prisma } from '@prisma/client';

export const assetRepository = {
  async findAll(): Promise<Asset[]> {
    return prisma.asset.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<Asset | null> {
    return prisma.asset.findUnique({
      where: { id },
    });
  },

  async findByType(type: string): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: { type },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return prisma.asset.create({ data });
  },

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Asset> {
    return prisma.asset.delete({
      where: { id },
    });
  },

  async getTotalBalance(): Promise<number> {
    const result = await prisma.asset.aggregate({
      _sum: { balance: true },
    });
    return result._sum.balance ?? 0;
  },
};
