export type RowStatus = 'empty' | 'editing' | 'saving' | 'saved' | 'error';

export interface HoldingTransactionInputRow {
  id: string;
  date: string;
  institutionId: string;
  accountId: string;
  assetMasterId: string;
  transactionType: string;
  quantity: string;
  priceOriginal: string;
  priceKRW: string;
  exchangeRate: string;
  notes: string;
  status: RowStatus;
  errorMessage?: string;
}

export interface HoldingTransactionRow {
  id: string;
  date: string;
  accountId: string;
  assetMasterId: string;
  transactionType: string;
  transactionTypeLabel: string;
  quantity: number;
  priceOriginal: number;
  priceKRW: number;
  exchangeRate: number | null;
  totalKRW: number;
  notes: string | null;
  assetName: string;
  currency: string;
  accountName: string;
  memberName: string;
  institutionName: string;
}

export interface InstitutionOption {
  id: string;
  name: string;
  type: string;
}

export interface AccountOption {
  id: string;
  name: string;
  institutionId: string;
  memberName: string;
  memberId: string;
  accountType: string;
}

export interface AssetMasterOption {
  id: string;
  name: string;
  currency: string;
  assetClass: string;
}

export interface MemberOption {
  id: string;
  name: string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface HoldingTransactionInputRowRef {
  focusCell: (colIndex: number) => void;
}
