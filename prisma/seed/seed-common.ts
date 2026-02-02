import readline from 'node:readline/promises';
import { formatMonthKey, type SeedOptions, type SeedTransactionInput } from './read-xlsx-common';
import type { SeedCategoryInput } from './insert-data';

export type SeedType = 'expense' | 'income' | 'asset' | 'all';

export type DataSummary = {
  label: string;
  transactions: SeedTransactionInput[];
  monthlyCounts: Array<[string, number]>;
  sampleRecord: Record<string, unknown> | null;
};

export function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function printFirstMonthRecords(transactions: SeedTransactionInput[], label: string) {
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

export function printSampleRecord(sampleRecord: Record<string, unknown> | null, label: string) {
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

export function buildCategoriesFromTransactions(transactions: SeedTransactionInput[]) {
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

export async function confirmApproval(
  options: Omit<SeedOptions, 'sheetNumber'>,
  message: string
): Promise<boolean> {
  if (options.autoApprove) {
    console.log('✅ 자동 승인 옵션(--yes) 적용');
    return true;
  }

  if (!process.stdin.isTTY) {
    console.log('⚠️ 비대화형 환경에서는 자동 승인 옵션이 필요합니다. (--yes)');
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`👉 ${message} (y/N): `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}
