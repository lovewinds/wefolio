import { PrismaClient } from '@prisma/client';
import type { SeedAssetSnapshotInput } from './read-xlsx-asset';

// 기관 유형 추론 (증권사 키워드 포함 시 brokerage)
function inferInstitutionType(name: string): 'bank' | 'brokerage' {
  const brokerageKeywords = ['증권', '나무', '키움', '미래에셋', 'NH투자', '삼성증권', 'KB증권'];
  const lowerName = name.toLowerCase();

  for (const keyword of brokerageKeywords) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return 'brokerage';
    }
  }
  return 'bank';
}

// 가족 구성원 색상 자동 할당
const MEMBER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
let colorIndex = 0;

function getNextMemberColor(): string {
  const color = MEMBER_COLORS[colorIndex % MEMBER_COLORS.length];
  colorIndex++;
  return color;
}

export async function insertAssetSeedData(
  prisma: PrismaClient,
  snapshots?: SeedAssetSnapshotInput[]
) {
  console.log('🏦 자산 관리 시드 데이터 삽입 중...\n');

  // 스냅샷 데이터가 없으면 종료
  if (!snapshots || snapshots.length === 0) {
    console.log('   ⚠️ 자산 스냅샷 데이터가 없습니다. 건너뜁니다.\n');
    return;
  }

  console.log(`   📊 총 ${snapshots.length}개 스냅샷 데이터 처리 중...\n`);

  // 캐시 맵 (중복 생성 방지)
  const memberCache = new Map<string, string>(); // name -> id
  const institutionCache = new Map<string, string>(); // name -> id
  const assetMasterCache = new Map<string, string>(); // name+currency -> id
  const accountCache = new Map<string, string>(); // memberId+institutionId+accountName -> id
  const holdingCache = new Map<string, string>(); // accountId+assetMasterId -> id

  // 통계
  let membersCreated = 0;
  let institutionsCreated = 0;
  let assetMastersCreated = 0;
  let accountsCreated = 0;
  let holdingsCreated = 0;
  let snapshotsCreated = 0;

  for (const snapshot of snapshots) {
    // 1. 가족 구성원 upsert
    let memberId = memberCache.get(snapshot.memberName);
    if (!memberId) {
      const existing = await prisma.member.findUnique({
        where: { name: snapshot.memberName },
      });

      if (existing) {
        memberId = existing.id;
      } else {
        const created = await prisma.member.create({
          data: {
            name: snapshot.memberName,
            color: getNextMemberColor(),
          },
        });
        memberId = created.id;
        membersCreated++;
        console.log(`   👤 가족 구성원 생성: ${snapshot.memberName}`);
      }
      memberCache.set(snapshot.memberName, memberId);
    }

    // 2. 금융기관 upsert
    let institutionId = institutionCache.get(snapshot.institutionName);
    if (!institutionId) {
      const existing = await prisma.institution.findUnique({
        where: { name: snapshot.institutionName },
      });

      if (existing) {
        institutionId = existing.id;
      } else {
        const created = await prisma.institution.create({
          data: {
            name: snapshot.institutionName,
            type: inferInstitutionType(snapshot.institutionName),
          },
        });
        institutionId = created.id;
        institutionsCreated++;
        console.log(`   🏛️ 금융기관 생성: ${snapshot.institutionName}`);
      }
      institutionCache.set(snapshot.institutionName, institutionId);
    }

    // 3. 자산 마스터 upsert
    const assetMasterKey = `${snapshot.assetName}:${snapshot.currency}`;
    let assetMasterId = assetMasterCache.get(assetMasterKey);
    if (!assetMasterId) {
      // symbol이 없으므로 name + currency로 조회
      const existingByName = await prisma.assetMaster.findFirst({
        where: {
          name: snapshot.assetName,
          currency: snapshot.currency,
        },
      });

      if (existingByName) {
        assetMasterId = existingByName.id;
      } else {
        const created = await prisma.assetMaster.create({
          data: {
            name: snapshot.assetName,
            assetClass: snapshot.assetClass,
            subClass: snapshot.subClass,
            riskLevel: snapshot.riskLevel,
            currency: snapshot.currency,
          },
        });
        assetMasterId = created.id;
        assetMastersCreated++;
        console.log(`   📈 자산 마스터 생성: ${snapshot.assetName} (${snapshot.currency})`);
      }
      assetMasterCache.set(assetMasterKey, assetMasterId);
    }

    // 4. 계좌 upsert
    const accountKey = `${memberId}:${institutionId}:${snapshot.accountName}`;
    let accountId = accountCache.get(accountKey);
    if (!accountId) {
      // memberId + institutionId + name으로 조회
      const existingAccount = await prisma.account.findFirst({
        where: {
          memberId,
          institutionId,
          name: snapshot.accountName,
        },
      });

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const created = await prisma.account.create({
          data: {
            memberId,
            institutionId,
            name: snapshot.accountName,
            accountType: snapshot.accountType,
            currency: snapshot.currency,
          },
        });
        accountId = created.id;
        accountsCreated++;
        console.log(`   💳 계좌 생성: ${snapshot.accountName} (${snapshot.memberName})`);
      }
      accountCache.set(accountKey, accountId);
    }

    // 5. 보유 종목 upsert (현재 상태 캐시 컬럼 없음 — 연결만 생성)
    const holdingKey = `${accountId}:${assetMasterId}`;
    let holdingId = holdingCache.get(holdingKey);
    if (!holdingId) {
      const existingHolding = await prisma.holding.findUnique({
        where: {
          accountId_assetMasterId: {
            accountId,
            assetMasterId,
          },
        },
      });

      if (existingHolding) {
        holdingId = existingHolding.id;
      } else {
        const created = await prisma.holding.create({
          data: {
            accountId,
            assetMasterId,
          },
        });
        holdingId = created.id;
        holdingsCreated++;
      }
      holdingCache.set(holdingKey, holdingId);
    }

    // 6. 보유 종목 스냅샷 upsert (SSOT)
    // 원화 환산값 = 원통화 가격 × 환율(외화) / 원통화 가격(원화).
    // 평균단가는 엑셀에 없으므로 현재가와 동일하게 적재(수익 0에서 출발, 이후 사용자 보정).
    // 외화 입력값(priceOriginal/avgCostOriginal)은 손실 없이 보존, 원화 종목은 null.
    const isForeign = Boolean(snapshot.exchangeRate);
    const krwPrice = isForeign
      ? snapshot.priceOriginal * (snapshot.exchangeRate as number)
      : snapshot.priceOriginal;
    const snapshotData = {
      quantity: snapshot.quantity,
      avgCostKRW: krwPrice,
      currentPriceKRW: krwPrice,
      exchangeRate: snapshot.exchangeRate ?? null,
      priceOriginal: isForeign ? snapshot.priceOriginal : null,
      avgCostOriginal: isForeign ? snapshot.priceOriginal : null,
    };

    const existingSnapshot = await prisma.holdingSnapshot.findUnique({
      where: {
        holdingId_snapshotDate: {
          holdingId,
          snapshotDate: snapshot.date,
        },
      },
    });

    if (existingSnapshot) {
      await prisma.holdingSnapshot.update({
        where: { id: existingSnapshot.id },
        data: snapshotData,
      });
    } else {
      await prisma.holdingSnapshot.create({
        data: {
          holdingId,
          snapshotDate: snapshot.date,
          ...snapshotData,
        },
      });
      snapshotsCreated++;
    }
  }

  console.log('\n📊 자산 시드 데이터 삽입 결과:');
  console.log(`   - 가족 구성원: ${membersCreated}명 생성`);
  console.log(`   - 금융기관: ${institutionsCreated}개 생성`);
  console.log(`   - 자산 마스터: ${assetMastersCreated}개 생성`);
  console.log(`   - 계좌: ${accountsCreated}개 생성`);
  console.log(`   - 보유 종목: ${holdingsCreated}개 생성`);
  console.log(`   - 스냅샷: ${snapshotsCreated}개 생성`);
  console.log('\n🎉 자산 관리 시드 데이터 삽입 완료!\n');
}
