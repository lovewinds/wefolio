// ============================================
// 자산 관리 시스템 타입 정의
// ============================================

// enum성 상수 타입은 src/constants/asset.ts(SSOT)에서 파생한다.
import type {
  AccountType,
  AssetClass,
  AssetSubClass,
  RiskLevel,
  Currency,
} from '@/constants/asset';

export type { AccountType, AssetClass, AssetSubClass, RiskLevel, Currency };

// 금융기관 타입 (표시용 라벨)
export type AssetInstitutionType = '은행' | '증권';

// 거래 유형
export type HoldingTransactionType =
  | '매수' // 매수
  | '매도' // 매도
  | '배당' // 배당
  | '이체입고' // 이체입고
  | '이체출고'; // 이체출고

// ============================================
// 기본 인터페이스
// ============================================

// 금융기관
export interface AssetInstitutionBase {
  id: string;
  name: string;
  type: AssetInstitutionType;
  isActive: boolean;
}

// 가족 구성원
export interface MemberBase {
  id: string;
  name: string;
  color?: string | null;
  isActive: boolean;
}

// 자산 마스터 (종목 정의)
export interface AssetMasterBase {
  id: string;
  symbol?: string | null;
  name: string;
  assetClass: AssetClass;
  subClass?: AssetSubClass | null;
  riskLevel: RiskLevel;
  currency: Currency;
  isActive: boolean;
}

// 계좌
export interface AccountBase {
  id: string;
  memberId: string;
  institutionId: string;
  name: string;
  accountType: AccountType;
  currency: Currency;
  isActive: boolean;
}

// 보유 종목 (계좌×종목 연결. 현재 상태는 최신 스냅샷에서 파생)
export interface HoldingBase {
  id: string;
  accountId: string;
  assetMasterId: string;
}

// 매수/매도 거래 (비권위 보조)
export interface HoldingTransactionBase {
  id: string;
  holdingId: string;
  transactionType: HoldingTransactionType;
  date: Date;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number | null;
  priceKRW: number;
  totalKRW: number;
  notes?: string | null;
}

// 보유 종목 스냅샷 (SSOT)
export interface HoldingSnapshotBase {
  id: string;
  holdingId: string;
  snapshotDate: Date;
  quantity: number;
  avgCostKRW: number;
  currentPriceKRW: number;
  exchangeRate?: number | null;
  priceOriginal?: number | null;
  avgCostOriginal?: number | null;
}

// 계좌 현금 스냅샷 (SSOT)
export interface CashSnapshotBase {
  id: string;
  accountId: string;
  snapshotDate: Date;
  cashBalanceKRW: number;
}

// ============================================
// 폼 데이터 인터페이스
// ============================================

// 금융기관 생성/수정
export interface AssetInstitutionFormData {
  name: string;
  type: AssetInstitutionType;
  isActive?: boolean;
}

// 가족 구성원 생성/수정
export interface MemberFormData {
  name: string;
  color?: string;
  isActive?: boolean;
}

// 자산 마스터 생성/수정
export interface AssetMasterFormData {
  symbol?: string;
  name: string;
  assetClass: AssetClass;
  subClass?: AssetSubClass;
  riskLevel?: RiskLevel;
  currency?: Currency;
  isActive?: boolean;
}

// 계좌 생성/수정
export interface AccountFormData {
  memberId: string;
  institutionId: string;
  name: string;
  accountType: AccountType;
  currency?: Currency;
  isActive?: boolean;
}

// 보유 종목 생성/수정
export interface HoldingFormData {
  accountId: string;
  assetMasterId: string;
}

// 거래 생성 (비권위 보조)
export interface HoldingTransactionFormData {
  holdingId: string;
  transactionType: HoldingTransactionType;
  date: string;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number;
  priceKRW: number;
  totalKRW: number;
  notes?: string;
}

// ============================================
// 자산 현황 페이지 타입
// ============================================

export interface HoldingRow {
  id: string;
  assetName: string;
  assetClass: string;
  subClass: string | null;
  riskLevel: string;
  currency: string;
  quantity: number;
  priceOriginal: number;
  exchangeRate: number | null;
  priceKRW: number;
  totalValueKRW: number;
  percentage: number;
  memberName: string;
  accountName: string;
  accountType: string;
  institutionName: string;
}

export interface RiskChild {
  label: string;
  value: number;
  percentage: number;
}

export interface RiskGroup {
  riskLevel: string;
  totalValue: number;
  percentage: number;
  children: RiskChild[];
}

export interface AssetMonthlyData {
  totalValue: number;
  byRiskLevel: RiskGroup[];
  holdings: HoldingRow[];
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
}

export interface HoldingRowWithDelta extends HoldingRow {
  prevTotalValueKRW: number | null;
  deltaAmount: number | null;
}

export interface RiskGroupDelta {
  riskLevel: string;
  totalValue: number;
  percentage: number;
}

// 자산 추이 페이지 타입
export interface AssetTrendEntry {
  year: number;
  month: number;
  totalValue: number;
  deltaAmount: number | null;
  deltaPercent: number | null;
  byRiskLevel: RiskGroupDelta[];
  byMember: { name: string; value: number }[];
  topGainer: { name: string; amount: number } | null;
  topLoser: { name: string; amount: number } | null;
}

export interface AssetTrendData {
  trend: AssetTrendEntry[];
}

export interface AssetMonthlyDataWithDelta extends AssetMonthlyData {
  holdings: HoldingRowWithDelta[];
  prevTotalValue: number | null;
  deltaAmount: number | null;
  deltaPercent: number | null;
  prevByRiskLevel: RiskGroupDelta[];
}

// ============================================
// 자산 월말 입력 타입
// ============================================

export type AssetMonthlyInputMode = 'create' | 'edit';

export type AssetMonthlyInputStatus = '유지' | '증가' | '감소' | '신규' | '정리됨';

export type AssetMonthlyInputType = 'value' | 'quantity';

export interface AssetMonthlyInputRow {
  holdingId: string;
  accountId: string;
  assetMasterId: string;
  currentSnapshotId: string | null;
  date: string;
  assetName: string;
  assetClass: string;
  subClass: string | null;
  riskLevel: string;
  currency: string;
  memberName: string;
  accountName: string;
  accountType: string;
  institutionName: string;
  inputType: AssetMonthlyInputType;
  prevQuantity: number | null;
  prevPriceOriginal: number | null;
  prevExchangeRate: number | null;
  prevPriceKRW: number | null;
  prevAvgCostKRW: number | null;
  prevTotalValueKRW: number | null;
  quantity: number;
  priceOriginal: number;
  exchangeRate: number | null;
  priceKRW: number;
  avgCostKRW: number;
  totalValueKRW: number;
  status: AssetMonthlyInputStatus;
  isCurrentMissing: boolean;
}

export interface AssetMonthlyInputDraft {
  year: number;
  month: number;
  date: string;
  mode: AssetMonthlyInputMode;
  prevMonth: { year: number; month: number };
  prevTotalValue: number;
  currentTotalValue: number;
  deltaAmount: number;
  rows: AssetMonthlyInputRow[];
}

export interface AssetMonthlyInputSaveRow {
  holdingId?: string | null;
  accountId: string;
  assetMasterId: string;
  date: string;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number | null;
  priceKRW: number;
  avgCostKRW?: number;
  totalValueKRW: number;
}

export interface AssetMonthlyInputSaveRequest {
  year: number;
  month: number;
  rows: AssetMonthlyInputSaveRow[];
}
