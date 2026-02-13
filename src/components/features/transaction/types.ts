export type RowStatus = 'empty' | 'editing' | 'saving' | 'saved' | 'error';

export interface InputRow {
  id: string;
  date: string;
  categoryId: string;
  paymentMethod: string;
  user: string;
  description: string;
  amount: string;
  status: RowStatus;
  errorMessage?: string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface InputTableRowRef {
  focusCell: (colIndex: number) => void;
}
