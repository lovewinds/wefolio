import {
  assetMasterRepository,
  holdingRepository,
  holdingTransactionRepository,
  holdingValueSnapshotRepository,
} from '@/repositories/holding-repository';
import { prisma } from '@/lib/prisma';
import { deriveAvgCostKRW } from '@/lib/asset-cost';
import type { AssetMaster, Holding, HoldingTransaction, Prisma } from '@prisma/client';
import type {
  AssetClass,
  Currency,
  HoldingTransactionType,
  AssetChangeBreakdown,
  AssetChangeDelta,
  AssetMonthlyMetrics,
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
    // Find or create holding (연결만 — 현재 상태 캐시 컬럼 없음)
    let holding = await holdingRepository.findByAccountAndAsset(accountId, assetMasterId);
    if (!holding) {
      const created = await holdingRepository.create({
        account: { connect: { id: accountId } },
        assetMaster: { connect: { id: assetMasterId } },
      });
      holding = { ...created, assetMaster: {} as AssetMaster };
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
  metrics: AssetMonthlyMetrics;
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

function isValueTypeHolding(holding: MonthlyHolding): boolean {
  return getMonthlyInputType(holding.assetClass, holding.accountType) === 'value';
}

function zeroMetrics(): AssetMonthlyMetrics {
  return {
    cashValue: 0,
    investmentValue: 0,
    principalValue: 0,
    unrealizedGain: 0,
  };
}

function buildMovementInsight(delta: AssetChangeDelta): AssetChangeBreakdown['movementInsight'] {
  const cashDelta = delta.cashValue;
  const investmentDelta = delta.investmentValue;
  const netDelta = delta.totalValue;
  const offsetTolerance = Math.max(
    Math.min(Math.abs(cashDelta), Math.abs(investmentDelta)) * 0.2,
    1
  );
  const isMostlyOffset = Math.abs(netDelta) <= offsetTolerance;

  if (cashDelta < 0 && investmentDelta > 0 && isMostlyOffset) {
    return {
      type: 'cash_to_investment',
      title: '현금에서 투자로 이동한 변화가 감지됩니다',
      description: '현금은 줄고 투자 평가액은 늘어 총자산 변화가 서로 상쇄된 패턴입니다.',
      confidence: 'estimated',
    };
  }

  if (cashDelta > 0 && investmentDelta < 0 && isMostlyOffset) {
    return {
      type: 'investment_to_cash',
      title: '투자자산 일부 현금화가 감지됩니다',
      description: '현금은 늘고 투자 평가액은 줄어 총자산 변화가 서로 상쇄된 패턴입니다.',
      confidence: 'estimated',
    };
  }

  if (netDelta > 0) {
    return {
      type: 'net_increase',
      title: '이번 달 총자산이 증가했습니다',
      description: '현금 잔고 변화와 투자 평가액 변화를 합산한 확정 변화입니다.',
      confidence: 'confirmed',
    };
  }

  if (netDelta < 0) {
    return {
      type: 'net_decrease',
      title: '이번 달 총자산이 감소했습니다',
      description: '현금 잔고 변화와 투자 평가액 변화를 합산한 확정 변화입니다.',
      confidence: 'confirmed',
    };
  }

  return {
    type: 'mixed',
    title: '이번 달 총자산은 유지되었습니다',
    description: '현금 잔고와 투자 평가액 사이의 변화가 총자산 안에서 상쇄되었습니다.',
    confidence: 'confirmed',
  };
}

function buildHoldingChangeSummary(
  currentHoldings: MonthlyHolding[],
  prevHoldings: MonthlyHolding[]
): AssetChangeBreakdown['holdingChanges'] {
  const keyFor = (h: MonthlyHolding) => `${h.assetName}::${h.memberName}::${h.accountName}`;
  const currentMap = new Map<string, MonthlyHolding>();
  const prevMap = new Map<string, MonthlyHolding>();

  for (const holding of currentHoldings.filter(h => !isValueTypeHolding(h))) {
    currentMap.set(keyFor(holding), holding);
  }
  for (const holding of prevHoldings.filter(h => !isValueTypeHolding(h))) {
    prevMap.set(keyFor(holding), holding);
  }

  let newCount = 0;
  let increasedCount = 0;
  let decreasedCount = 0;
  let closedCount = 0;

  for (const [key, current] of currentMap) {
    const prev = prevMap.get(key);
    if (!prev || prev.quantity <= 0) {
      if (current.quantity > 0) newCount++;
      continue;
    }
    if (current.quantity > prev.quantity) increasedCount++;
    if (current.quantity < prev.quantity) decreasedCount++;
  }

  for (const [key, prev] of prevMap) {
    const current = currentMap.get(key);
    if (prev.quantity > 0 && (!current || current.quantity <= 0)) {
      closedCount++;
    }
  }

  return { newCount, increasedCount, decreasedCount, closedCount };
}

// 두 스냅샷의 (수량·가격)만으로 투자 평가액 변화를 가격 효과·매매 효과로 분해한다(원가 불필요).
// 가격 효과 = Σ q_prev × (p_curr − p_prev)  (직전 보유 수량의 가격 변동분 = 시장 손익)
// 매매 효과 = Σ (q_curr − q_prev) × p_curr  (수량 변화분의 월말가 평가. 교차항 Δq·Δp 포함)
// 신규 보유는 매매 효과 = q_curr × p_curr, 정리는 매매 효과 = −q_prev × p_prev (가격 효과 0).
function computeMarketAndFlow(
  currentHoldings: MonthlyHolding[],
  prevHoldings: MonthlyHolding[]
): { marketGain: number; tradeFlow: number } {
  const keyFor = (h: MonthlyHolding) => `${h.assetName}::${h.memberName}::${h.accountName}`;
  const prevMap = new Map<string, MonthlyHolding>();
  for (const holding of prevHoldings) {
    if (isValueTypeHolding(holding) || holding.quantity <= 0) continue;
    prevMap.set(keyFor(holding), holding);
  }

  let marketGain = 0;
  let tradeFlow = 0;
  const matched = new Set<string>();

  for (const current of currentHoldings) {
    if (isValueTypeHolding(current) || current.quantity <= 0) continue;
    const key = keyFor(current);
    const prev = prevMap.get(key);
    if (!prev) {
      tradeFlow += current.totalValueKRW; // 신규 보유
      continue;
    }
    matched.add(key);
    marketGain += prev.quantity * (current.priceKRW - prev.priceKRW);
    tradeFlow += (current.quantity - prev.quantity) * current.priceKRW;
  }

  for (const [key, prev] of prevMap) {
    if (matched.has(key)) continue;
    tradeFlow -= prev.totalValueKRW; // 정리
  }

  return { marketGain, tradeFlow };
}

function buildChangeBreakdown(
  current: MonthlyAssetData,
  prev: MonthlyAssetData
): AssetChangeBreakdown {
  const cashValue = current.metrics.cashValue - prev.metrics.cashValue;
  const investmentValue = current.metrics.investmentValue - prev.metrics.investmentValue;
  const { marketGain, tradeFlow } = computeMarketAndFlow(current.holdings, prev.holdings);

  // ΔN = 외부 순유입(ΔC + Σ매매 효과) + 시장 손익(Σ가격 효과). 항등식 보존.
  const delta: AssetChangeDelta = {
    totalValue: current.totalValue - prev.totalValue,
    cashValue,
    investmentValue,
    externalInflow: cashValue + tradeFlow,
    marketGain,
  };

  return {
    prev: { totalValue: prev.totalValue, ...prev.metrics },
    current: { totalValue: current.totalValue, ...current.metrics },
    delta,
    movementInsight: buildMovementInsight(delta),
    holdingChanges: buildHoldingChangeSummary(current.holdings, prev.holdings),
  };
}

type SnapshotWithHolding = Prisma.HoldingSnapshotGetPayload<{
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

// 평가액(원금/총액)은 저장하지 않고 입력값에서 파생한다: 평가액 = 수량 × 현재가(원화).
function snapshotTotalValueKRW(s: { quantity: number; currentPriceKRW: number }): number {
  return s.quantity * s.currentPriceKRW;
}

// 표시용 "개당 가격": 외화 종목은 원통화 현재가(priceOriginal), 원화 종목은 원화 현재가.
function snapshotDisplayPriceOriginal(s: {
  priceOriginal: number | null;
  currentPriceKRW: number;
}): number {
  return s.priceOriginal ?? s.currentPriceKRW;
}

async function getSnapshotsByMonth(year: number, month: number): Promise<SnapshotWithHolding[]> {
  const startOfMonth = getMonthStart(year, month);
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  return prisma.holdingSnapshot.findMany({
    where: {
      snapshotDate: {
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
    orderBy: [{ holdingId: 'asc' }, { snapshotDate: 'desc' }],
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
  const totalValueKRW = values ? snapshotTotalValueKRW(values) : 0;
  const prevTotalValueKRW = prevSnapshot ? snapshotTotalValueKRW(prevSnapshot) : null;

  return {
    holdingId,
    accountId: holding.accountId,
    assetMasterId: holding.assetMasterId,
    currentSnapshotId: currentSnapshot?.id ?? null,
    date: currentSnapshot ? toDateInput(currentSnapshot.snapshotDate) : toDateInput(targetDate),
    assetName: assetMaster.name,
    assetClass: assetMaster.assetClass,
    subClass: assetMaster.subClass,
    riskLevel: assetMaster.riskLevel,
    currency: assetMaster.currency,
    memberName: account.member.name,
    accountName: account.name,
    accountType: account.accountType,
    institutionName: account.institution.name,
    institutionType: account.institution.type,
    inputType: getMonthlyInputType(assetMaster.assetClass, account.accountType),
    prevQuantity: prevSnapshot?.quantity ?? null,
    prevPriceOriginal: prevSnapshot ? snapshotDisplayPriceOriginal(prevSnapshot) : null,
    prevExchangeRate: prevSnapshot?.exchangeRate ?? null,
    prevPriceKRW: prevSnapshot?.currentPriceKRW ?? null,
    prevAvgCostKRW: prevSnapshot?.avgCostKRW ?? null,
    prevTotalValueKRW,
    quantity: values?.quantity ?? 0,
    priceOriginal: values ? snapshotDisplayPriceOriginal(values) : 0,
    exchangeRate: values?.exchangeRate ?? null,
    priceKRW: values?.currentPriceKRW ?? 0,
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
      (sum, snapshot) => sum + snapshotTotalValueKRW(snapshot),
      0
    );
    const currentTotalValue = hasCurrentSnapshots
      ? Array.from(currentMap.values()).reduce(
          (sum, snapshot) => sum + snapshotTotalValueKRW(snapshot),
          0
        )
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
    for (const row of rows) {
      const date = assertDateInMonth(row.date, year, month);
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
          });
          holdingId = createdHolding.id;
        }
      }

      // 평균단가: 사용자가 직접 보정했으면 그 값을 우선. 아니면 직전 스냅샷의 수량·평단가와
      // 이번 달 수량·현재가로 자동 파생(신규=현재가, 수량 증가=가중평균, 동일/감소=유지).
      let avgCostKRW: number;
      if (row.avgCostManual && row.avgCostKRW != null) {
        avgCostKRW = row.avgCostKRW;
      } else {
        const prevSnapshot = await holdingValueSnapshotRepository.findLatestBeforeDate(
          holdingId,
          date
        );
        avgCostKRW = deriveAvgCostKRW(
          prevSnapshot
            ? { quantity: prevSnapshot.quantity, avgCostKRW: prevSnapshot.avgCostKRW }
            : null,
          row.quantity,
          row.priceKRW
        );
      }

      // 외화 종목은 원통화 입력값을 보존한다(원화 종목은 null). 환율로 원통화 평균단가를 역산해 함께 저장.
      const isForeign = row.exchangeRate != null && row.exchangeRate > 0;
      await holdingValueSnapshotRepository.upsert(holdingId, date, {
        quantity: row.quantity,
        avgCostKRW,
        currentPriceKRW: row.priceKRW,
        exchangeRate: row.exchangeRate ?? null,
        priceOriginal: isForeign ? row.priceOriginal : null,
        avgCostOriginal: isForeign ? avgCostKRW / (row.exchangeRate as number) : null,
      });
    }

    // 스냅샷이 SSOT다. Holding 현재 상태는 최신 스냅샷에서 파생하므로 별도 동기화가 없다.
    return this.getMonthlyInputDraft(year, month);
  },

  async getMonthlyAssetData(year: number, month: number): Promise<MonthlyAssetData> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(year, month, 1));

    const snapshots = await prisma.holdingSnapshot.findMany({
      where: {
        snapshotDate: {
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
    const cashSnapshots = await prisma.cashSnapshot.findMany({
      where: {
        snapshotDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      select: { cashBalanceKRW: true },
    });

    const [minSnapshot, maxSnapshot] = await Promise.all([
      prisma.holdingSnapshot.findFirst({
        orderBy: { snapshotDate: 'asc' },
        select: { snapshotDate: true },
      }),
      prisma.holdingSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      }),
    ]);

    const availableRange =
      minSnapshot && maxSnapshot
        ? {
            min: {
              year: minSnapshot.snapshotDate.getUTCFullYear(),
              month: minSnapshot.snapshotDate.getUTCMonth() + 1,
            },
            max: {
              year: maxSnapshot.snapshotDate.getUTCFullYear(),
              month: maxSnapshot.snapshotDate.getUTCMonth() + 1,
            },
          }
        : null;

    if (snapshots.length === 0 && cashSnapshots.length === 0) {
      return {
        totalValue: 0,
        metrics: zeroMetrics(),
        byRiskLevel: [],
        holdings: [],
        availableRange,
      };
    }

    const holdings: MonthlyHolding[] = snapshots.map(s => {
      const { holding } = s;
      const { assetMaster, account } = holding;
      const totalValueKRW = snapshotTotalValueKRW(s);
      return {
        id: s.id,
        assetName: assetMaster.name,
        assetClass: assetMaster.assetClass,
        subClass: assetMaster.subClass,
        riskLevel: assetMaster.riskLevel,
        currency: assetMaster.currency,
        quantity: s.quantity,
        priceOriginal: snapshotDisplayPriceOriginal(s),
        exchangeRate: s.exchangeRate,
        priceKRW: s.currentPriceKRW,
        totalValueKRW,
        percentage: 0,
        memberName: account.member.name,
        accountName: account.name,
        accountType: account.accountType,
        institutionName: account.institution.name,
      };
    });

    const cashSnapshotValue = cashSnapshots.reduce((sum, s) => sum + s.cashBalanceKRW, 0);
    const metrics = holdings.reduce<AssetMonthlyMetrics>(
      (acc, holding) => {
        if (isValueTypeHolding(holding)) {
          acc.cashValue += holding.totalValueKRW;
          return acc;
        }

        const snapshot = snapshots.find(s => s.id === holding.id);
        const principalValue = snapshot ? snapshot.quantity * snapshot.avgCostKRW : 0;

        acc.investmentValue += holding.totalValueKRW;
        acc.principalValue += principalValue;
        return acc;
      },
      { ...zeroMetrics(), cashValue: cashSnapshotValue }
    );
    metrics.unrealizedGain = metrics.investmentValue - metrics.principalValue;

    const totalValue = metrics.cashValue + metrics.investmentValue;
    const holdingsWithPercentage = holdings.map(h => ({
      ...h,
      percentage: totalValue > 0 ? Math.round((h.totalValueKRW / totalValue) * 10000) / 100 : 0,
    }));
    const byRiskLevel = buildRiskGroups(holdings, totalValue);

    return { totalValue, metrics, byRiskLevel, holdings: holdingsWithPercentage, availableRange };
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
      changeBreakdown: hasPrev ? buildChangeBreakdown(current, prevData) : null,
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
        metrics: current.metrics,
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
    snapshotDate: Date,
    data: {
      quantity: number;
      avgCostKRW: number;
      currentPriceKRW: number;
      exchangeRate?: number | null;
      priceOriginal?: number | null;
      avgCostOriginal?: number | null;
    }
  ) {
    return holdingValueSnapshotRepository.upsert(holdingId, snapshotDate, data);
  },

  async delete(id: string) {
    return holdingValueSnapshotRepository.delete(id);
  },
};
