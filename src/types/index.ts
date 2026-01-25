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
  parentId?: string | null;
}

// Category with hierarchy (for nested display)
export interface CategoryWithChildren extends CategoryBase {
  children?: CategoryBase[];
  parent?: CategoryBase | null;
}

// Category with parent info (for form select)
export interface CategoryWithParent extends CategoryBase {
  parentName?: string;
  parentIcon?: string;
}

// Grouped categories for select
export interface CategoryGroup {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  children?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    parentId: string;
    parentName: string;
  }[];
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

// Hierarchical category expense for sunburst chart
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
