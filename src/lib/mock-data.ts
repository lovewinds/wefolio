// 클라이언트 사이드 Mock 데이터 (개발/테스트용)
import type { DashboardData, DashboardTransaction, DashboardStats, CategoryExpense } from '@/types';

// Mock 데이터 사용 여부 확인
export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export interface MockTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

// 현재 월의 날짜 생성 헬퍼
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Mock 거래 데이터
export const mockTransactions: MockTransaction[] = [
  // 수입
  {
    id: '1',
    type: 'income',
    amount: 4500000,
    category: '급여',
    description: '1월 급여',
    date: getDateString(10),
  },
  {
    id: '2',
    type: 'income',
    amount: 200000,
    category: '부수입',
    description: '프리랜서 작업',
    date: getDateString(5),
  },
  // 지출
  {
    id: '3',
    type: 'expense',
    amount: 1200000,
    category: '주거비',
    description: '월세',
    date: getDateString(15),
  },
  {
    id: '4',
    type: 'expense',
    amount: 450000,
    category: '식비',
    description: '식료품 및 외식',
    date: getDateString(12),
  },
  {
    id: '5',
    type: 'expense',
    amount: 150000,
    category: '교통비',
    description: '대중교통 및 주유',
    date: getDateString(10),
  },
  {
    id: '6',
    type: 'expense',
    amount: 80000,
    category: '통신비',
    description: '핸드폰 요금',
    date: getDateString(8),
  },
  {
    id: '7',
    type: 'expense',
    amount: 200000,
    category: '문화생활',
    description: '영화, 공연',
    date: getDateString(6),
  },
  {
    id: '8',
    type: 'expense',
    amount: 350000,
    category: '쇼핑',
    description: '의류 구매',
    date: getDateString(4),
  },
  {
    id: '9',
    type: 'expense',
    amount: 120000,
    category: '의료비',
    description: '병원 진료',
    date: getDateString(2),
  },
  {
    id: '10',
    type: 'expense',
    amount: 300000,
    category: '저축',
    description: '적금 이체',
    date: getDateString(0),
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

// 금액 포맷팅 유틸리티
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Mock 데이터를 DashboardData 형식으로 변환
export function getMockDashboardData(): DashboardData {
  const stats = calculateStats(mockTransactions);
  const expenseByCategory = getExpenseByCategory(mockTransactions);

  const transactions: DashboardTransaction[] = mockTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
  }));

  return {
    stats: {
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      balance: stats.balance,
    },
    transactions,
    expenseByCategory,
  };
}

// 대시보드 데이터 가져오기 (mock 또는 API)
export async function fetchDashboardData(year?: number, month?: number): Promise<DashboardData> {
  if (useMockData) {
    return getMockDashboardData();
  }

  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));

  const url = `/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to fetch dashboard data');
  }

  return result.data;
}

// 타입 재export
export type { DashboardData, DashboardTransaction, DashboardStats, CategoryExpense };
