// Transaction Types
export type TransactionType = 'income' | 'expense';

// Asset Types
export type AssetType = 'cash' | 'bank' | 'investment' | 'property' | 'other';

// Category with optional relations
export interface CategoryBase {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
  isDefault: boolean;
}

// Transaction with optional relations
export interface TransactionBase {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  date: Date;
  categoryId: string;
}

// Recurring Template
export interface RecurringTemplateBase {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  description?: string | null;
  categoryId: string;
}

// Asset
export interface AssetBase {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  note?: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard Types
export interface DashboardTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryExpense {
  id: string;
  label: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  transactions: DashboardTransaction[];
  expenseByCategory: CategoryExpense[];
}
