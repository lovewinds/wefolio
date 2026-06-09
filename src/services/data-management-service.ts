import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import type { DataCounts, DataLoadResult } from '@/types';

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

export const dataManagementService = {
  getCounts,
  deleteDomain,
  loadFromUpload,
};
