import type { PrismaClient } from '@prisma/client';
import { deriveAvgCostKRW } from '../../src/lib/asset-cost';
import { getAssetInputType } from '../../src/lib/asset-input-type';

/**
 * 보유별로 스냅샷을 시간순(snapshotDate asc)으로 재생해 `avgCostKRW`를 자동 파생 규칙으로 재계산한다.
 * - 최초 스냅샷 = 그달 현재가(원가 시작점), 수량 증가 = 가중평균, 동일/감소 = 직전 평단 유지.
 * - value형(현금성) 보유는 원가=평가액을 유지하므로 건너뛴다.
 *
 * 시드/로드 끝에서 호출되어 재로드에도 적용되고, 단독 스크립트로도 실행할 수 있다.
 * 규칙은 `src/lib/asset-cost.ts`의 `deriveAvgCostKRW`(저장 경로와 동일).
 */
export async function backfillAvgCostKRW(prisma: PrismaClient): Promise<{ updated: number }> {
  const holdings = await prisma.holding.findMany({
    include: { assetMaster: true, account: true },
  });

  let updated = 0;
  for (const holding of holdings) {
    if (
      getAssetInputType(holding.assetMaster.assetClass, holding.account.accountType) === 'value'
    ) {
      continue; // 현금성: 원가=평가액 유지
    }

    const snapshots = await prisma.holdingSnapshot.findMany({
      where: { holdingId: holding.id },
      orderBy: { snapshotDate: 'asc' },
    });

    let prev: { quantity: number; avgCostKRW: number } | null = null;
    for (const snap of snapshots) {
      const avgCostKRW = deriveAvgCostKRW(prev, snap.quantity, snap.currentPriceKRW);
      const avgCostOriginal =
        snap.exchangeRate != null && snap.exchangeRate > 0 ? avgCostKRW / snap.exchangeRate : null;

      if (avgCostKRW !== snap.avgCostKRW || avgCostOriginal !== snap.avgCostOriginal) {
        await prisma.holdingSnapshot.update({
          where: { id: snap.id },
          data: { avgCostKRW, avgCostOriginal },
        });
        updated++;
      }
      prev = { quantity: snap.quantity, avgCostKRW };
    }
  }

  return { updated };
}
