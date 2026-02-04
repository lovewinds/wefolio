import type { TransactionType } from './index';

// Dashboard Types
export interface DashboardTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
  paymentMethod?: string | null;
  user?: string | null;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface DashboardYearMonth {
  year: number;
  month: number;
}

export interface DashboardMonthRange {
  min: DashboardYearMonth;
  max: DashboardYearMonth;
}

export interface CategoryExpense {
  id: string;
  label: string;
  value: number;
  parentId?: string | null;
  parentLabel?: string;
  color?: string;
}

export interface HierarchicalCategoryExpense {
  id: string;
  label: string;
  value: number;
  color?: string;
  children?: HierarchicalCategoryExpense[];
}

export interface DashboardData {
  stats: DashboardStats;
  transactions: DashboardTransaction[];
  expenseByCategory: CategoryExpense[];
  incomeByCategory: CategoryExpense[];
  expenseByParentCategory?: HierarchicalCategoryExpense[];
  incomeByParentCategory?: HierarchicalCategoryExpense[];
  availableRange?: DashboardMonthRange;
}
