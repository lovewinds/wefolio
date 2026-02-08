export type RowStatus = 'empty' | 'editing' | 'saving' | 'saved' | 'error';

export interface HoldingTransactionInputRow {
  id: string;
  date: string;
  holdingId: string;
  transactionType: string;
  quantity: string;
  priceOriginal: string;
  priceKRW: string;
  exchangeRate: string;
  fees: string;
  notes: string;
  status: RowStatus;
  errorMessage?: string;
}

export interface HoldingTransactionRow {
  id: string;
  date: string;
  holdingId: string;
  transactionType: string;
  transactionTypeLabel: string;
  quantity: number;
  priceOriginal: number;
  priceKRW: number;
  exchangeRate: number | null;
  totalKRW: number;
  fees: number | null;
  notes: string | null;
  assetName: string;
  currency: string;
  accountName: string;
  memberName: string;
  institutionName: string;
}

export interface HoldingOption {
  id: string;
  label: string;
  currency: string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface HoldingTransactionInputRowRef {
  focusCell: (colIndex: number) => void;
}
