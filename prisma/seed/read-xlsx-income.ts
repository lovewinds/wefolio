import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {
  type BuildResult,
  type SeedOptions,
  type SeedTransactionInput,
  formatWarning,
  isRowEmpty,
  normalizeType,
  parseAmount,
  parseExcelDate,
  pickCell,
} from './read-xlsx-common';

const INCOME_COLUMN_INDEX = {
  type: 0,
  category: 1,
  date: 2,
  description: 3,
  amount: 4,
  user: 5,
};

const INCOME_COLUMN_LABEL = {
  type: '대분류',
  category: '소분류',
  date: '일자',
  description: '내역',
  amount: '금액',
  user: '사용자',
};

export function buildIncomeTransactionsFromXlsx(options: SeedOptions): BuildResult {
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

  const dataRows = trimmedRows;

  const transactions: SeedTransactionInput[] = [];
  const warnings: string[] = [];
  let sampleRecord: Record<string, unknown> | null = null;

  for (const row of dataRows) {
    if (!row || isRowEmpty(row)) continue;

    if (!sampleRecord) {
      sampleRecord = {
        raw: row,
        mapped: {
          [INCOME_COLUMN_LABEL.type]: pickCell(row, INCOME_COLUMN_INDEX.type),
          [INCOME_COLUMN_LABEL.category]: pickCell(row, INCOME_COLUMN_INDEX.category),
          [INCOME_COLUMN_LABEL.date]: pickCell(row, INCOME_COLUMN_INDEX.date),
          [INCOME_COLUMN_LABEL.description]: pickCell(row, INCOME_COLUMN_INDEX.description),
          [INCOME_COLUMN_LABEL.amount]: pickCell(row, INCOME_COLUMN_INDEX.amount),
          [INCOME_COLUMN_LABEL.user]: pickCell(row, INCOME_COLUMN_INDEX.user),
        },
      };
    }

    const dateValue = pickCell(row, INCOME_COLUMN_INDEX.date);
    const date = parseExcelDate(dateValue);
    if (!date) {
      warnings.push(formatWarning(`날짜 파싱 실패: ${String(dateValue ?? '')}`, row));
      continue;
    }

    let type = normalizeType(pickCell(row, INCOME_COLUMN_INDEX.type));
    const amount = parseAmount(pickCell(row, INCOME_COLUMN_INDEX.amount));

    if (amount === null || amount === 0) {
      warnings.push(
        formatWarning(
          `금액 파싱 실패 또는 0: ${String(pickCell(row, INCOME_COLUMN_INDEX.amount) ?? '')}`,
          row
        )
      );
      continue;
    }

    if (!type) {
      if (amount > 0) {
        type = 'income';
      } else {
        warnings.push(
          formatWarning(
            `수입/지출 구분 실패: ${String(pickCell(row, INCOME_COLUMN_INDEX.type) ?? '')}`,
            row
          )
        );
        continue;
      }
    }

    const categoryValue = pickCell(row, INCOME_COLUMN_INDEX.category);
    const categoryName =
      typeof categoryValue === 'string' ? categoryValue.trim() : String(categoryValue ?? '').trim();
    if (!categoryName) {
      warnings.push(formatWarning('카테고리 공백', row));
      continue;
    }

    const descriptionValue = pickCell(row, INCOME_COLUMN_INDEX.description);
    const userValue = pickCell(row, INCOME_COLUMN_INDEX.user);

    transactions.push({
      type,
      amount: Math.abs(amount),
      categoryName,
      description: descriptionValue ? String(descriptionValue) : undefined,
      date,
      paymentMethod: undefined, // 수입에는 지출방법 없음
      user: userValue ? String(userValue) : undefined,
    });
  }

  return { transactions, warnings, sheetName, sampleRecord };
}
