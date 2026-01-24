import { PrismaClient } from '@prisma/client';
import {
  parentCategories,
  childCategories,
  mockTransactions,
  mockAssets,
  mockRecurringTemplates,
} from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 삽입을 시작합니다...\n');

  // 1. 대분류 카테고리 먼저 생성
  console.log('📁 대분류 카테고리 생성 중...');
  const categoryMap = new Map<string, string>();

  for (const category of parentCategories) {
    const created = await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: {
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        isDefault: category.isDefault,
        parentId: null,
      },
    });
    categoryMap.set(category.name, created.id);
  }
  console.log(`   ✅ ${parentCategories.length}개 대분류 카테고리 생성 완료`);

  // 2. 소분류 카테고리 생성
  console.log('📂 소분류 카테고리 생성 중...');
  for (const category of childCategories) {
    const created = await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: {
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        isDefault: category.isDefault,
        parentId: category.parentId ?? null,
      },
    });
    categoryMap.set(category.name, created.id);
  }
  console.log(`   ✅ ${childCategories.length}개 소분류 카테고리 생성 완료\n`);

  // 3. Mock 거래 데이터 생성 (소분류 카테고리 기준)
  console.log('💳 거래 데이터 생성 중...');
  for (const transaction of mockTransactions) {
    const categoryId = categoryMap.get(transaction.category);
    if (!categoryId) {
      console.warn(`   ⚠️ 카테고리를 찾을 수 없음: ${transaction.category}`);
      continue;
    }

    await prisma.transaction.create({
      data: {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        categoryId: categoryId,
      },
    });
  }
  console.log(`   ✅ ${mockTransactions.length}개 거래 데이터 생성 완료\n`);

  // 4. Mock 자산 데이터 생성
  console.log('🏦 자산 데이터 생성 중...');
  for (const asset of mockAssets) {
    await prisma.asset.create({
      data: {
        name: asset.name,
        type: asset.type,
        balance: asset.balance,
        note: asset.note,
      },
    });
  }
  console.log(`   ✅ ${mockAssets.length}개 자산 데이터 생성 완료\n`);

  // 5. Mock 고정 지출 템플릿 생성
  console.log('📋 고정 지출 템플릿 생성 중...');
  for (const template of mockRecurringTemplates) {
    const categoryId = categoryMap.get(template.category);
    if (!categoryId) {
      console.warn(`   ⚠️ 카테고리를 찾을 수 없음: ${template.category}`);
      continue;
    }

    await prisma.recurringTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        amount: template.amount,
        description: template.description,
        categoryId: categoryId,
      },
    });
  }
  console.log(`   ✅ ${mockRecurringTemplates.length}개 템플릿 생성 완료\n`);

  console.log('🎉 시드 데이터 삽입이 완료되었습니다!');
}

main()
  .catch(e => {
    console.error('❌ 시드 데이터 삽입 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
