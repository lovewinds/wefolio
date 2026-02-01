import { PrismaClient } from '@prisma/client';
import {
  seedInstitutions,
  seedFamilyMembers,
  seedAssetMasters,
  seedAccounts,
  seedHoldings,
} from '../seed-data';

export async function insertAssetSeedData(prisma: PrismaClient) {
  console.log('🏦 자산 관리 시드 데이터 삽입 중...\n');

  // 1. 금융기관 생성
  console.log('📁 금융기관 생성 중...');
  for (const inst of seedInstitutions) {
    const existing = await prisma.institution.findUnique({
      where: { name: inst.name },
    });

    if (!existing) {
      await prisma.institution.create({
        data: {
          id: inst.id,
          name: inst.name,
          type: inst.type,
        },
      });
      console.log(`   - ${inst.name} (${inst.type})`);
    } else {
      console.log(`   - ${inst.name} (이미 존재)`);
    }
  }
  console.log(`   ✅ ${seedInstitutions.length}개 금융기관 처리 완료\n`);

  // 2. 가족 구성원 생성
  console.log('👨‍👩‍👧‍👦 가족 구성원 생성 중...');
  for (const member of seedFamilyMembers) {
    const existing = await prisma.familyMember.findUnique({
      where: { name: member.name },
    });

    if (!existing) {
      await prisma.familyMember.create({
        data: {
          id: member.id,
          name: member.name,
          color: member.color,
        },
      });
      console.log(`   - ${member.name} (${member.color})`);
    } else {
      console.log(`   - ${member.name} (이미 존재)`);
    }
  }
  console.log(`   ✅ ${seedFamilyMembers.length}개 가족 구성원 처리 완료\n`);

  // 3. 자산 마스터 생성
  console.log('📊 자산 마스터 생성 중...');
  for (const asset of seedAssetMasters) {
    // symbol이 있으면 symbol+currency로 조회, 없으면 id로 조회
    let existing = null;
    if (asset.symbol) {
      existing = await prisma.assetMaster.findUnique({
        where: { symbol_currency: { symbol: asset.symbol, currency: asset.currency } },
      });
    }
    if (!existing) {
      existing = await prisma.assetMaster.findUnique({
        where: { id: asset.id },
      });
    }

    if (!existing) {
      await prisma.assetMaster.create({
        data: {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          assetClass: asset.assetClass,
          subClass: asset.subClass,
          riskLevel: asset.riskLevel,
          currency: asset.currency,
        },
      });
      const symbolInfo = asset.symbol ? ` (${asset.symbol})` : '';
      console.log(`   - ${asset.name}${symbolInfo} [${asset.assetClass}]`);
    } else {
      console.log(`   - ${asset.name} (이미 존재)`);
    }
  }
  console.log(`   ✅ ${seedAssetMasters.length}개 자산 마스터 처리 완료\n`);

  // 4. 계좌 생성
  console.log('💳 계좌 생성 중...');
  for (const account of seedAccounts) {
    const existing = await prisma.account.findUnique({
      where: { id: account.id },
    });

    if (!existing) {
      await prisma.account.create({
        data: {
          id: account.id,
          memberId: account.memberId,
          institutionId: account.institutionId,
          name: account.name,
          accountType: account.accountType,
          currency: account.currency,
          cashBalance: account.cashBalance,
        },
      });
      console.log(
        `   - ${account.name} (${account.accountType}, ₩${account.cashBalance.toLocaleString()})`
      );
    } else {
      console.log(`   - ${account.name} (이미 존재)`);
    }
  }
  console.log(`   ✅ ${seedAccounts.length}개 계좌 처리 완료\n`);

  // 5. 보유 종목 생성
  console.log('📈 보유 종목 생성 중...');
  for (const holding of seedHoldings) {
    const existing = await prisma.holding.findUnique({
      where: {
        accountId_assetMasterId: {
          accountId: holding.accountId,
          assetMasterId: holding.assetMasterId,
        },
      },
    });

    if (!existing) {
      await prisma.holding.create({
        data: {
          id: holding.id,
          accountId: holding.accountId,
          assetMasterId: holding.assetMasterId,
          quantity: holding.quantity,
          averageCostKRW: holding.averageCostKRW,
          averageCostOriginal: holding.averageCostOriginal,
          dataSource: holding.dataSource,
        },
      });

      // 자산 이름 조회
      const assetMaster = await prisma.assetMaster.findUnique({
        where: { id: holding.assetMasterId },
      });
      const totalValue = holding.quantity * holding.averageCostKRW;
      console.log(
        `   - ${assetMaster?.name} x ${holding.quantity} (₩${totalValue.toLocaleString()})`
      );
    } else {
      const assetMaster = await prisma.assetMaster.findUnique({
        where: { id: holding.assetMasterId },
      });
      console.log(`   - ${assetMaster?.name} (이미 존재)`);
    }
  }
  console.log(`   ✅ ${seedHoldings.length}개 보유 종목 처리 완료\n`);

  console.log('🎉 자산 관리 시드 데이터 삽입 완료!\n');
}
