import {
  assetMasterRepository,
  holdingRepository,
  holdingTransactionRepository,
  holdingValueSnapshotRepository,
} from '@/repositories/holding-repository';
import { prisma } from '@/lib/prisma';
import { RISK_LEVEL_LABELS } from '@/lib/constants';
import type { AssetMaster, Holding, HoldingTransaction, Prisma } from '@prisma/client';
import type {
  AssetClass,
  Currency,
  HoldingTransactionType,
  AssetMonthlyInputDraft,
  AssetMonthlyInputRow,
  AssetMonthlyInputSaveRow,
  AssetMonthlyInputStatus,
  AssetMonthlyInputType,
} from '@/types/asset';

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

  async create(data: Prisma.HoldingCreateInput): Promise<Holding> {
    return holdingRepository.create(data);
  },

  async update(id: string, data: Prisma.HoldingUpdateInput): Promise<Holding> {
    return holdingRepository.update(id, data);
  },

  async delete(id: string): Promise<Holding> {
    return holdingRepository.delete(id);
  },

  async getAllWithAccountInfo() {
    const holdings = await holdingRepository.findAllWithAccountAndAsset();
    return holdings.map(h => ({
      id: h.id,
      accountId: h.accountId,
      assetMasterId: h.assetMasterId,
      label: `${h.assetMaster.name} (${h.account.name} - ${h.account.member.name})`,
      currency: h.assetMaster.currency,
    }));
  },
};

// ============================================
// HoldingTransaction Service
// ============================================

export const holdingTransactionService = {
  async getAllByMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));
    return holdingTransactionRepository.findAllByDateRange(startDate, endDate);
  },

  async record(
    accountId: string,
    assetMasterId: string,
    transactionType: string,
    date: Date,
    quantity: number,
    priceOriginal: number,
    priceKRW: number,
    exchangeRate?: number | null,
    notes?: string | null
  ): Promise<HoldingTransaction> {
    // Find or create holding
    let holding = await holdingRepository.findByAccountAndAsset(accountId, assetMasterId);
    if (!holding) {
      holding = (await holdingRepository.create({
        account: { connect: { id: accountId } },
        assetMaster: { connect: { id: assetMasterId } },
        quantity: 0,
        averageCostKRW: 0,
        dataSource: 'transaction',
      })) as Holding & { assetMaster: AssetMaster };
    }

    // sell / transfer_out use negative quantity
    const storedQuantity =
      transactionType === 'sell' || transactionType === 'transfer_out' ? -quantity : quantity;

    const totalKRW = quantity * priceKRW;

    const transaction = await holdingTransactionRepository.create({
      holding: { connect: { id: holding.id } },
      transactionType,
      date,
      quantity: storedQuantity,
      priceOriginal,
      exchangeRate: exchangeRate ?? null,
      priceKRW,
      totalKRW,
      notes: notes ?? null,
    });

    // 거래는 비권위(non-authoritative) 보조 기록이다. 스냅샷이 SSOT이므로
    // 거래 입력이 Holding 현재 상태를 자동으로 덮어쓰지 않는다.
    return transaction;
  },

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
    notes?: string | null
  ): Promise<HoldingTransaction> {
    const totalKRW = quantity * priceKRW;

    const transaction = await holdingTransactionRepository.create({
      holding: { connect: { id: holdingId } },
      transactionType: 'buy',
      date,
      quantity,
      priceOriginal,
      exchangeRate,
      priceKRW,
      totalKRW,
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
    notes?: string | null
  ): Promise<HoldingTransaction> {
    const totalKRW = quantity * priceKRW;

    const transaction = await holdingTransactionRepository.create({
      holding: { connect: { id: holdingId } },
      transactionType: 'sell',
      date,
      quantity: -quantity, // 매도는 음수
      priceOriginal,
      exchangeRate,
      priceKRW,
      totalKRW,
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

    const orderedTransactions = [...transactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // 매수/입고는 취득 원가를 더하고, 매도/출고는 기존 평균단가 기준으로 원가를 차감한다.
    for (const tx of orderedTransactions) {
      if (tx.transactionType === 'buy' || tx.transactionType === 'transfer_in') {
        const quantity = Math.abs(tx.quantity);
        totalQuantity += quantity;
        totalCostKRW += quantity * tx.priceKRW;
        totalCostOriginal += quantity * tx.priceOriginal;
      } else if (tx.transactionType === 'sell' || tx.transactionType === 'transfer_out') {
        const quantity = Math.abs(tx.quantity);
        const averageCostKRW = totalQuantity > 0 ? totalCostKRW / totalQuantity : 0;
        const averageCostOriginal = totalQuantity > 0 ? totalCostOriginal / totalQuantity : 0;

        totalQuantity -= quantity;
        totalCostKRW -= quantity * averageCostKRW;
        totalCostOriginal -= quantity * averageCostOriginal;

        if (totalQuantity <= 0) {
          totalQuantity = 0;
          totalCostKRW = 0;
          totalCostOriginal = 0;
        }
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
    // 거래는 비권위 보조 기록이므로 삭제해도 Holding을 재계산하지 않는다.
    return holdingTransactionRepository.delete(id);
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
  priceOriginal: number;
  exchangeRate: number | null;
  priceKRW: number;
  totalValueKRW: number;
  percentage: number;
  memberName: string;
  accountName: string;
  accountType: string;
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

function getPrevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function getMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function getMonthEndSnapshotDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function assertDateInMonth(dateString: string, year: number, month: number): Date {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month
  ) {
    throw new Error('Snapshot date must be inside the selected month');
  }
  return date;
}

function getMonthlyInputStatus(
  prevTotalValue: number | null,
  currentTotalValue: number
): AssetMonthlyInputStatus {
  const prevValue = prevTotalValue ?? 0;
  if (prevValue <= 0 && currentTotalValue > 0) return '신규';
  if (prevValue > 0 && currentTotalValue === 0) return '정리됨';
  if (currentTotalValue > prevValue) return '증가';
  if (currentTotalValue < prevValue) return '감소';
  return '유지';
}

function getMonthlyInputType(assetClass: string, accountType: string): AssetMonthlyInputType {
  const valueOnlyTokens = ['deposit', 'savings', 'time_deposit', 'cma', 'cash'];
  const lowerAssetClass = assetClass.toLowerCase();
  const lowerAccountType = accountType.toLowerCase();

  if (
    assetClass.includes('예금') ||
    assetClass.includes('현금') ||
    accountType.includes('예금') ||
    accountType.includes('적금') ||
    accountType.toUpperCase().includes('CMA')
  ) {
    return 'value';
  }

  return valueOnlyTokens.some(
    token => lowerAssetClass.includes(token) || lowerAccountType === token
  )
    ? 'value'
    : 'quantity';
}

type SnapshotWithHolding = Prisma.HoldingValueSnapshotGetPayload<{
  include: {
    holding: {
      include: {
        assetMaster: true;
        account: {
          include: {
            member: true;
            institution: true;
          };
        };
      };
    };
  };
}>;

async function getSnapshotsByMonth(year: number, month: number): Promise<SnapshotWithHolding[]> {
  const startOfMonth = getMonthStart(year, month);
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  return prisma.holdingValueSnapshot.findMany({
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
    orderBy: [{ holdingId: 'asc' }, { date: 'desc' }],
  });
}

function latestSnapshotByHolding(
  snapshots: SnapshotWithHolding[]
): Map<string, SnapshotWithHolding> {
  const map = new Map<string, SnapshotWithHolding>();
  for (const snapshot of snapshots) {
    if (!map.has(snapshot.holdingId)) {
      map.set(snapshot.holdingId, snapshot);
    }
  }
  return map;
}

function buildMonthlyInputRow(
  holdingId: string,
  prevSnapshot: SnapshotWithHolding | undefined,
  currentSnapshot: SnapshotWithHolding | undefined,
  targetDate: Date,
  hasCurrentSnapshots: boolean
): AssetMonthlyInputRow {
  const sourceSnapshot = currentSnapshot ?? prevSnapshot;
  if (!sourceSnapshot) {
    throw new Error(`Missing snapshot data for holding: ${holdingId}`);
  }

  const { holding } = sourceSnapshot;
  const { assetMaster, account } = holding;
  const values = currentSnapshot ?? prevSnapshot;
  const totalValueKRW = values?.totalValueKRW ?? 0;
  const prevTotalValueKRW = prevSnapshot?.totalValueKRW ?? null;

  return {
    holdingId,
    accountId: holding.accountId,
    assetMasterId: holding.assetMasterId,
    currentSnapshotId: currentSnapshot?.id ?? null,
    date: currentSnapshot ? toDateInput(currentSnapshot.date) : toDateInput(targetDate),
    assetName: assetMaster.name,
    assetClass: assetMaster.assetClass,
    subClass: assetMaster.subClass,
    riskLevel: RISK_LEVEL_LABELS[assetMaster.riskLevel] ?? assetMaster.riskLevel,
    currency: assetMaster.currency,
    memberName: account.member.name,
    accountName: account.name,
    accountType: account.accountType,
    institutionName: account.institution.name,
    inputType: getMonthlyInputType(assetMaster.assetClass, account.accountType),
    prevQuantity: prevSnapshot?.quantity ?? null,
    prevPriceOriginal: prevSnapshot?.priceOriginal ?? null,
    prevExchangeRate: prevSnapshot?.exchangeRate ?? null,
    prevPriceKRW: prevSnapshot?.priceKRW ?? null,
    prevAvgCostKRW: prevSnapshot?.avgCostKRW ?? null,
    prevTotalValueKRW,
    quantity: values?.quantity ?? 0,
    priceOriginal: values?.priceOriginal ?? 0,
    exchangeRate: values?.exchangeRate ?? null,
    priceKRW: values?.priceKRW ?? 0,
    avgCostKRW: values?.avgCostKRW ?? 0,
    totalValueKRW,
    status: getMonthlyInputStatus(prevTotalValueKRW, totalValueKRW),
    isCurrentMissing: hasCurrentSnapshots && Boolean(prevSnapshot) && !currentSnapshot,
  };
}

export const holdingValueSnapshotService = {
  async getMonthlyInputDraft(year: number, month: number): Promise<AssetMonthlyInputDraft> {
    const prev = getPrevMonth(year, month);
    const targetDate = getMonthEndSnapshotDate(year, month);

    const [prevSnapshots, currentSnapshots] = await Promise.all([
      getSnapshotsByMonth(prev.year, prev.month),
      getSnapshotsByMonth(year, month),
    ]);

    const prevMap = latestSnapshotByHolding(prevSnapshots);
    const currentMap = latestSnapshotByHolding(currentSnapshots);
    const holdingIds = Array.from(new Set([...prevMap.keys(), ...currentMap.keys()]));
    const hasCurrentSnapshots = currentMap.size > 0;

    const rows = holdingIds
      .map(holdingId =>
        buildMonthlyInputRow(
          holdingId,
          prevMap.get(holdingId),
          currentMap.get(holdingId),
          targetDate,
          hasCurrentSnapshots
        )
      )
      .sort((a, b) => {
        const accountCompare =
          `${a.memberName}:${a.institutionName}:${a.accountName}`.localeCompare(
            `${b.memberName}:${b.institutionName}:${b.accountName}`,
            'ko-KR'
          );
        return accountCompare || a.assetName.localeCompare(b.assetName, 'ko-KR');
      });

    const prevTotalValue = Array.from(prevMap.values()).reduce(
      (sum, snapshot) => sum + snapshot.totalValueKRW,
      0
    );
    const currentTotalValue = hasCurrentSnapshots
      ? Array.from(currentMap.values()).reduce((sum, snapshot) => sum + snapshot.totalValueKRW, 0)
      : rows.reduce((sum, row) => sum + row.totalValueKRW, 0);

    return {
      year,
      month,
      date: toDateInput(targetDate),
      mode: hasCurrentSnapshots ? 'edit' : 'create',
      prevMonth: prev,
      prevTotalValue,
      currentTotalValue,
      deltaAmount: currentTotalValue - prevTotalValue,
      rows,
    };
  },

  async saveMonthlyInput(
    year: number,
    month: number,
    rows: AssetMonthlyInputSaveRow[]
  ): Promise<AssetMonthlyInputDraft> {
    const touchedHoldingIds = new Set<string>();

    for (const row of rows) {
      const date = assertDateInMonth(row.date, year, month);
      // 평균단가(cost basis)를 입력하지 않은 경우 현재가로 시작(수익 0). 디자인 시드 규칙과 동일.
      const avgCostKRW = row.avgCostKRW ?? row.priceKRW;
      let holdingId = row.holdingId ?? undefined;

      if (!holdingId) {
        const existingHolding = await holdingRepository.findByAccountAndAsset(
          row.accountId,
          row.assetMasterId
        );

        if (existingHolding) {
          holdingId = existingHolding.id;
        } else {
          const createdHolding = await holdingRepository.create({
            account: { connect: { id: row.accountId } },
            assetMaster: { connect: { id: row.assetMasterId } },
            quantity: row.quantity,
            averageCostOriginal: row.priceOriginal,
            averageCostKRW: avgCostKRW,
            dataSource: 'snapshot',
          });
          holdingId = createdHolding.id;
        }
      }

      await holdingValueSnapshotRepository.upsert(holdingId, date, {
        quantity: row.quantity,
        priceOriginal: row.priceOriginal,
        exchangeRate: row.exchangeRate ?? null,
        priceKRW: row.priceKRW,
        avgCostKRW,
        totalValueKRW: row.totalValueKRW,
        source: 'manual',
      });

      touchedHoldingIds.add(holdingId);
    }

    // 스냅샷을 SSOT로 고정: 최신 스냅샷의 수량·평균단가를 Holding 현재 상태에 반영한다.
    for (const holdingId of touchedHoldingIds) {
      const latest = await holdingValueSnapshotRepository.findLatestByHoldingId(holdingId);
      if (latest) {
        await holdingRepository.update(holdingId, {
          quantity: latest.quantity,
          averageCostKRW: latest.avgCostKRW,
        });
      }
    }

    return this.getMonthlyInputDraft(year, month);
  },

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
        priceOriginal: s.priceOriginal,
        exchangeRate: s.exchangeRate,
        priceKRW: s.priceKRW,
        totalValueKRW: s.totalValueKRW,
        percentage: totalValue > 0 ? Math.round((s.totalValueKRW / totalValue) * 10000) / 100 : 0,
        memberName: account.member.name,
        accountName: account.name,
        accountType: account.accountType,
        institutionName: account.institution.name,
      };
    });

    const byRiskLevel = buildRiskGroups(holdings, totalValue);

    return { totalValue, byRiskLevel, holdings, availableRange };
  },

  async getMonthlyAssetDataWithDelta(year: number, month: number) {
    const current = await this.getMonthlyAssetData(year, month);
    const prev = getPrevMonth(year, month);
    const prevData = await this.getMonthlyAssetData(prev.year, prev.month);

    const hasPrev = prevData.holdings.length > 0;
    const prevTotalValue = hasPrev ? prevData.totalValue : null;
    const deltaAmount = hasPrev ? current.totalValue - prevData.totalValue : null;
    const deltaPercent =
      hasPrev && prevData.totalValue > 0
        ? Math.round(((current.totalValue - prevData.totalValue) / prevData.totalValue) * 10000) /
          100
        : null;

    // Build map of prev holdings by a composite key: assetName + memberName + accountName
    const prevHoldingMap = new Map<string, number>();
    for (const h of prevData.holdings) {
      const key = `${h.assetName}::${h.memberName}::${h.accountName}`;
      prevHoldingMap.set(key, (prevHoldingMap.get(key) ?? 0) + h.totalValueKRW);
    }

    const holdingsWithDelta = current.holdings.map(h => {
      const key = `${h.assetName}::${h.memberName}::${h.accountName}`;
      const prevVal = prevHoldingMap.get(key) ?? null;
      return {
        ...h,
        prevTotalValueKRW: prevVal,
        deltaAmount: prevVal !== null ? h.totalValueKRW - prevVal : null,
      };
    });

    // Previous month risk level summary
    const prevByRiskLevel = prevData.byRiskLevel.map(g => ({
      riskLevel: g.riskLevel,
      totalValue: g.totalValue,
      percentage: g.percentage,
    }));

    return {
      ...current,
      holdings: holdingsWithDelta,
      prevTotalValue,
      deltaAmount,
      deltaPercent,
      prevByRiskLevel,
    };
  },

  async getAssetTrendData(
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ) {
    const months: { year: number; month: number }[] = [];
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    const monthlyData = await Promise.all(
      months.map(async ({ year, month }) => {
        const data = await this.getMonthlyAssetData(year, month);
        return { year, month, ...data };
      })
    );

    // Build trend entries
    const trend = monthlyData.map((current, index) => {
      const prev = index > 0 ? monthlyData[index - 1] : null;
      const deltaAmount = prev ? current.totalValue - prev.totalValue : null;
      const deltaPercent =
        prev && prev.totalValue > 0
          ? Math.round(((current.totalValue - prev.totalValue) / prev.totalValue) * 10000) / 100
          : null;

      // Find top gainer and loser by comparing holdings
      let topGainer: { name: string; amount: number } | null = null;
      let topLoser: { name: string; amount: number } | null = null;

      if (prev) {
        const prevMap = new Map<string, number>();
        for (const h of prev.holdings) {
          prevMap.set(h.assetName, (prevMap.get(h.assetName) ?? 0) + h.totalValueKRW);
        }

        const changes: { name: string; amount: number }[] = [];
        const currentMap = new Map<string, number>();
        for (const h of current.holdings) {
          currentMap.set(h.assetName, (currentMap.get(h.assetName) ?? 0) + h.totalValueKRW);
        }

        for (const [name, value] of currentMap) {
          const prevVal = prevMap.get(name) ?? 0;
          changes.push({ name, amount: value - prevVal });
        }
        // Assets that disappeared
        for (const [name, prevVal] of prevMap) {
          if (!currentMap.has(name)) {
            changes.push({ name, amount: -prevVal });
          }
        }

        changes.sort((a, b) => b.amount - a.amount);
        if (changes.length > 0 && changes[0].amount > 0) topGainer = changes[0];
        if (changes.length > 0 && changes[changes.length - 1].amount < 0)
          topLoser = changes[changes.length - 1];
      }

      // Risk level breakdown
      const byRiskLevel = current.byRiskLevel.map(g => ({
        riskLevel: g.riskLevel,
        totalValue: g.totalValue,
        percentage: g.percentage,
      }));

      // By member breakdown
      const memberMap = new Map<string, number>();
      for (const h of current.holdings) {
        memberMap.set(h.memberName, (memberMap.get(h.memberName) ?? 0) + h.totalValueKRW);
      }
      const byMember = Array.from(memberMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        year: current.year,
        month: current.month,
        totalValue: current.totalValue,
        deltaAmount,
        deltaPercent,
        byRiskLevel,
        byMember,
        topGainer,
        topLoser,
      };
    });

    return { trend };
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

  async upsert(
    holdingId: string,
    date: Date,
    data: {
      quantity: number;
      priceOriginal: number;
      exchangeRate?: number | null;
      priceKRW: number;
      avgCostKRW: number;
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
