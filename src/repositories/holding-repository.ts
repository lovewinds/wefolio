import { prisma } from '@/lib/prisma';
import type {
  AssetMaster,
  AssetPrice,
  Holding,
  HoldingTransaction,
  HoldingValueSnapshot,
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

  async findBySymbol(symbol: string, currency: string = 'KRW'): Promise<AssetMaster | null> {
    return prisma.assetMaster.findUnique({
      where: { symbol_currency: { symbol, currency } },
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
// AssetPrice Repository
// ============================================

export const assetPriceRepository = {
  async findByAssetMasterId(assetMasterId: string): Promise<AssetPrice[]> {
    return prisma.assetPrice.findMany({
      where: { assetMasterId },
      orderBy: { date: 'desc' },
    });
  },

  async findLatestByAssetMasterId(assetMasterId: string): Promise<AssetPrice | null> {
    return prisma.assetPrice.findFirst({
      where: { assetMasterId },
      orderBy: { date: 'desc' },
    });
  },

  async findByAssetMasterIdAndDate(assetMasterId: string, date: Date): Promise<AssetPrice | null> {
    return prisma.assetPrice.findUnique({
      where: { assetMasterId_date: { assetMasterId, date } },
    });
  },

  async findByDateRange(
    assetMasterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AssetPrice[]> {
    return prisma.assetPrice.findMany({
      where: {
        assetMasterId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  async create(data: Prisma.AssetPriceCreateInput): Promise<AssetPrice> {
    return prisma.assetPrice.create({ data });
  },

  async upsert(
    assetMasterId: string,
    date: Date,
    data: {
      priceOriginal: number;
      exchangeRate?: number | null;
      priceKRW: number;
      source?: string | null;
    }
  ): Promise<AssetPrice> {
    return prisma.assetPrice.upsert({
      where: {
        assetMasterId_date: { assetMasterId, date },
      },
      update: data,
      create: {
        assetMaster: { connect: { id: assetMasterId } },
        date,
        ...data,
      },
    });
  },

  async delete(id: string): Promise<AssetPrice> {
    return prisma.assetPrice.delete({
      where: { id },
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

  async updateQuantity(
    id: string,
    quantity: number,
    averageCostKRW: number,
    averageCostOriginal?: number | null
  ): Promise<Holding> {
    return prisma.holding.update({
      where: { id },
      data: { quantity, averageCostKRW, averageCostOriginal },
    });
  },

  async delete(id: string): Promise<Holding> {
    return prisma.holding.delete({
      where: { id },
    });
  },

  async getTotalValueByAccountId(accountId: string): Promise<number> {
    const holdings = await prisma.holding.findMany({
      where: { accountId },
      include: {
        assetMaster: {
          include: {
            priceHistory: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return holdings.reduce((total, holding) => {
      const latestPrice = holding.assetMaster.priceHistory[0];
      if (latestPrice) {
        return total + holding.quantity * latestPrice.priceKRW;
      }
      // 가격이 없으면 평균단가 사용
      return total + holding.quantity * holding.averageCostKRW;
    }, 0);
  },
};

// ============================================
// HoldingTransaction Repository
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
// HoldingValueSnapshot Repository
// ============================================

export const holdingValueSnapshotRepository = {
  async findByHoldingId(holdingId: string): Promise<HoldingValueSnapshot[]> {
    return prisma.holdingValueSnapshot.findMany({
      where: { holdingId },
      orderBy: { date: 'desc' },
    });
  },

  async findByHoldingIdAndDate(
    holdingId: string,
    date: Date
  ): Promise<HoldingValueSnapshot | null> {
    return prisma.holdingValueSnapshot.findUnique({
      where: { holdingId_date: { holdingId, date } },
    });
  },

  async findByDateRange(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HoldingValueSnapshot[]> {
    return prisma.holdingValueSnapshot.findMany({
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

  async findLatestByHoldingId(holdingId: string): Promise<HoldingValueSnapshot | null> {
    return prisma.holdingValueSnapshot.findFirst({
      where: { holdingId },
      orderBy: { date: 'desc' },
    });
  },

  async create(data: Prisma.HoldingValueSnapshotCreateInput): Promise<HoldingValueSnapshot> {
    return prisma.holdingValueSnapshot.create({ data });
  },

  async upsert(
    holdingId: string,
    date: Date,
    data: {
      quantity: number;
      priceOriginal: number;
      exchangeRate?: number | null;
      priceKRW: number;
      totalValueKRW: number;
      source?: string;
    }
  ): Promise<HoldingValueSnapshot> {
    return prisma.holdingValueSnapshot.upsert({
      where: {
        holdingId_date: { holdingId, date },
      },
      update: data,
      create: {
        holding: { connect: { id: holdingId } },
        date,
        ...data,
      },
    });
  },

  async delete(id: string): Promise<HoldingValueSnapshot> {
    return prisma.holdingValueSnapshot.delete({
      where: { id },
    });
  },
};
