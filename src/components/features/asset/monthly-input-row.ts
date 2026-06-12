import type { AssetMonthlyInputRow, AssetMonthlyInputType } from '@/types';
import { getAssetInputType } from '@/lib/asset-input-type';

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
  // 사용자가 평균단가를 직접 입력했는지. true면 수량/가격 변경 시 자동 파생으로 덮어쓰지 않는다.
  avgCostEdited: boolean;
  totalValueInput: string;
  isExpanded: boolean;
  isNew: boolean;
}

export function getInputType(assetClass: string, accountType: string): AssetMonthlyInputType {
  return getAssetInputType(assetClass, accountType);
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
    avgCostEdited: false,
    totalValueInput: '',
    isCurrentMissing: false,
    isExpanded: inputType === 'quantity',
    isNew: true,
  };
}
