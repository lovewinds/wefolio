// 클라이언트 사이드 Mock 데이터 (개발/테스트용)
import type {
  DashboardData,
  DashboardTransaction,
  DashboardStats,
  CategoryExpense,
  DashboardMonthRange,
  HierarchicalCategoryExpense,
} from '@/types';

// Mock 데이터 사용 여부 확인
export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export interface MockTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: Date;
}

type MockCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string | null;
  color?: string;
};

const mockCategories: MockCategory[] = [
  { id: '급여', name: '급여', type: 'income', color: '#22c55e' },
  { id: '부수입', name: '부수입', type: 'income', color: '#14b8a6' },
  { id: '주거비', name: '주거비', type: 'expense', color: '#eab308' },
  { id: '식비', name: '식비', type: 'expense', color: '#ef4444' },
  { id: '교통비', name: '교통비', type: 'expense', color: '#f97316' },
  { id: '통신비', name: '통신비', type: 'expense', color: '#84cc16' },
  { id: '문화생활', name: '문화생활', type: 'expense', color: '#8b5cf6' },
  { id: '쇼핑', name: '쇼핑', type: 'expense', color: '#ec4899' },
  { id: '의료비', name: '의료비', type: 'expense', color: '#06b6d4' },
  { id: '저축', name: '저축', type: 'expense', color: '#3b82f6' },
];

// 날짜 생성 헬퍼 (YYYYMMDD 형식 입력 -> Date 반환, UTC 자정)
function createDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  return new Date(Date.UTC(year, month - 1, day));
}

// Date를 YYYYMMDD 문자열로 변환 (UTC 기준)
function formatDateToString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Mock 거래 데이터 (2026년 1월)
export const mockTransactions: MockTransaction[] = [
  // 수입
  {
    id: '1',
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '1월 급여',
    date: createDate('20260110'),
  },
  {
    id: '2',
    type: 'income',
    amount: 200000,
    category: '부수입',
    description: '프리랜서 작업',
    date: createDate('20260115'),
  },
  // 지출
  {
    id: '3',
    type: 'expense',
    amount: 1200000,
    category: '주거비',
    description: '월세',
    date: createDate('20260105'),
  },
  {
    id: '4',
    type: 'expense',
    amount: 450000,
    category: '식비',
    description: '식료품 및 외식',
    date: createDate('20260108'),
  },
  {
    id: '5',
    type: 'expense',
    amount: 150000,
    category: '교통비',
    description: '대중교통 및 주유',
    date: createDate('20260110'),
  },
  {
    id: '6',
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: createDate('20260112'),
  },
  {
    id: '7',
    type: 'expense',
    amount: 200000,
    category: '문화생활',
    description: '영화, 공연',
    date: createDate('20260114'),
  },
  {
    id: '8',
    type: 'expense',
    amount: 350000,
    category: '쇼핑',
    description: '의류 구매',
    date: createDate('20260116'),
  },
  {
    id: '9',
    type: 'expense',
    amount: 120000,
    category: '의료비',
    description: '병원 진료',
    date: createDate('20260118'),
  },
  {
    id: '10',
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: createDate('20260120'),
  },
];

// 통계 계산 유틸리티
export function calculateStats(transactions: MockTransaction[]) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return { totalIncome, totalExpense, balance };
}

// 카테고리별 지출 계산
export function getExpenseByCategory(transactions: MockTransaction[]) {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce(
      (acc, t) => {
        const existing = acc.find(item => item.id === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ id: t.category, label: t.category, value: t.amount });
        }
        return acc;
      },
      [] as { id: string; label: string; value: number }[]
    )
    .sort((a, b) => b.value - a.value);
}

function buildMockCategoryBreakdown(
  transactions: MockTransaction[],
  type: 'income' | 'expense'
): {
  flat: CategoryExpense[];
  hierarchical: HierarchicalCategoryExpense[];
} {
  const categories = mockCategories.filter(category => category.type === type);
  const metaByName = new Map<string, MockCategory>();
  const metaById = new Map<string, MockCategory>();

  for (const category of categories) {
    metaByName.set(category.name, category);
    metaById.set(category.id, category);
  }

  const totals = new Map<string, number>();

  for (const transaction of transactions.filter(tx => tx.type === type)) {
    const categoryMeta = metaByName.get(transaction.category) ?? {
      id: transaction.category,
      name: transaction.category,
      type,
    };

    if (!metaById.has(categoryMeta.id)) {
      metaById.set(categoryMeta.id, categoryMeta);
    }

    totals.set(categoryMeta.id, (totals.get(categoryMeta.id) ?? 0) + transaction.amount);
  }

  const flat = Array.from(metaById.values())
    .map(category => ({
      id: category.id,
      label: category.name,
      value: totals.get(category.id) ?? 0,
      parentId: category.parentId ?? null,
      parentLabel: category.parentId ? metaById.get(category.parentId)?.name : undefined,
      color: category.color,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const hierarchical: HierarchicalCategoryExpense[] = [];
  const parentCategories = Array.from(metaById.values()).filter(category => !category.parentId);

  for (const parent of parentCategories) {
    const children = Array.from(metaById.values())
      .filter(category => category.parentId === parent.id)
      .map(child => ({
        id: child.id,
        label: child.name,
        value: totals.get(child.id) ?? 0,
        color: child.color,
      }))
      .filter(child => child.value > 0)
      .sort((a, b) => b.value - a.value);

    if (children.length > 0) {
      const totalValue = children.reduce((sum, child) => sum + child.value, 0);
      if (totalValue > 0) {
        hierarchical.push({
          id: parent.id,
          label: parent.name,
          value: totalValue,
          color: parent.color,
          children,
        });
      }
      continue;
    }

    const parentValue = totals.get(parent.id) ?? 0;
    if (parentValue > 0) {
      hierarchical.push({
        id: parent.id,
        label: parent.name,
        value: parentValue,
        color: parent.color,
      });
    }
  }

  return {
    flat: flat.sort((a, b) => b.value - a.value),
    hierarchical: hierarchical.sort((a, b) => b.value - a.value),
  };
}

// Mock 데이터를 DashboardData 형식으로 변환
export function getMockDashboardData(): DashboardData {
  const stats = calculateStats(mockTransactions);
  const expenseBreakdown = buildMockCategoryBreakdown(mockTransactions, 'expense');
  const incomeBreakdown = buildMockCategoryBreakdown(mockTransactions, 'income');
  const availableRange = getMockRange(mockTransactions);

  const transactions: DashboardTransaction[] = mockTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: formatDateToString(t.date),
  }));

  return {
    stats: {
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      balance: stats.balance,
    },
    transactions,
    expenseByCategory: expenseBreakdown.flat,
    incomeByCategory: incomeBreakdown.flat,
    expenseByParentCategory: expenseBreakdown.hierarchical,
    incomeByParentCategory: incomeBreakdown.hierarchical,
    availableRange,
  };
}

function getMockRange(transactions: MockTransaction[]): DashboardMonthRange | undefined {
  if (transactions.length === 0) return undefined;

  let minDate = transactions[0]?.date ?? null;
  let maxDate = transactions[0]?.date ?? null;

  for (const transaction of transactions) {
    if (!minDate || transaction.date < minDate) minDate = transaction.date;
    if (!maxDate || transaction.date > maxDate) maxDate = transaction.date;
  }

  if (!minDate || !maxDate) return undefined;

  return {
    min: { year: minDate.getUTCFullYear(), month: minDate.getUTCMonth() + 1 },
    max: { year: maxDate.getUTCFullYear(), month: maxDate.getUTCMonth() + 1 },
  };
}

// 대시보드 데이터 가져오기 (mock 또는 API)
export async function fetchDashboardData(year?: number, month?: number): Promise<DashboardData> {
  if (useMockData) {
    return getMockDashboardData();
  }

  const { apiClient } = await import('@/lib/api-client');
  const now = new Date();
  return apiClient.dashboard.getMonthly(year ?? now.getFullYear(), month ?? now.getMonth() + 1);
}

// 타입 재export
export type {
  DashboardData,
  DashboardTransaction,
  DashboardStats,
  CategoryExpense,
  HierarchicalCategoryExpense,
};
