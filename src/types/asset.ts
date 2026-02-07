// ============================================
// 자산 관리 시스템 타입 정의
// ============================================

// 금융기관 타입
export type AssetInstitutionType = '은행' | '증권';

// 계좌 타입
export type AccountType =
  | '예금' // 저축예금
  | '적금' // 정기예금
  | '청약' // 청약
  | '종합' // 일반 증권계좌
  | 'CMA' // CMA
  | '연금저축' // 연금저축
  | 'IRP' // IRP
  | 'ISA' // ISA
  | '코인' // 코인
  | '금현물'; // 금현물

// 자산 분류
export type AssetClass =
  | '주식' // 주식
  | '채권' // 채권
  | '예금' // 예금
  | '금' // 금
  | '펀드' // 펀드
  | 'ETF' // ETF
  | '코인'; // 코인

// 자산 세부 분류
export type AssetSubClass =
  | '성장' // 성장
  | '배당' // 배당
  | '국채' // 국채
  | '회사채'; // 회사채

// 위험 수준
export type RiskLevel = '안전자산' | '중립자산' | '위험자산';

// 통화
export type Currency = 'KRW' | 'USD';

// 거래 유형
export type HoldingTransactionType =
  | '매수' // 매수
  | '매도' // 매도
  | '배당' // 배당
  | '이체입고' // 이체입고
  | '이체출고'; // 이체출고

// 데이터 소스
export type DataSource = '스냅샷' | '거래';

// 가격 소스
export type PriceSource = 'API' | '수기';

// 스냅샷 소스
export type SnapshotSource = '수기' | '가져오기' | 'API';

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
export interface FamilyMemberBase {
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
  metadata?: string | null;
  isActive: boolean;
}

// 자산 가격
export interface AssetPriceBase {
  id: string;
  assetMasterId: string;
  date: Date;
  priceOriginal: number;
  exchangeRate?: number | null;
  priceKRW: number;
  source?: PriceSource | null;
}

// 계좌
export interface AccountBase {
  id: string;
  memberId: string;
  institutionId: string;
  name: string;
  accountType: AccountType;
  currency: Currency;
  cashBalance: number;
  isActive: boolean;
}

// 계좌 스냅샷
export interface AccountSnapshotBase {
  id: string;
  accountId: string;
  date: Date;
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
}

// 보유 종목
export interface HoldingBase {
  id: string;
  accountId: string;
  assetMasterId: string;
  quantity: number;
  averageCostOriginal?: number | null;
  averageCostKRW: number;
  dataSource: DataSource;
}

// 매수/매도 거래
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
  fees?: number | null;
  notes?: string | null;
}

// 보유 종목 스냅샷
export interface HoldingValueSnapshotBase {
  id: string;
  holdingId: string;
  date: Date;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number | null;
  priceKRW: number;
  totalValueKRW: number;
  source: SnapshotSource;
}

// ============================================
// 관계 포함 인터페이스
// ============================================

// 계좌 (관계 포함)
export interface AccountWithRelations extends AccountBase {
  member?: FamilyMemberBase;
  institution?: AssetInstitutionBase;
  holdings?: HoldingWithAsset[];
}

// 보유 종목 (자산 정보 포함)
// Note: assetMaster와 currentPrice는 Prisma 모델 타입과 호환되도록 유연하게 정의
export interface HoldingWithAsset {
  id: string;
  accountId: string;
  assetMasterId: string;
  quantity: number;
  averageCostOriginal?: number | null;
  averageCostKRW: number;
  dataSource: string;
  assetMaster?: {
    id: string;
    symbol?: string | null;
    name: string;
    assetClass: string;
    subClass?: string | null;
    riskLevel: string;
    currency: string;
    metadata?: string | null;
    isActive: boolean;
  };
  currentPrice?: {
    id: string;
    assetMasterId: string;
    date: Date;
    priceOriginal: number;
    exchangeRate?: number | null;
    priceKRW: number;
    source?: string | null;
  };
  currentValue?: number;
  profitLoss?: number;
  profitLossRate?: number;
}

// 자산 마스터 (최신 가격 포함)
export interface AssetMasterWithPrice extends AssetMasterBase {
  latestPrice?: AssetPriceBase;
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
export interface FamilyMemberFormData {
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
  metadata?: string;
  isActive?: boolean;
}

// 계좌 생성/수정
export interface AccountFormData {
  memberId: string;
  institutionId: string;
  name: string;
  accountType: AccountType;
  currency?: Currency;
  cashBalance?: number;
  isActive?: boolean;
}

// 보유 종목 생성/수정
export interface HoldingFormData {
  accountId: string;
  assetMasterId: string;
  quantity: number;
  averageCostOriginal?: number;
  averageCostKRW: number;
  dataSource?: DataSource;
}

// 거래 생성
export interface HoldingTransactionFormData {
  holdingId: string;
  transactionType: HoldingTransactionType;
  date: string;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number;
  priceKRW: number;
  totalKRW: number;
  fees?: number;
  notes?: string;
}

// 가격 입력
export interface AssetPriceFormData {
  assetMasterId: string;
  date: string;
  priceOriginal: number;
  exchangeRate?: number;
  priceKRW: number;
  source?: PriceSource;
}

// ============================================
// 집계/요약 인터페이스
// ============================================

// 가족 구성원별 자산 요약
export interface MemberAssetSummary {
  memberId: string;
  memberName: string;
  memberColor?: string | null;
  totalCash: number;
  totalHoldings: number;
  totalAssets: number;
  accountCount: number;
}

// 자산 분류별 요약
export interface AssetClassSummary {
  assetClass: AssetClass;
  totalValue: number;
  percentage: number;
  holdingCount: number;
}

// 기관별 요약
export interface AssetInstitutionSummary {
  institutionId: string;
  institutionName: string;
  institutionType: AssetInstitutionType;
  totalValue: number;
  accountCount: number;
}

// 계좌 요약
export interface AccountSummary {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  memberName: string;
  institutionName: string;
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
}

// 포트폴리오 전체 요약
export interface PortfolioSummary {
  totalAssets: number;
  totalCash: number;
  totalHoldings: number;
  byMember: MemberAssetSummary[];
  byAssetClass: AssetClassSummary[];
  byInstitution: AssetInstitutionSummary[];
}

// ============================================
// 메타데이터 타입
// ============================================

// AssetMaster.metadata JSON 구조
export interface AssetMetadata {
  isin?: string;
  exchange?: string;
  sector?: string;
  country?: string;
  [key: string]: string | undefined;
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
