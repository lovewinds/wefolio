import { PrismaClient } from '@prisma/client';
import type { SeedTransactionInput } from './read-xlsx-common';
import type { PredefinedCategory } from '../seed-data';

export type SeedCategoryInput = {
  name: string;
  type: 'income' | 'expense';
  parentName?: string;
};

export async function insertSeedData(
  prisma: PrismaClient,
  categories: SeedCategoryInput[],
  transactions: SeedTransactionInput[],
  predefinedCategories?: PredefinedCategory[]
) {
  console.log('📁 카테고리 생성 중...');
  const categoryMap = new Map<string, string>();

  // 소분류 → 대분류 매핑 생성, 대분류 타입 매핑 생성, 소분류 타입 매핑 생성
  const subcategoryToParent = new Map<string, string>();
  const subcategoryToType = new Map<string, 'income' | 'expense'>();
  const parentNamesByType = new Map<string, 'income' | 'expense'>();
  if (predefinedCategories) {
    for (const pc of predefinedCategories) {
      if (pc.subcategoryName && pc.parentName) {
        subcategoryToParent.set(pc.subcategoryName, pc.parentName);
      }
      // 소분류 타입은 predefinedCategories에서 직접 가져옴
      if (pc.subcategoryName) {
        subcategoryToType.set(pc.subcategoryName, pc.type);
      }
      // 대분류 타입은 predefinedCategories에서 직접 가져옴
      if (pc.parentName && !parentNamesByType.has(pc.parentName)) {
        parentNamesByType.set(pc.parentName, pc.type);
      }
    }
  }

  const parentCategoryMap = new Map<string, string>();
  if (parentNamesByType.size > 0) {
    console.log('   📂 대분류 생성 중...');
    for (const [parentName, parentType] of parentNamesByType) {
      const existing = await prisma.category.findFirst({
        where: {
          name: parentName,
          type: parentType,
          parentId: null,
        },
      });

      const created =
        existing ??
        (await prisma.category.create({
          data: {
            name: parentName,
            type: parentType,
            icon: null,
            color: null,
            isDefault: true,
            parentId: null,
          },
        }));

      parentCategoryMap.set(`${parentName}:${parentType}`, created.id);
      console.log(`   - [대분류] ${created.name} (${parentType}) (id: ${created.id})`);
    }
    console.log(`   ✅ ${parentNamesByType.size}개 대분류 생성 완료\n`);
  }

  // 2단계: 소분류 생성 (parentId 연결)
  console.log('   📄 소분류 생성 중...');
  for (const category of categories) {
    // predefinedCategories에서 타입 정보가 있으면 그것을 사용
    const categoryType = subcategoryToType.get(category.name) ?? category.type;
    const parentName = subcategoryToParent.get(category.name);
    const parentKey = parentName ? `${parentName}:${categoryType}` : null;
    const parentId = parentKey ? (parentCategoryMap.get(parentKey) ?? null) : null;

    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: categoryType,
        parentId: parentId,
      },
    });

    const created =
      existing ??
      (await prisma.category.create({
        data: {
          name: category.name,
          type: categoryType,
          icon: null,
          color: null,
          isDefault: false,
          parentId: parentId,
        },
      }));

    categoryMap.set(category.name, created.id);
    const parentInfo = parentName ? ` → ${parentName}` : '';
    console.log(`   - [소분류] ${created.name}${parentInfo} (${categoryType}) (id: ${created.id})`);
  }
  console.log(`   ✅ ${categories.length}개 소분류 생성 완료\n`);

  console.log('💳 거래 데이터 생성 중...');
  for (const transaction of transactions) {
    const categoryId = categoryMap.get(transaction.categoryName);
    if (!categoryId) {
      console.warn(`   ⚠️ 카테고리를 찾을 수 없음: ${transaction.categoryName}`);
      continue;
    }

    await prisma.transaction.create({
      data: {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description ?? null,
        date: transaction.date,
        categoryId: categoryId,
        paymentMethod: transaction.paymentMethod ?? null,
        user: transaction.user ?? null,
      },
    });
  }
  console.log(`   ✅ ${transactions.length}개 거래 데이터 생성 완료\n`);
}
