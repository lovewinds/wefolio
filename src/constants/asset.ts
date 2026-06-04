// 자산 도메인 enum성 상수 (SSOT)
// 값은 시드 파서(prisma/seed/read-xlsx-asset.ts)의 정규화 결과 및
// docs-new/data-model.md 의 정의와 일치시킨다.

export const ASSET_CLASS = ['주식', '채권', '예금', '금', '코인'] as const;
export type AssetClass = (typeof ASSET_CLASS)[number];

export const SUB_CLASS = ['성장', '배당', '국채', '회사채'] as const;
export type AssetSubClass = (typeof SUB_CLASS)[number];

export const RISK_LEVEL = ['위험자산', '안전자산'] as const;
export type RiskLevel = (typeof RISK_LEVEL)[number];

export const ACCOUNT_TYPE = [
  '예금',
  '적금',
  '청약',
  '종합',
  'CMA',
  'IRP',
  'ISA',
  '연금저축',
  '코인',
  '금현물',
] as const;
export type AccountType = (typeof ACCOUNT_TYPE)[number];

export const CURRENCY = ['KRW', 'USD'] as const;
export type Currency = (typeof CURRENCY)[number];

// 금융기관 유형
export const INSTITUTION_TYPE = ['bank', 'brokerage'] as const;
export type InstitutionType = (typeof INSTITUTION_TYPE)[number];
