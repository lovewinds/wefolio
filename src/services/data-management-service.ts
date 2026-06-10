import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { formatDateString, getMonthRangeUTC } from '@/lib/date-utils';
import type {
  AssetRecordRow,
  BudgetRecordRow,
  DataCounts,
  DataLoadResult,
  RecordMonth,
  TransactionType,
} from '@/types';

export const DATA_DOMAINS = ['budget', 'asset'] as const;
export type DataDomain = (typeof DATA_DOMAINS)[number];

async function getCounts(): Promise<DataCounts> {
  const [
    transactions,
    categories,
    templates,
    members,
    institutions,
    assetMasters,
    accounts,
    holdings,
    snapshots,
    cashSnapshots,
    holdingTransactions,
  ] = await prisma.$transaction([
    prisma.budgetTransaction.count(),
    prisma.budgetCategory.count(),
    prisma.budgetRecurringTemplate.count(),
    prisma.member.count(),
    prisma.institution.count(),
    prisma.assetMaster.count(),
    prisma.account.count(),
    prisma.holding.count(),
    prisma.holdingSnapshot.count(),
    prisma.cashSnapshot.count(),
    prisma.holdingTransaction.count(),
  ]);

  return {
    budget: { transactions, categories, templates },
    asset: {
      members,
      institutions,
      assetMasters,
      accounts,
      holdings,
      snapshots,
      cashSnapshots,
      holdingTransactions,
    },
  };
}

// SQLite + onDelete 미지정(Restrict)이라 자식 → 부모 순서로 삭제한다.
async function deleteDomain(domain: DataDomain): Promise<DataCounts> {
  if (domain === 'budget') {
    await prisma.$transaction([
      prisma.budgetTransaction.deleteMany({}),
      prisma.budgetRecurringTemplate.deleteMany({}),
      prisma.budgetCategory.deleteMany({ where: { parentId: { not: null } } }),
      prisma.budgetCategory.deleteMany({}),
    ]);
  } else {
    await prisma.$transaction([
      prisma.holdingSnapshot.deleteMany({}),
      prisma.holdingTransaction.deleteMany({}),
      prisma.cashSnapshot.deleteMany({}),
      prisma.holding.deleteMany({}),
      prisma.account.deleteMany({}),
      prisma.member.deleteMany({}),
      prisma.institution.deleteMany({}),
      prisma.assetMaster.deleteMany({}),
    ]);
  }

  return getCounts();
}

// 업로드 버퍼를 임시 파일로 쓰고 기존 시드 파이프라인을 그대로 재사용한다.
// autoApprove: true 로 confirmApproval 의 stdin 프롬프트를 건너뛴다.
async function loadFromUpload(buffer: Buffer): Promise<DataLoadResult> {
  const before = await getCounts();

  const { seedExpense } = await import('../../prisma/seed/seed-expense');
  const { seedIncome } = await import('../../prisma/seed/seed-income');
  const { seedAsset } = await import('../../prisma/seed/seed-asset');

  // SheetJS는 번들 환경에서 fs 를 자동 인식하지 못해 XLSX.readFile 이 "Cannot access file" 로
  // 실패한다(시드 readers/loadPredefinedCategories 가 사용). Node fs 를 주입해 해결한다.
  const XLSX = await import('xlsx');
  XLSX.set_fs(await import('node:fs'));

  const dir = await mkdtemp(path.join(os.tmpdir(), 'wefolio-seed-'));
  const filePath = path.join(dir, `upload-${randomUUID()}.xlsx`);
  await writeFile(filePath, buffer);

  const options = {
    filePath,
    skipRows: 3,
    autoApprove: true,
    verbose: false,
    seedType: 'all' as const,
  };

  try {
    await seedExpense(prisma, options);
    await seedIncome(prisma, options);
    await seedAsset(prisma, options);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  const after = await getCounts();
  return { before, after };
}

// 데이터가 있는 월 목록(+건수), 최신 우선. 날짜만 조회해 JS에서 YYYY-MM 그룹.
async function getRecordMonths(domain: DataDomain): Promise<RecordMonth[]> {
  const dates =
    domain === 'budget'
      ? (await prisma.budgetTransaction.findMany({ select: { date: true } })).map(r => r.date)
      : (await prisma.holdingSnapshot.findMany({ select: { snapshotDate: true } })).map(
          r => r.snapshotDate
        );

  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, count };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

// 선택한 월의 항목을 row 단위로 반환(가계부=거래, 자산=보유 스냅샷).
async function getRecords(
  domain: DataDomain,
  year: number,
  month: number
): Promise<BudgetRecordRow[] | AssetRecordRow[]> {
  const { start, end } = getMonthRangeUTC(year, month);

  if (domain === 'budget') {
    const rows = await prisma.budgetTransaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: { include: { parent: true } } },
      orderBy: { date: 'asc' },
    });
    return rows.map(row => ({
      id: row.id,
      date: formatDateString(row.date),
      type: row.type as TransactionType,
      category: row.category.name,
      parentCategory: row.category.parent?.name ?? null,
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      user: row.user,
      description: row.description,
    }));
  }

  const rows = await prisma.holdingSnapshot.findMany({
    where: { snapshotDate: { gte: start, lte: end } },
    include: {
      holding: {
        include: {
          assetMaster: true,
          account: { include: { member: true, institution: true } },
        },
      },
    },
    orderBy: { snapshotDate: 'asc' },
  });
  return rows.map(row => ({
    id: row.id,
    date: formatDateString(row.snapshotDate),
    member: row.holding.account.member.name,
    institution: row.holding.account.institution.name,
    account: row.holding.account.name,
    assetName: row.holding.assetMaster.name,
    riskLevel: row.holding.assetMaster.riskLevel ?? null,
    currency: row.holding.assetMaster.currency,
    quantity: row.quantity,
    currentPriceKRW: row.currentPriceKRW,
    valueKRW: row.quantity * row.currentPriceKRW,
    exchangeRate: row.exchangeRate,
    priceOriginal: row.priceOriginal,
  }));
}

export const dataManagementService = {
  getCounts,
  deleteDomain,
  loadFromUpload,
  getRecordMonths,
  getRecords,
};
