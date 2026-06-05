import type { AssetMonthlyInputRow, AssetMonthlyInputType } from '@/types';

export interface EditableMonthlyRow extends Omit<
  AssetMonthlyInputRow,
  | 'holdingId'
  | 'quantity'
  | 'priceOriginal'
  | 'exchangeRate'
  | 'priceKRW'
  | 'avgCostKRW'
  | 'totalValueKRW'
  | 'status'
> {
  rowKey: string;
  holdingId: string | null;
  quantityInput: string;
  priceOriginalInput: string;
  exchangeRateInput: string;
  priceKRWInput: string;
  avgCostInput: string;
  totalValueInput: string;
  isExpanded: boolean;
  isNew: boolean;
}

export function getInputType(assetClass: string, accountType: string): AssetMonthlyInputType {
  const lowerAssetClass = assetClass.toLowerCase();
  const lowerAccountType = accountType.toLowerCase();
  const valueOnlyTokens = ['deposit', 'savings', 'time_deposit', 'cma', 'cash'];

  if (
    assetClass.includes('예금') ||
    assetClass.includes('현금') ||
    accountType.includes('예금') ||
    accountType.includes('적금') ||
    accountType.toUpperCase().includes('CMA')
  ) {
    return 'value';
  }

  return valueOnlyTokens.some(
    token => lowerAssetClass.includes(token) || lowerAccountType === token
  )
    ? 'value'
    : 'quantity';
}

export function buildNewHoldingRow(params: {
  date: string;
  account: { id: string; name: string; memberName: string; accountType: string };
  institution: { name: string; type: string };
  assetMaster: {
    id: string;
    name: string;
    assetClass: string;
    currency: string;
    riskLevel?: string;
  };
}): EditableMonthlyRow {
  const { date, account, institution, assetMaster } = params;
  const inputType = getInputType(assetMaster.assetClass, account.accountType);
  return {
    rowKey: `new-${account.id}-${assetMaster.id}`,
    holdingId: null,
    accountId: account.id,
    assetMasterId: assetMaster.id,
    currentSnapshotId: null,
    date,
    assetName: assetMaster.name,
    assetClass: assetMaster.assetClass,
    subClass: null,
    riskLevel: assetMaster.riskLevel ?? '',
    currency: assetMaster.currency,
    memberName: account.memberName,
    accountName: account.name,
    accountType: account.accountType,
    institutionName: institution.name,
    institutionType: institution.type,
    inputType,
    prevQuantity: null,
    prevPriceOriginal: null,
    prevExchangeRate: null,
    prevPriceKRW: null,
    prevAvgCostKRW: null,
    prevTotalValueKRW: null,
    quantityInput: inputType === 'value' ? '1' : '',
    priceOriginalInput: '',
    exchangeRateInput: '',
    priceKRWInput: '',
    avgCostInput: '',
    totalValueInput: '',
    isCurrentMissing: false,
    isExpanded: inputType === 'quantity',
    isNew: true,
  };
}
