// Transaction Types
export type TransactionType = 'income' | 'expense';

// Asset Types
export type AssetType = 'cash' | 'bank' | 'investment' | 'property' | 'other';

// Payment Method Types
export type PaymentMethod = '현대카드' | '신한카드' | '계좌이체' | '현금';

// Family Member Types
export type FamilyMember = '지완' | '지아';

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
  paymentMethod?: string | null;
  user?: string | null;
}

// Transaction Form Data (for creating/updating transactions)
export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  paymentMethod?: string;
  user?: string;
  description?: string;
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
