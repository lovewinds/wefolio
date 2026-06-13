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

export interface AssetMonthlyMetrics {
  cashValue: number;
  investmentValue: number;
  principalValue: number;
  unrealizedGain: number;
}

export interface AssetMonthlyData {
  totalValue: number;
  metrics: AssetMonthlyMetrics;
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
  metrics: AssetMonthlyMetrics;
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

export type AssetMovementInsightType =
  | 'cash_to_investment'
  | 'investment_to_cash'
  | 'net_increase'
  | 'net_decrease'
  | 'mixed';

export interface AssetMovementInsight {
  type: AssetMovementInsightType;
  title: string;
  description: string;
  confidence: 'confirmed' | 'estimated';
}

export interface AssetHoldingChangeSummary {
  newCount: number;
  increasedCount: number;
  decreasedCount: number;
  closedCount: number;
}

export interface AssetChangeDelta {
  totalValue: number; // ΔN = 총자산 변화
  cashValue: number; // ΔC = 현금 잔고 변화
  investmentValue: number; // ΔV = 투자 평가액 변화
  externalInflow: number; // 외부 순유입(저축·납입) = ΔC + Σ매매 효과
  marketGain: number; // 시장 손익 = Σ가격 효과
}

export interface AssetChangeBreakdown {
  prev: AssetMonthlyMetrics & { totalValue: number };
  current: AssetMonthlyMetrics & { totalValue: number };
  delta: AssetChangeDelta;
  movementInsight: AssetMovementInsight | null;
  holdingChanges: AssetHoldingChangeSummary;
}

export interface AssetMonthlyDataWithDelta extends AssetMonthlyData {
  holdings: HoldingRowWithDelta[];
  prevTotalValue: number | null;
  deltaAmount: number | null;
  deltaPercent: number | null;
  prevByRiskLevel: RiskGroupDelta[];
  changeBreakdown: AssetChangeBreakdown | null;
}

// ============================================
// 투자 수익 현황(FR-C1) 타입
// ============================================

// 종목별 투자 성과 행. 모든 지표는 스냅샷 필드에서 파생(별도 저장 없음).
export interface AssetProfitRow {
  id: string;
  assetName: string;
  assetClass: string;
  subClass: string | null;
  riskLevel: string;
  currency: string;
  memberName: string;
  accountName: string;
  institutionName: string;
  quantity: number;
  avgCostKRW: number;
  currentPriceKRW: number;
  priceOriginal: number;
  exchangeRate: number | null;
  principal: number; // quantity × avgCostKRW (value형은 = value)
  value: number; // quantity × currentPriceKRW
  gain: number; // value − principal (value형은 0)
  returnRate: number | null; // gain / principal (원금 0 → null)
  valueType: boolean; // 현금성(예금·청약 등) 여부
}

export interface AssetProfitData {
  rows: AssetProfitRow[];
  snapshotDate: string | null; // 표시용 기준일(해당 월 최신 스냅샷 날짜, YYYY-MM-DD)
  availableRange: {
    min: { year: number; month: number };
    max: { year: number; month: number };
  } | null;
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
  institutionType: string;
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
  // true면 사용자가 평균단가를 직접 보정한 값 → 서버가 그대로 사용. false/미지정이면 직전 스냅샷으로 자동 파생.
  avgCostManual?: boolean;
  totalValueKRW: number;
}

export interface AssetMonthlyInputSaveRequest {
  year: number;
  month: number;
  rows: AssetMonthlyInputSaveRow[];
}
