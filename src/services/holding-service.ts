import {
  assetMasterRepository,
  assetPriceRepository,
  holdingRepository,
  holdingTransactionRepository,
  holdingValueSnapshotRepository,
} from '@/repositories/holding-repository';
import { prisma } from '@/lib/prisma';
import { RISK_LEVEL_LABELS } from '@/lib/constants';
import type { AssetMaster, AssetPrice, Holding, HoldingTransaction, Prisma } from '@prisma/client';
import type {
  AssetClass,
  Currency,
  HoldingTransactionType,
  AssetClassSummary,
  HoldingWithAsset,
  PortfolioSummary,
} from '@/types/asset';
import { familyMemberService, institutionService, accountService } from './account-service';

// ============================================
// AssetMaster Service
// ============================================

export const assetMasterService = {
  async getAll(): Promise<AssetMaster[]> {
    return assetMasterRepository.findAll();
  },

  async getById(id: string): Promise<AssetMaster | null> {
    return assetMasterRepository.findById(id);
  },

  async getBySymbol(symbol: string, currency: Currency = 'KRW'): Promise<AssetMaster | null> {
    return assetMasterRepository.findBySymbol(symbol, currency);
  },

  async getByAssetClass(assetClass: AssetClass): Promise<AssetMaster[]> {
    return assetMasterRepository.findByAssetClass(assetClass);
  },

  async getByCurrency(currency: Currency): Promise<AssetMaster[]> {
    return assetMasterRepository.findByCurrency(currency);
  },

  async create(data: Prisma.AssetMasterCreateInput): Promise<AssetMaster> {
    return assetMasterRepository.create(data);
  },

  async update(id: string, data: Prisma.AssetMasterUpdateInput): Promise<AssetMaster> {
    return assetMasterRepository.update(id, data);
  },

  async delete(id: string): Promise<AssetMaster> {
    return assetMasterRepository.delete(id);
  },
};

// ============================================
// AssetPrice Service
// ============================================

export const assetPriceService = {
  async getByAssetMasterId(assetMasterId: string): Promise<AssetPrice[]> {
    return assetPriceRepository.findByAssetMasterId(assetMasterId);
  },

  async getLatest(assetMasterId: string): Promise<AssetPrice | null> {
    return assetPriceRepository.findLatestByAssetMasterId(assetMasterId);
  },

  async getByDate(assetMasterId: string, date: Date): Promise<AssetPrice | null> {
    return assetPriceRepository.findByAssetMasterIdAndDate(assetMasterId, date);
  },

  async getByDateRange(
    assetMasterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AssetPrice[]> {
    return assetPriceRepository.findByDateRange(assetMasterId, startDate, endDate);
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
    return assetPriceRepository.upsert(assetMasterId, date, data);
  },

  async delete(id: string): Promise<AssetPrice> {
    return assetPriceRepository.delete(id);
  },
};

// ============================================
// Holding Service
// ============================================

export const holdingService = {
  async getAll() {
    return holdingRepository.findAll();
  },

  async getById(id: string) {
    return holdingRepository.findById(id);
  },

  async getByAccountId(accountId: string) {
    return holdingRepository.findByAccountId(accountId);
  },

  async getByAssetMasterId(assetMasterId: string) {
    return holdingRepository.findByAssetMasterId(assetMasterId);
  },

  async getWithCurrentValue(accountId: string): Promise<HoldingWithAsset[]> {
    const holdings = await holdingRepository.findByAccountId(accountId);
    const result: HoldingWithAsset[] = [];

    for (const holding of holdings) {
      const latestPrice = await assetPriceRepository.findLatestByAssetMasterId(
        holding.assetMasterId
      );

      const currentPrice = latestPrice?.priceKRW ?? holding.averageCostKRW;
      const currentValue = holding.quantity * currentPrice;
      const totalCost = holding.quantity * holding.averageCostKRW;
      const profitLoss = currentValue - totalCost;
      const profitLossRate = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      result.push({
        ...holding,
        assetMaster: holding.assetMaster,
        currentPrice: latestPrice ?? undefined,
        currentValue,
        profitLoss,
        profitLossRate,
      });
    }

    return result;
  },

  async create(data: Prisma.HoldingCreateInput): Promise<Holding> {
    return holdingRepository.create(data);
  },

  async update(id: string, data: Prisma.HoldingUpdateInput): Promise<Holding> {
    return holdingRepository.update(id, data);
  },

  async delete(id: string): Promise<Holding> {
    return holdingRepository.delete(id);
  },

  async getTotalValueByAccountId(accountId: string): Promise<number> {
    return holdingRepository.getTotalValueByAccountId(accountId);
  },

  async getSummaryByAssetClass(): Promise<AssetClassSummary[]> {
    const holdings = await holdingRepository.findAll();
    const summaryMap = new Map<AssetClass, AssetClassSummary>();

    let totalValue = 0;

    for (const holding of holdings) {
      const latestPrice = await assetPriceRepository.findLatestByAssetMasterId(
        holding.assetMasterId
      );
      const currentPrice = latestPrice?.priceKRW ?? holding.averageCostKRW;
      const value = holding.quantity * currentPrice;
      totalValue += value;

      const assetClass = holding.assetMaster.assetClass as AssetClass;
      const existing = summaryMap.get(assetClass);

      if (existing) {
        existing.totalValue += value;
        existing.holdingCount += 1;
      } else {
        summaryMap.set(assetClass, {
          assetClass,
          totalValue: value,
          percentage: 0,
          holdingCount: 1,
        });
      }
    }

    // 비율 계산
    const result = Array.from(summaryMap.values());
    for (const summary of result) {
      summary.percentage = totalValue > 0 ? (summary.totalValue / totalValue) * 100 : 0;
    }

    return result;
  },
};

// ============================================
// HoldingTransaction Service
// ============================================

export const holdingTransactionService = {
  async getByHoldingId(holdingId: string): Promise<HoldingTransaction[]> {
    return holdingTransactionRepository.findByHoldingId(holdingId);
  },

  async getByDateRange(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HoldingTransaction[]> {
    return holdingTransactionRepository.findByDateRange(holdingId, startDate, endDate);
  },

  async getByTransactionType(
    holdingId: string,
    transactionType: HoldingTransactionType
  ): Promise<HoldingTransaction[]> {
    return holdingTransactionRepository.findByTransactionType(holdingId, transactionType);
  },

  async create(data: Prisma.HoldingTransactionCreateInput): Promise<HoldingTransaction> {
    return holdingTransactionRepository.create(data);
  },

  async recordBuy(
    holdingId: string,
    date: Date,
    quantity: number,
    priceOriginal: number,
    priceKRW: number,
    exchangeRate?: number | null,
    fees?: number | null,
    notes?: string | null
  ): Promise<HoldingTransaction> {
    const totalKRW = quantity * priceKRW + (fees ?? 0);

    const transaction = await holdingTransactionRepository.create({
      holding: { connect: { id: holdingId } },
      transactionType: 'buy',
      date,
      quantity,
      priceOriginal,
      exchangeRate,
      priceKRW,
      totalKRW,
      fees,
      notes,
    });

    // 보유량 및 평균단가 업데이트
    await this.updateHoldingAfterTransaction(holdingId);

    return transaction;
  },

  async recordSell(
    holdingId: string,
    date: Date,
    quantity: number,
    priceOriginal: number,
    priceKRW: number,
    exchangeRate?: number | null,
    fees?: number | null,
    notes?: string | null
  ): Promise<HoldingTransaction> {
    const totalKRW = quantity * priceKRW - (fees ?? 0);

    const transaction = await holdingTransactionRepository.create({
      holding: { connect: { id: holdingId } },
      transactionType: 'sell',
      date,
      quantity: -quantity, // 매도는 음수
      priceOriginal,
      exchangeRate,
      priceKRW,
      totalKRW,
      fees,
      notes,
    });

    // 보유량 업데이트 (평균단가는 유지)
    await this.updateHoldingAfterTransaction(holdingId);

    return transaction;
  },

  async updateHoldingAfterTransaction(holdingId: string): Promise<void> {
    const transactions = await holdingTransactionRepository.findByHoldingId(holdingId);

    let totalQuantity = 0;
    let totalCostKRW = 0;
    let totalCostOriginal = 0;

    // 매수 거래만 평균단가 계산에 사용
    for (const tx of transactions) {
      if (tx.transactionType === 'buy' || tx.transactionType === 'transfer_in') {
        totalQuantity += tx.quantity;
        totalCostKRW += tx.quantity * tx.priceKRW;
        totalCostOriginal += tx.quantity * tx.priceOriginal;
      } else if (tx.transactionType === 'sell' || tx.transactionType === 'transfer_out') {
        totalQuantity += tx.quantity; // 음수
      }
    }

    const averageCostKRW = totalQuantity > 0 ? totalCostKRW / totalQuantity : 0;
    const averageCostOriginal = totalQuantity > 0 ? totalCostOriginal / totalQuantity : null;

    await holdingRepository.updateQuantity(
      holdingId,
      totalQuantity,
      averageCostKRW,
      averageCostOriginal
    );
  },

  async delete(id: string): Promise<HoldingTransaction> {
    const transaction = await holdingTransactionRepository.delete(id);
    await this.updateHoldingAfterTransaction(transaction.holdingId);
    return transaction;
  },
};

// ============================================
// HoldingValueSnapshot Service
// ============================================

interface RiskChild {
  label: string;
  value: number;
  percentage: number;
}

interface RiskGroup {
  riskLevel: string;
  totalValue: number;
  percentage: number;
  children: RiskChild[];
}

interface MonthlyHolding {
  id: string;
  assetName: string;
  assetClass: string;
  subClass: string | null;
  riskLevel: string;
  currency: string;
  quantity: number;
  priceKRW: number;
  totalValueKRW: number;
  percentage: number;
  memberName: string;
  accountName: string;
  institutionName: string;
}

interface MonthlyAssetData {
  totalValue: number;
  byRiskLevel: RiskGroup[];
  holdings: MonthlyHolding[];
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
}

function buildRiskGroups(holdings: MonthlyHolding[], totalValue: number): RiskGroup[] {
  const riskGroupMap = new Map<string, { totalValue: number; children: Map<string, number> }>();

  for (const h of holdings) {
    if (!riskGroupMap.has(h.riskLevel)) {
      riskGroupMap.set(h.riskLevel, { totalValue: 0, children: new Map() });
    }
    const group = riskGroupMap.get(h.riskLevel)!;
    group.totalValue += h.totalValueKRW;
    const childLabel = h.subClass ?? h.assetClass;
    group.children.set(childLabel, (group.children.get(childLabel) ?? 0) + h.totalValueKRW);
  }

  return Array.from(riskGroupMap.entries())
    .map(([riskLevel, group]) => ({
      riskLevel,
      totalValue: group.totalValue,
      percentage: totalValue > 0 ? Math.round((group.totalValue / totalValue) * 10000) / 100 : 0,
      children: Array.from(group.children.entries())
        .map(([label, value]) => ({
          label,
          value,
          percentage: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

export const holdingValueSnapshotService = {
  async getMonthlyAssetData(year: number, month: number): Promise<MonthlyAssetData> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(year, month, 1));

    const snapshots = await prisma.holdingValueSnapshot.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
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
    });

    const [minSnapshot, maxSnapshot] = await Promise.all([
      prisma.holdingValueSnapshot.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      prisma.holdingValueSnapshot.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);

    const availableRange =
      minSnapshot && maxSnapshot
        ? {
            min: {
              year: minSnapshot.date.getUTCFullYear(),
              month: minSnapshot.date.getUTCMonth() + 1,
            },
            max: {
              year: maxSnapshot.date.getUTCFullYear(),
              month: maxSnapshot.date.getUTCMonth() + 1,
            },
          }
        : null;

    if (snapshots.length === 0) {
      return { totalValue: 0, byRiskLevel: [], holdings: [], availableRange };
    }

    const totalValue = snapshots.reduce((sum, s) => sum + s.totalValueKRW, 0);

    const holdings: MonthlyHolding[] = snapshots.map(s => {
      const { holding } = s;
      const { assetMaster, account } = holding;
      return {
        id: s.id,
        assetName: assetMaster.name,
        assetClass: assetMaster.assetClass,
        subClass: assetMaster.subClass,
        riskLevel: RISK_LEVEL_LABELS[assetMaster.riskLevel] ?? assetMaster.riskLevel,
        currency: assetMaster.currency,
        quantity: s.quantity,
        priceKRW: s.priceKRW,
        totalValueKRW: s.totalValueKRW,
        percentage: totalValue > 0 ? Math.round((s.totalValueKRW / totalValue) * 10000) / 100 : 0,
        memberName: account.member.name,
        accountName: account.name,
        institutionName: account.institution.name,
      };
    });

    const byRiskLevel = buildRiskGroups(holdings, totalValue);

    return { totalValue, byRiskLevel, holdings, availableRange };
  },

  async getByHoldingId(holdingId: string) {
    return holdingValueSnapshotRepository.findByHoldingId(holdingId);
  },

  async getByDateRange(holdingId: string, startDate: Date, endDate: Date) {
    return holdingValueSnapshotRepository.findByDateRange(holdingId, startDate, endDate);
  },

  async getLatest(holdingId: string) {
    return holdingValueSnapshotRepository.findLatestByHoldingId(holdingId);
  },

  async createSnapshot(holdingId: string, date: Date): Promise<void> {
    const holding = await holdingRepository.findById(holdingId);
    if (!holding) {
      throw new Error(`Holding not found: ${holdingId}`);
    }

    const latestPrice = await assetPriceRepository.findLatestByAssetMasterId(holding.assetMasterId);

    const priceKRW = latestPrice?.priceKRW ?? holding.averageCostKRW;
    const priceOriginal = latestPrice?.priceOriginal ?? holding.averageCostKRW;
    const exchangeRate = latestPrice?.exchangeRate ?? null;
    const totalValueKRW = holding.quantity * priceKRW;

    await holdingValueSnapshotRepository.upsert(holdingId, date, {
      quantity: holding.quantity,
      priceOriginal,
      exchangeRate,
      priceKRW,
      totalValueKRW,
      source: 'api',
    });
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
  ) {
    return holdingValueSnapshotRepository.upsert(holdingId, date, data);
  },

  async delete(id: string) {
    return holdingValueSnapshotRepository.delete(id);
  },
};

// ============================================
// Portfolio Service (전체 자산 통합 조회)
// ============================================

export const portfolioService = {
  async getSummary(): Promise<PortfolioSummary> {
    const [byMember, byAssetClass, byInstitution] = await Promise.all([
      familyMemberService.getSummary(),
      holdingService.getSummaryByAssetClass(),
      institutionService.getSummary(),
    ]);

    const totalCash = byMember.reduce((sum, m) => sum + m.totalCash, 0);
    const totalHoldings = byMember.reduce((sum, m) => sum + m.totalHoldings, 0);

    return {
      totalAssets: totalCash + totalHoldings,
      totalCash,
      totalHoldings,
      byMember,
      byAssetClass,
      byInstitution,
    };
  },

  async getAccountSummaries() {
    return accountService.getSummary();
  },
};
