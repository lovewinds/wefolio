import { PrismaClient } from '@prisma/client';
import { backfillAvgCostKRW } from '../seed/backfill-avg-cost';

// 현재 DB의 보유 스냅샷 평균단가를 자동 파생 규칙으로 재계산한다(일회성/수동 백필).
// 로드/시드 경로는 이미 백필을 자동 호출하므로, 기존에 적재된 데이터를 갱신할 때만 직접 실행한다.
async function main() {
  const prisma = new PrismaClient();
  try {
    const { updated } = await backfillAvgCostKRW(prisma);
    console.log(`✅ 평균단가 백필 완료: ${updated}개 스냅샷 갱신`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
