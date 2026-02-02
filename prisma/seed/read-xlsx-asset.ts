import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {
  type SeedOptions,
  formatWarning,
  isRowEmpty,
  parseAmount,
  parseExcelDate,
  pickCell,
} from './read-xlsx-common';

// 컬럼 인덱스 정의 (A3:O3, 15개 컬럼)
const ASSET_COLUMN_INDEX = {
  index: 0, // A: 무시
  accountType: 1, // B: 투자/연금
  memberName: 2, // C: 사용자
  riskLevel: 3, // D: 위험/안전
  assetClass: 4, // E: 대분류 (주식/예금/금/채권/코인)
  subClass: 5, // F: 분류 (성장주식/배당주식/외화/원화 등)
  institutionName: 6, // G: 기관명
  accountName: 7, // H: 계좌명 (CMA, IRP, ISA 등)
  assetName: 8, // I: 종목명
  date: 9, // J: 기준일자
  quantity: 10, // K: 보유 개수
  priceOriginal: 11, // L: 개당 가격
  foreignValue: 12, // M: 외화 가격 (생략 가능)
  exchangeRate: 13, // N: 환율
  totalValueKRW: 14, // O: 원화 환산 금액
};

const ASSET_COLUMN_LABEL = {
  index: '순번',
  accountType: '투자/연금',
  memberName: '사용자',
  riskLevel: '위험/안전',
  assetClass: '대분류',
  subClass: '분류',
  institutionName: '기관',
  accountName: '계좌명',
  assetName: '종목명',
  date: '기준일자',
  quantity: '보유개수',
  priceOriginal: '개당가격',
  foreignValue: '외화가격',
  exchangeRate: '환율',
  totalValueKRW: '원화금액',
};

// 엑셀에서 파싱한 자산 스냅샷 입력 타입
export type SeedAssetSnapshotInput = {
  // 가족 구성원
  memberName: string;

  // 기관 정보
  institutionName: string;

  // 계좌 정보
  accountType: string; // 투자/연금 → account type 변환
  accountName: string;

  // 자산 정보
  assetName: string;
  assetClass: string; // 대분류
  subClass?: string; // 분류
  riskLevel: string; // 위험/안전

  // 스냅샷 값
  date: Date;
  quantity: number;
  priceOriginal: number;
  exchangeRate?: number;
  totalValueKRW: number;

  // 통화 추론 (환율 유무로 판단)
  currency: 'KRW' | 'USD';
};

export type AssetBuildResult = {
  snapshots: SeedAssetSnapshotInput[];
  warnings: string[];
  sheetName: string;
  sampleRecord: Record<string, unknown> | null;
};

/**
 * 통화 추론 - 환율이 1보다 크면 USD, 그 외는 KRW
 */
function inferCurrency(exchangeRate: number | null): 'KRW' | 'USD' {
  if (exchangeRate && exchangeRate > 1) return 'USD';
  return 'KRW';
}

/**
 * 계좌 유형 변환
 * - 투자 → regular 또는 cma
 * - 연금 → 연금저축 또는 irp
 * - 계좌명에서 추가 힌트 (IRP, ISA, CMA 등)
 */
export function normalizeAccountType(
  accountTypeRaw: string,
  accountName: string
): '예금' | '적금' | '청약' | '종합' | 'CMA' | 'IRP' | 'ISA' | '연금저축' | '코인' | '금현물' {
  const type = accountTypeRaw?.trim().toLowerCase() ?? '';
  const name = accountName?.trim().toUpperCase() ?? '';

  // 계좌명에서 힌트 추출
  if (name.includes('IRP')) return 'IRP';
  if (name.includes('ISA')) return 'ISA';
  if (name.includes('CMA')) return 'CMA';
  if (name.includes('업비트')) return '코인';
  if (name.includes('연금저축') || name.includes('연금')) return '연금저축';
  if (name.includes('금현물')) return '금현물';
  if (name.includes('환전')) return '예금';

  // 계좌 유형 기반 판단
  if (type.includes('연금')) {
    return '연금저축';
  }
  if (type.includes('투자')) {
    return '종합';
  }

  // 기본값
  return '종합';
}

/**
 * 위험 수준 변환
 * - 위험, 공격적 → aggressive
 * - 안전, 보수적 → conservative
 * - 기타 → moderate
 */
export function normalizeRiskLevel(riskLevelRaw: string): '위험자산' | '안전자산' {
  const level = riskLevelRaw?.trim().toLowerCase() ?? '';

  if (level.includes('위험') || level.includes('공격')) {
    return '위험자산';
  }
  if (level.includes('안전') || level.includes('보수')) {
    return '안전자산';
  }
  return '안전자산';
}

/**
 * 대분류(assetClass) 변환
 * - 주식 → stock
 * - 예금 → deposit
 * - 금 → gold
 * - 채권 → bond
 * - 코인 → crypto (스키마에서는 stock 등으로 처리)
 * - ETF → etf
 */
export function normalizeAssetClass(
  assetClassRaw: string
): '주식' | '채권' | '예금' | '금' | '코인' {
  const cls = assetClassRaw?.trim().toLowerCase() ?? '';

  if (cls.includes('주식')) return '주식';
  if (cls.includes('예금') || cls.includes('정기') || cls.includes('적금')) return '예금';
  if (cls.includes('금')) return '금';
  if (cls.includes('채권')) return '채권';
  if (cls.includes('코인') || cls.includes('암호화폐') || cls.includes('가상화폐')) return '코인';

  return '주식'; // 기본값
}

/**
 * 분류(subClass) 변환
 * - 성장 → growth
 * - 배당 → dividend
 * - 국채 → government
 * - 회사채 → corporate
 */
export function normalizeSubClass(
  subClassRaw: string
): '성장' | '배당' | '국채' | '회사채' | undefined {
  const sub = subClassRaw?.trim().toLowerCase() ?? '';

  if (sub.includes('성장')) return '성장';
  if (sub.includes('배당')) return '배당';
  if (sub.includes('국채') || sub.includes('국고')) return '국채';
  if (sub.includes('회사') || sub.includes('기업')) return '회사채';

  return undefined;
}

/**
 * 7번째 시트에서 자산 스냅샷 데이터를 파싱합니다.
 */
export function buildAssetSnapshotsFromXlsx(options: SeedOptions): AssetBuildResult {
  if (!fs.existsSync(options.filePath)) {
    throw new Error(`엑셀 파일을 찾을 수 없습니다: ${options.filePath}`);
  }

  const workbook = XLSX.readFile(options.filePath, { cellDates: true });
  const sheetIndex = options.sheetNumber - 1;
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) {
    throw new Error(`시트 ${options.sheetNumber}를 찾을 수 없습니다.`);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  }) as unknown[][];
  const trimmedRows = rows.slice(options.skipRows);

  if (trimmedRows.length === 0) {
    throw new Error('데이터 행이 존재하지 않습니다.');
  }

  const snapshots: SeedAssetSnapshotInput[] = [];
  const warnings: string[] = [];
  let sampleRecord: Record<string, unknown> | null = null;

  for (const row of trimmedRows) {
    if (!row || isRowEmpty(row)) continue;

    // 샘플 레코드 저장 (디버깅용)
    if (!sampleRecord) {
      sampleRecord = {
        raw: row,
        mapped: {
          [ASSET_COLUMN_LABEL.index]: pickCell(row, ASSET_COLUMN_INDEX.index),
          [ASSET_COLUMN_LABEL.accountType]: pickCell(row, ASSET_COLUMN_INDEX.accountType),
          [ASSET_COLUMN_LABEL.memberName]: pickCell(row, ASSET_COLUMN_INDEX.memberName),
          [ASSET_COLUMN_LABEL.riskLevel]: pickCell(row, ASSET_COLUMN_INDEX.riskLevel),
          [ASSET_COLUMN_LABEL.assetClass]: pickCell(row, ASSET_COLUMN_INDEX.assetClass),
          [ASSET_COLUMN_LABEL.subClass]: pickCell(row, ASSET_COLUMN_INDEX.subClass),
          [ASSET_COLUMN_LABEL.institutionName]: pickCell(row, ASSET_COLUMN_INDEX.institutionName),
          [ASSET_COLUMN_LABEL.accountName]: pickCell(row, ASSET_COLUMN_INDEX.accountName),
          [ASSET_COLUMN_LABEL.assetName]: pickCell(row, ASSET_COLUMN_INDEX.assetName),
          [ASSET_COLUMN_LABEL.date]: pickCell(row, ASSET_COLUMN_INDEX.date),
          [ASSET_COLUMN_LABEL.quantity]: pickCell(row, ASSET_COLUMN_INDEX.quantity),
          [ASSET_COLUMN_LABEL.priceOriginal]: pickCell(row, ASSET_COLUMN_INDEX.priceOriginal),
          [ASSET_COLUMN_LABEL.foreignValue]: pickCell(row, ASSET_COLUMN_INDEX.foreignValue),
          [ASSET_COLUMN_LABEL.exchangeRate]: pickCell(row, ASSET_COLUMN_INDEX.exchangeRate),
          [ASSET_COLUMN_LABEL.totalValueKRW]: pickCell(row, ASSET_COLUMN_INDEX.totalValueKRW),
        },
      };
    }

    // 필수 필드 추출
    const memberNameRaw = pickCell(row, ASSET_COLUMN_INDEX.memberName);
    const memberName =
      typeof memberNameRaw === 'string' ? memberNameRaw.trim() : String(memberNameRaw ?? '').trim();
    if (!memberName) {
      warnings.push(formatWarning('사용자 이름 공백', row));
      continue;
    }

    const institutionNameRaw = pickCell(row, ASSET_COLUMN_INDEX.institutionName);
    const institutionName =
      typeof institutionNameRaw === 'string'
        ? institutionNameRaw.trim()
        : String(institutionNameRaw ?? '').trim();
    if (!institutionName) {
      warnings.push(formatWarning('기관명 공백', row));
      continue;
    }

    const accountTypeRaw = pickCell(row, ASSET_COLUMN_INDEX.accountType);
    const accountTypeStr =
      typeof accountTypeRaw === 'string'
        ? accountTypeRaw.trim()
        : String(accountTypeRaw ?? '').trim();

    const accountNameRaw = pickCell(row, ASSET_COLUMN_INDEX.accountName);
    const accountName =
      typeof accountNameRaw === 'string'
        ? accountNameRaw.trim()
        : String(accountNameRaw ?? '').trim();
    if (!accountName) {
      warnings.push(formatWarning('계좌명 공백', row));
      continue;
    }

    const assetNameRaw = pickCell(row, ASSET_COLUMN_INDEX.assetName);
    const assetName =
      typeof assetNameRaw === 'string' ? assetNameRaw.trim() : String(assetNameRaw ?? '').trim();
    if (!assetName) {
      warnings.push(formatWarning('종목명 공백', row));
      continue;
    }

    const assetClassRaw = pickCell(row, ASSET_COLUMN_INDEX.assetClass);
    const assetClassStr =
      typeof assetClassRaw === 'string' ? assetClassRaw.trim() : String(assetClassRaw ?? '').trim();

    const subClassRaw = pickCell(row, ASSET_COLUMN_INDEX.subClass);
    const subClassStr =
      typeof subClassRaw === 'string' ? subClassRaw.trim() : String(subClassRaw ?? '').trim();

    const riskLevelRaw = pickCell(row, ASSET_COLUMN_INDEX.riskLevel);
    const riskLevelStr =
      typeof riskLevelRaw === 'string' ? riskLevelRaw.trim() : String(riskLevelRaw ?? '').trim();

    // 날짜 파싱
    const dateValue = pickCell(row, ASSET_COLUMN_INDEX.date);
    const date = parseExcelDate(dateValue);
    if (!date) {
      warnings.push(formatWarning(`날짜 파싱 실패: ${String(dateValue ?? '')}`, row));
      continue;
    }

    // 원화 환산 금액 파싱 (먼저 파싱하여 캐시 예금 처리에 사용)
    const totalValueKRWValue = pickCell(row, ASSET_COLUMN_INDEX.totalValueKRW);
    const totalValueKRW = parseAmount(totalValueKRWValue);
    if (totalValueKRW === null) {
      warnings.push(formatWarning(`원화 금액 파싱 실패: ${String(totalValueKRWValue ?? '')}`, row));
      continue;
    }

    // 환율 파싱 (선택적)
    const exchangeRateValue = pickCell(row, ASSET_COLUMN_INDEX.exchangeRate);
    const exchangeRate = parseAmount(exchangeRateValue);

    // 수량 파싱 (캐시 예금은 quantity가 null일 수 있음)
    const quantityValue = pickCell(row, ASSET_COLUMN_INDEX.quantity);
    let quantity = parseAmount(quantityValue);

    // 개당 가격 파싱
    const priceOriginalValue = pickCell(row, ASSET_COLUMN_INDEX.priceOriginal);
    let priceOriginal = parseAmount(priceOriginalValue);

    // 캐시 예금/자동운용 처리: quantity와 price가 null이면 totalValueKRW를 사용
    const isCashLikeAsset =
      assetName.includes('예금') ||
      assetName.includes('청약') ||
      assetName.includes('포인트') ||
      assetName.includes('현금') ||
      assetName.includes('캐시') ||
      assetName.includes('자동운용') ||
      assetName.includes('RP') ||
      assetName.includes('MMF');
    if (isCashLikeAsset && (quantity === null || priceOriginal === null)) {
      // 캐시 예금은 수량 1, 개당 가격 = 총 가치로 처리
      quantity = 1;
      priceOriginal = totalValueKRW;
    }

    if (quantity === null) {
      warnings.push(formatWarning(`수량 파싱 실패: ${String(quantityValue ?? '')}`, row));
      continue;
    }

    if (priceOriginal === null) {
      warnings.push(formatWarning(`가격 파싱 실패: ${String(priceOriginalValue ?? '')}`, row));
      continue;
    }

    // 통화 추론
    const currency = inferCurrency(exchangeRate);

    // 정규화된 값으로 스냅샷 생성
    snapshots.push({
      memberName,
      institutionName,
      accountType: normalizeAccountType(accountTypeStr, accountName),
      accountName,
      assetName,
      assetClass: normalizeAssetClass(assetClassStr),
      subClass: normalizeSubClass(subClassStr),
      riskLevel: normalizeRiskLevel(riskLevelStr),
      date,
      quantity,
      priceOriginal,
      exchangeRate: exchangeRate ?? undefined,
      totalValueKRW,
      currency,
    });
  }

  return { snapshots, warnings, sheetName, sampleRecord };
}
