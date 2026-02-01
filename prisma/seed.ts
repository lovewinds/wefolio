import path from 'node:path';
import readline from 'node:readline/promises';
import { PrismaClient } from '@prisma/client';
import { insertSeedData, type SeedCategoryInput } from './seed/insert-data';
import { insertAssetSeedData } from './seed/insert-asset-data';
import {
  formatMonthKey,
  parseSeedOptions,
  summarizeMonthlyCounts,
  type SeedOptions,
  type SeedTransactionInput,
} from './seed/read-xlsx-common';
import { buildExpenseTransactionsFromXlsx } from './seed/read-xlsx-expense';
import { buildIncomeTransactionsFromXlsx } from './seed/read-xlsx-income';
import { buildAssetSnapshotsFromXlsx } from './seed/read-xlsx-asset';
import { loadPredefinedCategories } from './seed-data';

const prisma = new PrismaClient();

const DEFAULT_FILE_PATH = path.join(process.cwd(), 'prisma', '자산정리v2.xlsx');

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function printFirstMonthRecords(transactions: SeedTransactionInput[], label: string) {
  if (transactions.length === 0) {
    console.log(`   첫번째 월 데이터 (${label}): 없음`);
    return;
  }

  const firstMonth = formatMonthKey(transactions[0].date);
  const firstMonthRecords = transactions.filter(tx => formatMonthKey(tx.date) === firstMonth);

  console.log(`   첫번째 월 데이터 (${label}, ${firstMonth}): ${firstMonthRecords.length}건`);
  for (const tx of firstMonthRecords) {
    const description = tx.description ? `, ${tx.description}` : '';
    const paymentMethod = tx.paymentMethod ? `, ${tx.paymentMethod}` : '';
    const user = tx.user ? `, ${tx.user}` : '';
    const displayTime = formatUtcDate(tx.date);
    console.log(
      `     - ${displayTime} | ${tx.type} | ${tx.categoryName} | ${tx.amount}${description}${paymentMethod}${user}`
    );
  }
}

function printSampleRecord(sampleRecord: Record<string, unknown> | null, label: string) {
  if (!sampleRecord) {
    console.log(`   샘플 raw 데이터 (${label}): 없음`);
    return;
  }

  const formatted = JSON.stringify(
    sampleRecord,
    (_key, value) => {
      if (value instanceof Date) {
        return formatUtcDate(value);
      }
      return value;
    },
    2
  );
  console.log(`   샘플 raw 데이터 (${label}):`);
  formatted.split('\n').forEach(line => console.log(`     ${line}`));
}

function buildCategoriesFromTransactions(transactions: SeedTransactionInput[]) {
  // name + type 조합으로 유니크한 카테고리 추출
  const categoryMap = new Map<string, SeedCategoryInput>();

  for (const tx of transactions) {
    const key = `${tx.categoryName}:${tx.type}`;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name: tx.categoryName, type: tx.type });
    }
  }

  return { categories: Array.from(categoryMap.values()), conflicts: new Set<string>() };
}

type DataSummary = {
  label: string;
  transactions: SeedTransactionInput[];
  monthlyCounts: Array<[string, number]>;
  sampleRecord: Record<string, unknown> | null;
};

async function confirmSeedApproval(
  options: Omit<SeedOptions, 'sheetNumber'>,
  expenseSummary: DataSummary,
  incomeSummary: DataSummary,
  totalCount: number
) {
  console.log('📄 엑셀 데이터 요약');
  console.log(`   파일: ${options.filePath}`);
  console.log(`   무시 행: ${options.skipRows}`);
  console.log(`   총 건수: ${totalCount}`);
  console.log(`     - 지출: ${expenseSummary.transactions.length}건`);
  console.log(`     - 수입: ${incomeSummary.transactions.length}건`);

  if (options.verbose) {
    printSampleRecord(expenseSummary.sampleRecord, '지출');
    printFirstMonthRecords(expenseSummary.transactions, '지출');
    printSampleRecord(incomeSummary.sampleRecord, '수입');
    printFirstMonthRecords(incomeSummary.transactions, '수입');
  }

  console.log('   월별 건수 (지출):');
  for (const [month, count] of expenseSummary.monthlyCounts) {
    console.log(`     - ${month}: ${count}건`);
  }

  console.log('   월별 건수 (수입):');
  for (const [month, count] of incomeSummary.monthlyCounts) {
    console.log(`     - ${month}: ${count}건`);
  }

  if (options.autoApprove) {
    console.log('✅ 자동 승인 옵션(--yes) 적용');
    return true;
  }

  if (!process.stdin.isTTY) {
    console.log('⚠️ 비대화형 환경에서는 자동 승인 옵션이 필요합니다. (--yes)');
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('👉 실제 데이터를 저장할까요? (y/N): ');
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

export async function runSeed() {
  console.log('🌱 시드 데이터 삽입을 시작합니다...\n');
  const baseOptions = parseSeedOptions();

  // 파일 경로 기본값 설정
  const filePath = baseOptions.filePath || DEFAULT_FILE_PATH;

  // 지출 데이터 로드 (시트 4)
  console.log('📊 지출 데이터 로드 중... (시트 4)');
  const expenseResult = buildExpenseTransactionsFromXlsx({
    ...baseOptions,
    filePath,
    sheetNumber: 4,
  });
  console.log(
    `   ✅ ${expenseResult.transactions.length}건 로드됨 (시트: ${expenseResult.sheetName})`
  );

  // 수입 데이터 로드 (시트 5)
  console.log('📊 수입 데이터 로드 중... (시트 5)');
  const incomeResult = buildIncomeTransactionsFromXlsx({
    ...baseOptions,
    filePath,
    sheetNumber: 5,
  });
  console.log(
    `   ✅ ${incomeResult.transactions.length}건 로드됨 (시트: ${incomeResult.sheetName})\n`
  );

  // 경고 출력
  const allWarnings = [
    ...expenseResult.warnings.map(w => `[지출] ${w}`),
    ...incomeResult.warnings.map(w => `[수입] ${w}`),
  ];

  if (allWarnings.length > 0) {
    console.log(`⚠️ 무시된 행 경고 ${allWarnings.length}건`);
    allWarnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
    if (allWarnings.length > 10) {
      console.log(`   ... ${allWarnings.length - 10}건 더 있음`);
    }
    console.log('');
  }

  // 모든 거래 합치기
  const allTransactions = [...expenseResult.transactions, ...incomeResult.transactions];
  const { categories, conflicts } = buildCategoriesFromTransactions(allTransactions);

  if (conflicts.size > 0) {
    console.log('⚠️ 카테고리 타입 충돌 감지');
    Array.from(conflicts)
      .sort((a, b) => a.localeCompare(b))
      .forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  const expenseMonthlyCounts = summarizeMonthlyCounts(expenseResult.transactions);
  const incomeMonthlyCounts = summarizeMonthlyCounts(incomeResult.transactions);

  const approved = await confirmSeedApproval(
    { ...baseOptions, filePath },
    {
      label: '지출',
      transactions: expenseResult.transactions,
      monthlyCounts: expenseMonthlyCounts,
      sampleRecord: expenseResult.sampleRecord,
    },
    {
      label: '수입',
      transactions: incomeResult.transactions,
      monthlyCounts: incomeMonthlyCounts,
      sampleRecord: incomeResult.sampleRecord,
    },
    allTransactions.length
  );

  if (!approved) {
    console.log('⏹️ 승인되지 않아 시드를 중단합니다.');
    return;
  }

  // 카테고리 계층 정보 로드
  // 지출 카테고리 (시트 4 index=3, L4:M31)
  const expenseCategories = loadPredefinedCategories({
    filePath,
    sheetNumber: 3,
    startRow: 4,
    endRow: 31,
    subcategoryCol: 'L',
    parentCol: 'M',
    type: 'expense',
  });
  console.log(`📋 지출 카테고리 매핑: ${expenseCategories.length}개 로드됨`);

  // 수입 카테고리 (시트 5 index=4, J4:K14)
  const incomeCategories = loadPredefinedCategories({
    filePath,
    sheetNumber: 4,
    startRow: 4,
    endRow: 14,
    subcategoryCol: 'J',
    parentCol: 'K',
    type: 'income',
  });
  console.log(`📋 수입 카테고리 매핑: ${incomeCategories.length}개 로드됨\n`);

  const allPredefinedCategories = [...expenseCategories, ...incomeCategories];

  await insertSeedData(prisma, categories, allTransactions, allPredefinedCategories);

  // 자산 스냅샷 데이터 로드 (시트 7)
  console.log('📊 자산 스냅샷 데이터 로드 중... (시트 7)');
  const assetResult = buildAssetSnapshotsFromXlsx({
    ...baseOptions,
    filePath,
    sheetNumber: 7,
  });
  console.log(`   ✅ ${assetResult.snapshots.length}건 로드됨 (시트: ${assetResult.sheetName})`);

  // 자산 경고 출력
  if (assetResult.warnings.length > 0) {
    console.log(`⚠️ 자산 데이터 경고 ${assetResult.warnings.length}건`);
    assetResult.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
    if (assetResult.warnings.length > 10) {
      console.log(`   ... ${assetResult.warnings.length - 10}건 더 있음`);
    }
    console.log('');
  }

  if (baseOptions.verbose && assetResult.sampleRecord) {
    const formatted = JSON.stringify(
      assetResult.sampleRecord,
      (_key, value) => {
        if (value instanceof Date) {
          return formatUtcDate(value);
        }
        return value;
      },
      2
    );
    console.log('   샘플 자산 데이터:');
    formatted.split('\n').forEach(line => console.log(`     ${line}`));
    console.log('');
  }

  // 자산 관리 시드 데이터 삽입 (엑셀 데이터 전달)
  await insertAssetSeedData(prisma, assetResult.snapshots);

  console.log('🎉 시드 데이터 삽입이 완료되었습니다!');
}

export async function main() {
  try {
    await runSeed();
  } catch (error) {
    console.error('❌ 시드 데이터 삽입 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
