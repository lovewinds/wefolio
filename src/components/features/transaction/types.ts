import type { TransactionType } from '@/types';

export type RowStatus = 'empty' | 'editing' | 'saving' | 'saved' | 'error';

export interface TransactionRow {
  id: string;
  amount: string;
  categoryId: string;
  date: string;
  paymentMethod: string;
  user: string;
  description: string;
  status: RowStatus;
  errorMessage?: string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface MultiRowFormProps {
  defaultDate?: string;
  defaultUser?: string;
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}
