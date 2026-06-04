import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  holdingRepository,
  holdingTransactionRepository,
  holdingValueSnapshotRepository,
} from '@/repositories/holding-repository';
import { holdingTransactionService, holdingValueSnapshotService } from '@/services/holding-service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    holdingValueSnapshot: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/repositories/holding-repository', () => ({
  assetMasterRepository: {},
  holdingRepository: {
    findByAccountId: vi.fn(),
    findByAccountAndAsset: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateQuantity: vi.fn(),
  },
  holdingTransactionRepository: {
    findByHoldingId: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  holdingValueSnapshotRepository: {
    upsert: vi.fn(),
    findLatestByHoldingId: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('holdingTransactionService', () => {
  it('updates quantity and weighted average cost after buy, sell and transfer transactions', async () => {
    vi.mocked(holdingTransactionRepository.findByHoldingId).mockResolvedValue([
      {
        id: 'tx-4',
        holdingId: 'holding-1',
        transactionType: 'transfer_out',
        date: new Date('2026-04-04T00:00:00.000Z'),
        quantity: -2,
        priceOriginal: 3000,
        exchangeRate: null,
        priceKRW: 3000,
        totalKRW: 6000,
        notes: null,
        createdAt: new Date('2026-04-04T00:00:00.000Z'),
      },
      {
        id: 'tx-3',
        holdingId: 'holding-1',
        transactionType: 'sell',
        date: new Date('2026-04-03T00:00:00.000Z'),
        quantity: -3,
        priceOriginal: 5000,
        exchangeRate: null,
        priceKRW: 5000,
        totalKRW: 15000,
        notes: null,
        createdAt: new Date('2026-04-03T00:00:00.000Z'),
      },
      {
        id: 'tx-2',
        holdingId: 'holding-1',
        transactionType: 'transfer_in',
        date: new Date('2026-04-02T00:00:00.000Z'),
        quantity: 4,
        priceOriginal: 1500,
        exchangeRate: null,
        priceKRW: 1500,
        totalKRW: 6000,
        notes: null,
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
      },
      {
        id: 'tx-1',
        holdingId: 'holding-1',
        transactionType: 'buy',
        date: new Date('2026-04-01T00:00:00.000Z'),
        quantity: 10,
        priceOriginal: 1000,
        exchangeRate: null,
        priceKRW: 1000,
        totalKRW: 10000,
        notes: null,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    ]);

    await holdingTransactionService.updateHoldingAfterTransaction('holding-1');

    expect(holdingRepository.updateQuantity).toHaveBeenCalledWith(
      'holding-1',
      9,
      16000 / 14,
      16000 / 14
    );
  });
});

describe('holdingValueSnapshotService', () => {
  it('builds monthly trend deltas, top movers and member/risk summaries', async () => {
    const monthlySpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyAssetData')
      .mockImplementation(async (year, month) => {
        if (year === 2026 && month === 1) {
          return {
            totalValue: 1000,
            byRiskLevel: [
              { riskLevel: 'Moderate', totalValue: 1000, percentage: 100, children: [] },
            ],
            holdings: [
              monthlyHolding('Asset A', 'Mom', 600),
              monthlyHolding('Asset B', 'Dad', 400),
            ],
            availableRange: null,
          };
        }

        return {
          totalValue: 1300,
          byRiskLevel: [
            { riskLevel: 'Moderate', totalValue: 1050, percentage: 80.77, children: [] },
            { riskLevel: 'Aggressive', totalValue: 250, percentage: 19.23, children: [] },
          ],
          holdings: [
            monthlyHolding('Asset A', 'Mom', 700),
            monthlyHolding('Asset B', 'Dad', 350),
            monthlyHolding('Asset C', 'Mom', 250),
          ],
          availableRange: null,
        };
      });

    const result = await holdingValueSnapshotService.getAssetTrendData(2026, 1, 2026, 2);

    expect(monthlySpy).toHaveBeenCalledTimes(2);
    expect(result.trend[0]).toMatchObject({
      year: 2026,
      month: 1,
      totalValue: 1000,
      deltaAmount: null,
      deltaPercent: null,
      topGainer: null,
      topLoser: null,
    });
    expect(result.trend[1]).toMatchObject({
      year: 2026,
      month: 2,
      totalValue: 1300,
      deltaAmount: 300,
      deltaPercent: 30,
      byRiskLevel: [
        { riskLevel: 'Moderate', totalValue: 1050, percentage: 80.77 },
        { riskLevel: 'Aggressive', totalValue: 250, percentage: 19.23 },
      ],
      byMember: [
        { name: 'Mom', value: 950 },
        { name: 'Dad', value: 350 },
      ],
      topGainer: { name: 'Asset C', amount: 250 },
      topLoser: { name: 'Asset B', amount: -50 },
    });

    monthlySpy.mockRestore();
  });
});

describe('holdingTransactionService 비권위 격리', () => {
  it('record는 거래만 생성하고 Holding을 재계산하지 않는다', async () => {
    const now = new Date('2026-05-01T00:00:00.000Z');
    vi.mocked(holdingRepository.findByAccountAndAsset).mockResolvedValue({
      id: 'holding-1',
      accountId: 'account-1',
      assetMasterId: 'asset-1',
      quantity: 5,
      averageCostOriginal: 1000,
      averageCostKRW: 1000,
      dataSource: 'transaction',
      createdAt: now,
      updatedAt: now,
    } as unknown as Awaited<ReturnType<typeof holdingRepository.findByAccountAndAsset>>);
    vi.mocked(holdingTransactionRepository.create).mockResolvedValue({ id: 'tx-1' } as never);
    vi.mocked(holdingTransactionRepository.findByHoldingId).mockResolvedValue([]);

    await holdingTransactionService.record('account-1', 'asset-1', 'buy', now, 3, 1000, 1000);

    expect(holdingRepository.updateQuantity).not.toHaveBeenCalled();
    expect(holdingRepository.update).not.toHaveBeenCalled();
  });

  it('delete는 거래만 삭제하고 Holding을 재계산하지 않는다', async () => {
    vi.mocked(holdingTransactionRepository.delete).mockResolvedValue({
      id: 'tx-1',
      holdingId: 'holding-1',
    } as never);
    vi.mocked(holdingTransactionRepository.findByHoldingId).mockResolvedValue([]);

    await holdingTransactionService.delete('tx-1');

    expect(holdingRepository.updateQuantity).not.toHaveBeenCalled();
  });
});

describe('holdingValueSnapshotService.saveMonthlyInput', () => {
  it('스냅샷 저장 후 최신 스냅샷의 수량·평균단가로 Holding을 동기화한다', async () => {
    const draftSpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyInputDraft')
      .mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.upsert).mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.findLatestByHoldingId).mockResolvedValue({
      id: 'snap-1',
      holdingId: 'holding-1',
      date: new Date('2026-05-31T00:00:00.000Z'),
      quantity: 12,
      priceOriginal: 100,
      exchangeRate: null,
      priceKRW: 100,
      avgCostKRW: 90,
      totalValueKRW: 1200,
      source: 'manual',
      createdAt: new Date('2026-05-31T00:00:00.000Z'),
    } as never);

    await holdingValueSnapshotService.saveMonthlyInput(2026, 5, [
      {
        holdingId: 'holding-1',
        accountId: 'account-1',
        assetMasterId: 'asset-1',
        date: '2026-05-31',
        quantity: 12,
        priceOriginal: 100,
        exchangeRate: null,
        priceKRW: 100,
        avgCostKRW: 90,
        totalValueKRW: 1200,
      },
    ] as unknown as Parameters<typeof holdingValueSnapshotService.saveMonthlyInput>[2]);

    expect(holdingRepository.update).toHaveBeenCalledWith('holding-1', {
      quantity: 12,
      averageCostKRW: 90,
    });
    draftSpy.mockRestore();
  });

  it('avgCostKRW 미입력 시 현재가(priceKRW)를 평균단가로 사용해 스냅샷에 저장한다', async () => {
    const draftSpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyInputDraft')
      .mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.upsert).mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.findLatestByHoldingId).mockResolvedValue(null);

    await holdingValueSnapshotService.saveMonthlyInput(2026, 5, [
      {
        holdingId: 'holding-1',
        accountId: 'account-1',
        assetMasterId: 'asset-1',
        date: '2026-05-31',
        quantity: 12,
        priceOriginal: 100,
        exchangeRate: null,
        priceKRW: 100,
        totalValueKRW: 1200,
      },
    ] as unknown as Parameters<typeof holdingValueSnapshotService.saveMonthlyInput>[2]);

    expect(holdingValueSnapshotRepository.upsert).toHaveBeenCalledWith(
      'holding-1',
      expect.any(Date),
      expect.objectContaining({ avgCostKRW: 100 })
    );
    draftSpy.mockRestore();
  });
});

function monthlyHolding(assetName: string, memberName: string, totalValueKRW: number) {
  return {
    id: `${assetName}-${memberName}`,
    assetName,
    assetClass: 'stock',
    subClass: null,
    riskLevel: 'Moderate',
    currency: 'KRW',
    quantity: 1,
    priceOriginal: totalValueKRW,
    exchangeRate: null,
    priceKRW: totalValueKRW,
    totalValueKRW,
    percentage: 0,
    memberName,
    accountName: `${memberName} Account`,
    accountType: 'brokerage',
    institutionName: 'Broker',
  };
}
