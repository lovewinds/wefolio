import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { parseSeedOptions } from './seed/read-xlsx-common';
import { seedAsset } from './seed/seed-asset';
import { seedExpense } from './seed/seed-expense';
import { seedIncome } from './seed/seed-income';

const prisma = new PrismaClient();

const DEFAULT_FILE_PATH = path.join(process.cwd(), 'prisma', '자산정리v2.xlsx');

export async function runSeed() {
  console.log('🌱 시드 데이터 삽입을 시작합니다...\n');
  const baseOptions = parseSeedOptions();

  const filePath = baseOptions.filePath || DEFAULT_FILE_PATH;
  const options = { ...baseOptions, filePath };
  const { seedType } = options;

  console.log(`📋 시드 타입: ${seedType}\n`);

  if (seedType === 'expense' || seedType === 'all') {
    await seedExpense(prisma, options);
  }

  if (seedType === 'income' || seedType === 'all') {
    await seedIncome(prisma, options);
  }

  if (seedType === 'asset' || seedType === 'all') {
    await seedAsset(prisma, options);
  }

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
