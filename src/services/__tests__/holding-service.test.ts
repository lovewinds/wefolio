import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  holdingRepository,
  holdingTransactionRepository,
  holdingValueSnapshotRepository,
} from '@/repositories/holding-repository';
import { holdingTransactionService, holdingValueSnapshotService } from '@/services/holding-service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    holdingSnapshot: {
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

describe('holdingValueSnapshotService', () => {
  it('builds monthly trend deltas, top movers and member/risk summaries', async () => {
    const monthlySpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyAssetData')
      .mockImplementation(async (year, month) => {
        if (year === 2026 && month === 1) {
          return {
            totalValue: 1000,
            metrics: {
              cashValue: 0,
              investmentValue: 1000,
              principalValue: 1000,
              unrealizedGain: 0,
            },
            byRiskLevel: [
              { riskLevel: '안전자산', totalValue: 1000, percentage: 100, children: [] },
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
          metrics: {
            cashValue: 0,
            investmentValue: 1300,
            principalValue: 1300,
            unrealizedGain: 0,
          },
          byRiskLevel: [
            { riskLevel: '안전자산', totalValue: 1050, percentage: 80.77, children: [] },
            { riskLevel: '위험자산', totalValue: 250, percentage: 19.23, children: [] },
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
        { riskLevel: '안전자산', totalValue: 1050, percentage: 80.77 },
        { riskLevel: '위험자산', totalValue: 250, percentage: 19.23 },
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

  it('detects investment-to-cash movement and holding changes from monthly snapshots', async () => {
    const monthlySpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyAssetData')
      .mockImplementation(async (year, month) => {
        if (year === 2026 && month === 4) {
          return {
            totalValue: 1000,
            metrics: {
              cashValue: 100,
              investmentValue: 900,
              principalValue: 700,
              unrealizedGain: 200,
            },
            byRiskLevel: [],
            holdings: [
              monthlyHolding('Core ETF', 'Mom', 900, {
                quantity: 10,
                priceKRW: 90,
                avgCostKRW: 70,
              }),
            ],
            availableRange: null,
          };
        }

        return {
          totalValue: 1000,
          metrics: {
            cashValue: 500,
            investmentValue: 500,
            principalValue: 400,
            unrealizedGain: 100,
          },
          byRiskLevel: [],
          holdings: [
            monthlyHolding('Core ETF', 'Mom', 500, {
              quantity: 5,
              priceKRW: 100,
              avgCostKRW: 80,
            }),
          ],
          availableRange: null,
        };
      });

    const result = await holdingValueSnapshotService.getMonthlyAssetDataWithDelta(2026, 5);

    expect(result.changeBreakdown).toMatchObject({
      prev: {
        totalValue: 1000,
        cashValue: 100,
        investmentValue: 900,
        principalValue: 700,
        unrealizedGain: 200,
      },
      current: {
        totalValue: 1000,
        cashValue: 500,
        investmentValue: 500,
        principalValue: 400,
        unrealizedGain: 100,
      },
      delta: {
        totalValue: 0,
        cashValue: 400,
        investmentValue: -400,
        externalInflow: -100,
        marketGain: 100,
      },
      movementInsight: {
        type: 'investment_to_cash',
        confidence: 'estimated',
      },
      holdingChanges: {
        newCount: 0,
        increasedCount: 0,
        decreasedCount: 1,
        closedCount: 0,
      },
    });

    expect(result.changeBreakdown?.movementInsight?.title).toContain('현금화');
    monthlySpy.mockRestore();
  });

  it('decomposes 외부 순유입·시장 손익 across held/new/closed holdings', async () => {
    const monthlySpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyAssetData')
      .mockImplementation(async (year, month) => {
        if (year === 2026 && month === 4) {
          return {
            totalValue: 1850,
            metrics: {
              cashValue: 50,
              investmentValue: 1800,
              principalValue: 1800,
              unrealizedGain: 0,
            },
            byRiskLevel: [],
            holdings: [
              // 직전: A 10주@100(보유), C 4주@200(이번 달 정리)
              monthlyHolding('Asset A', 'Mom', 1000, { quantity: 10, priceKRW: 100 }),
              monthlyHolding('Asset C', 'Mom', 800, { quantity: 4, priceKRW: 200 }),
            ],
            availableRange: null,
          };
        }

        return {
          totalValue: 1598,
          metrics: {
            cashValue: 28,
            investmentValue: 1570,
            principalValue: 1570,
            unrealizedGain: 0,
          },
          byRiskLevel: [],
          holdings: [
            // 이번 달: A 12주@110(+2주·+10가격), B 5주@50(신규)
            monthlyHolding('Asset A', 'Mom', 1320, { quantity: 12, priceKRW: 110 }),
            monthlyHolding('Asset B', 'Dad', 250, { quantity: 5, priceKRW: 50 }),
          ],
          availableRange: null,
        };
      });

    const result = await holdingValueSnapshotService.getMonthlyAssetDataWithDelta(2026, 5);

    // 시장 손익 = A 가격효과 10×(110−100)=100. 매매효과 = A 220 + B(신규) 250 + C(정리) −800 = −330.
    // 외부 순유입 = ΔC(−22) + 매매효과(−330) = −352. ΔN = −352 + 100 = −252 (항등식).
    expect(result.changeBreakdown?.delta).toEqual({
      totalValue: -252,
      cashValue: -22,
      investmentValue: -230,
      externalInflow: -352,
      marketGain: 100,
    });
    expect(result.changeBreakdown?.holdingChanges).toEqual({
      newCount: 1,
      increasedCount: 1,
      decreasedCount: 0,
      closedCount: 1,
    });
    expect(result.changeBreakdown?.movementInsight?.type).toBe('net_decrease');
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
      createdAt: now,
      updatedAt: now,
    } as unknown as Awaited<ReturnType<typeof holdingRepository.findByAccountAndAsset>>);
    vi.mocked(holdingTransactionRepository.create).mockResolvedValue({ id: 'tx-1' } as never);
    vi.mocked(holdingTransactionRepository.findByHoldingId).mockResolvedValue([]);

    await holdingTransactionService.record('account-1', 'asset-1', 'buy', now, 3, 1000, 1000);

    expect(holdingTransactionRepository.create).toHaveBeenCalled();
    expect(holdingRepository.update).not.toHaveBeenCalled();
  });

  it('delete는 거래만 삭제하고 Holding을 재계산하지 않는다', async () => {
    vi.mocked(holdingTransactionRepository.delete).mockResolvedValue({
      id: 'tx-1',
      holdingId: 'holding-1',
    } as never);
    vi.mocked(holdingTransactionRepository.findByHoldingId).mockResolvedValue([]);

    await holdingTransactionService.delete('tx-1');

    expect(holdingTransactionRepository.delete).toHaveBeenCalledWith('tx-1');
    expect(holdingRepository.update).not.toHaveBeenCalled();
  });
});

describe('holdingValueSnapshotService.saveMonthlyInput', () => {
  it('스냅샷을 SSOT로 저장하고 Holding 현재 상태를 별도 동기화하지 않는다', async () => {
    const draftSpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyInputDraft')
      .mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.upsert).mockResolvedValue({} as never);

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

    expect(holdingValueSnapshotRepository.upsert).toHaveBeenCalledWith(
      'holding-1',
      expect.any(Date),
      expect.objectContaining({ quantity: 12, avgCostKRW: 90, currentPriceKRW: 100 })
    );
    // 스냅샷이 SSOT이므로 Holding 현재 상태 동기화(update) 호출이 없다.
    expect(holdingRepository.update).not.toHaveBeenCalled();
    draftSpy.mockRestore();
  });

  it('avgCostKRW 미입력 시 현재가(priceKRW)를 평균단가로 사용해 스냅샷에 저장한다', async () => {
    const draftSpy = vi
      .spyOn(holdingValueSnapshotService, 'getMonthlyInputDraft')
      .mockResolvedValue({} as never);
    vi.mocked(holdingValueSnapshotRepository.upsert).mockResolvedValue({} as never);

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

function monthlyHolding(
  assetName: string,
  memberName: string,
  totalValueKRW: number,
  overrides: Partial<ReturnType<typeof monthlyHoldingBase>> = {}
) {
  return {
    ...monthlyHoldingBase(assetName, memberName, totalValueKRW),
    ...overrides,
  };
}

function monthlyHoldingBase(assetName: string, memberName: string, totalValueKRW: number) {
  return {
    id: `${assetName}-${memberName}`,
    assetName,
    assetClass: '주식',
    subClass: null,
    riskLevel: '위험자산',
    currency: 'KRW',
    quantity: 1,
    priceOriginal: totalValueKRW,
    exchangeRate: null,
    priceKRW: totalValueKRW,
    avgCostKRW: totalValueKRW,
    totalValueKRW,
    percentage: 0,
    memberName,
    accountName: `${memberName} Account`,
    accountType: '종합',
    institutionName: 'Broker',
  };
}
