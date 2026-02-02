import { PrismaClient } from '@prisma/client';
import { loadPredefinedCategories } from '../seed-data';
import { insertSeedData } from './insert-data';
import { summarizeMonthlyCounts, type SeedOptions } from './read-xlsx-common';
import { buildIncomeTransactionsFromXlsx } from './read-xlsx-income';
import {
  buildCategoriesFromTransactions,
  confirmApproval,
  printFirstMonthRecords,
  printSampleRecord,
} from './seed-common';

export type SeedIncomeOptions = Omit<SeedOptions, 'sheetNumber'> & {
  filePath: string;
};

export async function seedIncome(prisma: PrismaClient, options: SeedIncomeOptions): Promise<void> {
  console.log('📊 수입 데이터 로드 중... (시트 5)');
  const incomeResult = buildIncomeTransactionsFromXlsx({
    ...options,
    sheetNumber: 5,
  });
  console.log(
    `   ✅ ${incomeResult.transactions.length}건 로드됨 (시트: ${incomeResult.sheetName})`
  );

  // 경고 출력
  if (incomeResult.warnings.length > 0) {
    console.log(`⚠️ 무시된 행 경고 ${incomeResult.warnings.length}건`);
    incomeResult.warnings.slice(0, 10).forEach(warning => console.log(`   - [수입] ${warning}`));
    if (incomeResult.warnings.length > 10) {
      console.log(`   ... ${incomeResult.warnings.length - 10}건 더 있음`);
    }
    console.log('');
  }

  const { categories, conflicts } = buildCategoriesFromTransactions(incomeResult.transactions);

  if (conflicts.size > 0) {
    console.log('⚠️ 카테고리 타입 충돌 감지');
    Array.from(conflicts)
      .sort((a, b) => a.localeCompare(b))
      .forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  const monthlyCounts = summarizeMonthlyCounts(incomeResult.transactions);

  // 요약 출력
  console.log('📄 수입 데이터 요약');
  console.log(`   파일: ${options.filePath}`);
  console.log(`   무시 행: ${options.skipRows}`);
  console.log(`   총 건수: ${incomeResult.transactions.length}건`);

  if (options.verbose) {
    printSampleRecord(incomeResult.sampleRecord, '수입');
    printFirstMonthRecords(incomeResult.transactions, '수입');
  }

  console.log('   월별 건수:');
  for (const [month, count] of monthlyCounts) {
    console.log(`     - ${month}: ${count}건`);
  }

  const approved = await confirmApproval(options, '수입 데이터를 저장할까요?');

  if (!approved) {
    console.log('⏹️ 수입 시드가 승인되지 않아 건너뜁니다.\n');
    return;
  }

  // 카테고리 계층 정보 로드 (시트 5 index=4, J4:K14)
  const incomeCategories = loadPredefinedCategories({
    filePath: options.filePath,
    sheetNumber: 4,
    startRow: 4,
    endRow: 14,
    subcategoryCol: 'J',
    parentCol: 'K',
    type: 'income',
  });
  console.log(`📋 수입 카테고리 매핑: ${incomeCategories.length}개 로드됨\n`);

  await insertSeedData(prisma, categories, incomeResult.transactions, incomeCategories);
  console.log('✅ 수입 시드 데이터 삽입 완료!\n');
}
