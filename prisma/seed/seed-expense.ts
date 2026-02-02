import { PrismaClient } from '@prisma/client';
import { loadPredefinedCategories } from '../seed-data';
import { insertSeedData } from './insert-data';
import { summarizeMonthlyCounts, type SeedOptions } from './read-xlsx-common';
import { buildExpenseTransactionsFromXlsx } from './read-xlsx-expense';
import {
  buildCategoriesFromTransactions,
  confirmApproval,
  printFirstMonthRecords,
  printSampleRecord,
} from './seed-common';

export type SeedExpenseOptions = Omit<SeedOptions, 'sheetNumber'> & {
  filePath: string;
};

export async function seedExpense(
  prisma: PrismaClient,
  options: SeedExpenseOptions
): Promise<void> {
  console.log('📊 지출 데이터 로드 중... (시트 4)');
  const expenseResult = buildExpenseTransactionsFromXlsx({
    ...options,
    sheetNumber: 4,
  });
  console.log(
    `   ✅ ${expenseResult.transactions.length}건 로드됨 (시트: ${expenseResult.sheetName})`
  );

  // 경고 출력
  if (expenseResult.warnings.length > 0) {
    console.log(`⚠️ 무시된 행 경고 ${expenseResult.warnings.length}건`);
    expenseResult.warnings.slice(0, 10).forEach(warning => console.log(`   - [지출] ${warning}`));
    if (expenseResult.warnings.length > 10) {
      console.log(`   ... ${expenseResult.warnings.length - 10}건 더 있음`);
    }
    console.log('');
  }

  const { categories, conflicts } = buildCategoriesFromTransactions(expenseResult.transactions);

  if (conflicts.size > 0) {
    console.log('⚠️ 카테고리 타입 충돌 감지');
    Array.from(conflicts)
      .sort((a, b) => a.localeCompare(b))
      .forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  const monthlyCounts = summarizeMonthlyCounts(expenseResult.transactions);

  // 요약 출력
  console.log('📄 지출 데이터 요약');
  console.log(`   파일: ${options.filePath}`);
  console.log(`   무시 행: ${options.skipRows}`);
  console.log(`   총 건수: ${expenseResult.transactions.length}건`);

  if (options.verbose) {
    printSampleRecord(expenseResult.sampleRecord, '지출');
    printFirstMonthRecords(expenseResult.transactions, '지출');
  }

  console.log('   월별 건수:');
  for (const [month, count] of monthlyCounts) {
    console.log(`     - ${month}: ${count}건`);
  }

  const approved = await confirmApproval(options, '지출 데이터를 저장할까요?');

  if (!approved) {
    console.log('⏹️ 지출 시드가 승인되지 않아 건너뜁니다.\n');
    return;
  }

  // 카테고리 계층 정보 로드 (시트 4 index=3, L4:M31)
  const expenseCategories = loadPredefinedCategories({
    filePath: options.filePath,
    sheetNumber: 3,
    startRow: 4,
    endRow: 31,
    subcategoryCol: 'L',
    parentCol: 'M',
    type: 'expense',
  });
  console.log(`📋 지출 카테고리 매핑: ${expenseCategories.length}개 로드됨\n`);

  await insertSeedData(prisma, categories, expenseResult.transactions, expenseCategories);
  console.log('✅ 지출 시드 데이터 삽입 완료!\n');
}
