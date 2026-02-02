import * as XLSX from 'xlsx';

// Excel 날짜 파싱 시 한국 시간 기준으로 해석하기 위한 설정
const DEFAULT_TIMEZONE = 'Asia/Seoul';

if (!process.env.TZ) {
  process.env.TZ = DEFAULT_TIMEZONE;
}

export type SeedTransactionInput = {
  type: 'income' | 'expense';
  amount: number;
  categoryName: string;
  description?: string;
  date: Date;
  paymentMethod?: string;
  user?: string;
};

export type SeedType = 'expense' | 'income' | 'asset' | 'all';

export type SeedOptions = {
  filePath: string;
  sheetNumber: number;
  skipRows: number;
  autoApprove: boolean;
  verbose: boolean;
  seedType: SeedType;
};

export type BuildResult = {
  transactions: SeedTransactionInput[];
  warnings: string[];
  sheetName: string;
  sampleRecord: Record<string, unknown> | null;
};

const DEFAULT_SEED_OPTIONS: Omit<SeedOptions, 'sheetNumber'> = {
  filePath: '',
  skipRows: 3,
  autoApprove: false,
  verbose: false,
  seedType: 'all',
};

export function parseSeedOptions(): Omit<SeedOptions, 'sheetNumber'> {
  const args = process.argv.slice(2);
  const options = {
    ...DEFAULT_SEED_OPTIONS,
    filePath: process.env.SEED_XLSX_PATH ?? '',
    skipRows: Number(process.env.SEED_XLSX_SKIP ?? DEFAULT_SEED_OPTIONS.skipRows),
    autoApprove: process.env.SEED_XLSX_YES === 'true',
    verbose: process.env.SEED_XLSX_VERBOSE === 'true',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const [key, inlineValue] = arg.split('=');
    const value = inlineValue ?? args[i + 1];

    if (key === '--skip') {
      options.skipRows = Number(value);
      if (!inlineValue) i += 1;
      continue;
    }

    if (key === '--file') {
      options.filePath = value;
      if (!inlineValue) i += 1;
      continue;
    }

    if (key === '--yes') {
      options.autoApprove = true;
    }

    if (key === '--verbose') {
      options.verbose = true;
    }

    if (key === '--type') {
      const typeValue = value?.toLowerCase();
      if (
        typeValue === 'expense' ||
        typeValue === 'income' ||
        typeValue === 'asset' ||
        typeValue === 'all'
      ) {
        options.seedType = typeValue;
        if (!inlineValue) i += 1;
      } else {
        throw new Error(`유효하지 않은 시드 타입: ${value}. (expense|income|asset|all 중 선택)`);
      }
      continue;
    }
  }

  if (!Number.isFinite(options.skipRows) || options.skipRows < 0) {
    throw new Error('무시할 행 수는 0 이상의 숫자여야 합니다.');
  }

  return options;
}

export function pickCell(row: unknown[], index: number) {
  const value = row[index];
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
}

export function parseExcelDate(value: unknown): Date | null {
  // UTC 자정으로 날짜 생성
  const toUtcMidnight = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month - 1, day));

  if (value instanceof Date) {
    // XLSX가 반환하는 Date는 자정 근처일 때 날짜 경계 문제가 발생할 수 있음
    // 3시간 버퍼를 추가하여 자정 직전(예: 23:59)도 올바른 날짜로 처리
    const BUFFER_MS = 3 * 60 * 60 * 1000;
    const adjusted = new Date(value.getTime() + BUFFER_MS);
    return toUtcMidnight(adjusted.getFullYear(), adjusted.getMonth() + 1, adjusted.getDate());
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return toUtcMidnight(parsed.y, parsed.m, parsed.d);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const compactMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compactMatch) {
      const [, y, m, d] = compactMatch;
      return toUtcMidnight(Number(y), Number(m), Number(d));
    }

    const normalized = trimmed.replace(/\./g, '-').replace(/\//g, '-');
    const dateMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dateMatch) {
      const [, y, m, d] = dateMatch;
      return toUtcMidnight(Number(y), Number(m), Number(d));
    }

    const parsedDate = new Date(normalized);
    if (!Number.isNaN(parsedDate.getTime())) {
      // 문자열에서 파싱된 날짜도 UTC 자정으로 변환
      return toUtcMidnight(
        parsedDate.getFullYear(),
        parsedDate.getMonth() + 1,
        parsedDate.getDate()
      );
    }
  }

  return null;
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  }

  return null;
}

export function normalizeType(value: unknown): 'income' | 'expense' | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.includes('수입') || trimmed.includes('income')) return 'income';
  if (trimmed.includes('지출') || trimmed.includes('expense')) return 'expense';
  return null;
}

export function isRowEmpty(row: unknown[]): boolean {
  return row.every(cell => cell === null || cell === undefined || cell === '');
}

function formatDateISO(date: Date) {
  return date.toISOString();
}

export function formatRawRow(row: unknown[]) {
  return JSON.stringify(row, (_key, value) => {
    if (value instanceof Date) {
      return formatDateISO(value);
    }
    return value;
  });
}

export function formatWarning(message: string, row: unknown[]) {
  return `${message} | raw: ${formatRawRow(row)}`;
}

export function formatMonthKey(date: Date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

export function summarizeMonthlyCounts(transactions: SeedTransactionInput[]) {
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    const key = formatMonthKey(tx.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
}
