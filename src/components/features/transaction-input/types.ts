import type { TransactionType, CategoryGroup } from '@/types';

export interface SequentialFormState {
  user: string;
  type: TransactionType;
  date: string;
  categoryId: string;
  paymentMethod: string;
  amount: string;
  description: string;
}

export type StepField = keyof SequentialFormState;

export const STEP_FIELDS: StepField[] = [
  'user',
  'type',
  'date',
  'categoryId',
  'paymentMethod',
  'amount',
  'description',
];

export const STEP_LABELS: Record<StepField, string> = {
  user: '사용자',
  type: '유형',
  date: '날짜',
  categoryId: '카테고리',
  paymentMethod: '결제수단',
  amount: '금액',
  description: '메모',
};

export const OPTIONAL_STEPS = new Set<StepField>(['user', 'paymentMethod', 'description']);

export const PERSIST_AFTER_SAVE: StepField[] = ['user', 'type', 'date'];
export const RESET_TO_STEP = 3; // categoryId

export interface SavedTransaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string;
  date: string;
  user?: string;
  paymentMethod?: string;
}

export interface RecommendationItem {
  id: string;
  source: 'lastMonth' | 'template';
  label: string;
  categoryId: string;
  categoryName: string;
  paymentMethod?: string;
  amount?: number;
  description?: string;
  user?: string;
}

export interface FormOptions {
  categories: CategoryGroup[];
  paymentMethods: string[];
  users: string[];
  paymentMethodsByUser?: Record<string, string[]>;
}
