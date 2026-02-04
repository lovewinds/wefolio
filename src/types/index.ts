// Transaction Types
export type TransactionType = 'income' | 'expense';

// Asset Types
export * from './asset';

// Dashboard Types
export * from './dashboard';

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

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
