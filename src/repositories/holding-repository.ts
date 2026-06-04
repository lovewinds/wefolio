import { prisma } from '@/lib/prisma';
import type {
  AssetMaster,
  Holding,
  HoldingTransaction,
  HoldingSnapshot,
  Prisma,
} from '@prisma/client';

// ============================================
// AssetMaster Repository
// ============================================

export const assetMasterRepository = {
  async findAll(): Promise<AssetMaster[]> {
    return prisma.assetMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string): Promise<AssetMaster | null> {
    return prisma.assetMaster.findUnique({
      where: { id },
    });
  },

  async findByNameAndCurrency(name: string, currency: string = 'KRW'): Promise<AssetMaster | null> {
    return prisma.assetMaster.findUnique({
      where: { name_currency: { name, currency } },
    });
  },

  async findByAssetClass(assetClass: string): Promise<AssetMaster[]> {
    return prisma.assetMaster.findMany({
      where: { assetClass, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findByCurrency(currency: string): Promise<AssetMaster[]> {
    return prisma.assetMaster.findMany({
      where: { currency, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: Prisma.AssetMasterCreateInput): Promise<AssetMaster> {
    return prisma.assetMaster.create({ data });
  },

  async update(id: string, data: Prisma.AssetMasterUpdateInput): Promise<AssetMaster> {
    return prisma.assetMaster.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<AssetMaster> {
    return prisma.assetMaster.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

// ============================================
// Holding Repository
// ============================================

type HoldingWithAssetMaster = Holding & {
  assetMaster: AssetMaster;
};

export const holdingRepository = {
  async findAll(): Promise<HoldingWithAssetMaster[]> {
    return prisma.holding.findMany({
      include: {
        assetMaster: true,
      },
      orderBy: { assetMaster: { name: 'asc' } },
    });
  },

  async findById(id: string): Promise<HoldingWithAssetMaster | null> {
    return prisma.holding.findUnique({
      where: { id },
      include: {
        assetMaster: true,
      },
    });
  },

  async findByAccountId(accountId: string): Promise<HoldingWithAssetMaster[]> {
    return prisma.holding.findMany({
      where: { accountId },
      include: {
        assetMaster: true,
      },
      orderBy: { assetMaster: { name: 'asc' } },
    });
  },

  async findByAssetMasterId(assetMasterId: string): Promise<HoldingWithAssetMaster[]> {
    return prisma.holding.findMany({
      where: { assetMasterId },
      include: {
        assetMaster: true,
      },
    });
  },

  async findByAccountAndAsset(
    accountId: string,
    assetMasterId: string
  ): Promise<HoldingWithAssetMaster | null> {
    return prisma.holding.findUnique({
      where: { accountId_assetMasterId: { accountId, assetMasterId } },
      include: {
        assetMaster: true,
      },
    });
  },

  async create(data: Prisma.HoldingCreateInput): Promise<Holding> {
    return prisma.holding.create({ data });
  },

  async update(id: string, data: Prisma.HoldingUpdateInput): Promise<Holding> {
    return prisma.holding.update({
      where: { id },
      data,
    });
  },

  async findAllWithAccountAndAsset() {
    return prisma.holding.findMany({
      include: {
        assetMaster: true,
        account: {
          include: {
            member: true,
            institution: true,
          },
        },
      },
      orderBy: { assetMaster: { name: 'asc' } },
    });
  },

  async delete(id: string): Promise<Holding> {
    return prisma.holding.delete({
      where: { id },
    });
  },
};

// ============================================
// HoldingTransaction Repository (비권위 보조)
// ============================================

export const holdingTransactionRepository = {
  async findByHoldingId(holdingId: string): Promise<HoldingTransaction[]> {
    return prisma.holdingTransaction.findMany({
      where: { holdingId },
      orderBy: { date: 'desc' },
    });
  },

  async findByDateRange(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HoldingTransaction[]> {
    return prisma.holdingTransaction.findMany({
      where: {
        holdingId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  async findAllByDateRange(startDate: Date, endDate: Date) {
    return prisma.holdingTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        holding: {
          include: {
            assetMaster: true,
            account: {
              include: {
                member: true,
                institution: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  },

  async findByTransactionType(
    holdingId: string,
    transactionType: string
  ): Promise<HoldingTransaction[]> {
    return prisma.holdingTransaction.findMany({
      where: { holdingId, transactionType },
      orderBy: { date: 'desc' },
    });
  },

  async create(data: Prisma.HoldingTransactionCreateInput): Promise<HoldingTransaction> {
    return prisma.holdingTransaction.create({ data });
  },

  async update(
    id: string,
    data: Prisma.HoldingTransactionUpdateInput
  ): Promise<HoldingTransaction> {
    return prisma.holdingTransaction.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<HoldingTransaction> {
    return prisma.holdingTransaction.delete({
      where: { id },
    });
  },
};

// ============================================
// HoldingSnapshot Repository (SSOT)
// ============================================

export const holdingValueSnapshotRepository = {
  async findByHoldingId(holdingId: string): Promise<HoldingSnapshot[]> {
    return prisma.holdingSnapshot.findMany({
      where: { holdingId },
      orderBy: { snapshotDate: 'desc' },
    });
  },

  async findByHoldingIdAndDate(
    holdingId: string,
    snapshotDate: Date
  ): Promise<HoldingSnapshot | null> {
    return prisma.holdingSnapshot.findUnique({
      where: { holdingId_snapshotDate: { holdingId, snapshotDate } },
    });
  },

  async findByDateRange(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HoldingSnapshot[]> {
    return prisma.holdingSnapshot.findMany({
      where: {
        holdingId,
        snapshotDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { snapshotDate: 'asc' },
    });
  },

  async findLatestByHoldingId(holdingId: string): Promise<HoldingSnapshot | null> {
    return prisma.holdingSnapshot.findFirst({
      where: { holdingId },
      orderBy: { snapshotDate: 'desc' },
    });
  },

  async create(data: Prisma.HoldingSnapshotCreateInput): Promise<HoldingSnapshot> {
    return prisma.holdingSnapshot.create({ data });
  },

  async upsert(
    holdingId: string,
    snapshotDate: Date,
    data: {
      quantity: number;
      avgCostKRW: number;
      currentPriceKRW: number;
      exchangeRate?: number | null;
      priceOriginal?: number | null;
      avgCostOriginal?: number | null;
    }
  ): Promise<HoldingSnapshot> {
    return prisma.holdingSnapshot.upsert({
      where: {
        holdingId_snapshotDate: { holdingId, snapshotDate },
      },
      update: data,
      create: {
        holding: { connect: { id: holdingId } },
        snapshotDate,
        ...data,
      },
    });
  },

  async delete(id: string): Promise<HoldingSnapshot> {
    return prisma.holdingSnapshot.delete({
      where: { id },
    });
  },
};
