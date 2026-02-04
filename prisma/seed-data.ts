import * as XLSX from 'xlsx';

// Excel에서 로드된 사전 정의 카테고리 타입
export type PredefinedCategory = {
  subcategoryName: string; // 소분류명 (L열)
  parentName: string; // 대분류명 (M열)
  type: 'income' | 'expense'; // 카테고리 타입
};

export type CategoryRangeOptions = {
  filePath: string;
  sheetNumber: number;
  startRow: number;
  endRow: number;
  subcategoryCol: string;
  parentCol: string;
  type: 'income' | 'expense';
};

/**
 * Excel 파일에서 사전 정의된 카테고리 데이터를 로드합니다.
 * 지출: L4:M31 범위 (subcategoryCol='L', parentCol='M', startRow=4, endRow=31)
 * 수입: J4:K14 범위 (subcategoryCol='J', parentCol='K', startRow=4, endRow=14)
 */
export function loadPredefinedCategories(options: CategoryRangeOptions): PredefinedCategory[] {
  const workbook = XLSX.readFile(options.filePath);
  const sheetName = workbook.SheetNames[options.sheetNumber];
  const worksheet = workbook.Sheets[sheetName];

  const categories: PredefinedCategory[] = [];

  for (let row = options.startRow; row <= options.endRow; row++) {
    const subcategoryCell = worksheet[`${options.subcategoryCol}${row}`];
    const parentCell = worksheet[`${options.parentCol}${row}`];

    const subcategoryName = subcategoryCell ? String(subcategoryCell.v).trim() : '';
    const parentName = parentCell ? String(parentCell.v).trim() : '';

    // 빈 행이면 스킵
    if (!subcategoryName && !parentName) {
      continue;
    }

    categories.push({
      subcategoryName,
      parentName,
      type: options.type,
    });
  }

  return categories;
}

/**
 * Excel 파일에서 사전 정의된 지출방법 데이터를 로드합니다.
 * O3:O18 범위를 읽습니다 (O3은 헤더, O4:O18이 실제 데이터).
 */
export function loadPredefinedPaymentMethods(options: {
  filePath: string;
  sheetNumber: number;
}): string[] {
  const workbook = XLSX.readFile(options.filePath);
  const sheetName = workbook.SheetNames[options.sheetNumber];
  const worksheet = workbook.Sheets[sheetName];

  // O4:O18 범위에서 데이터 읽기 (헤더 제외)
  const paymentMethods: string[] = [];

  for (let row = 4; row <= 18; row++) {
    const cell = worksheet[`O${row}`];
    const value = cell ? String(cell.v).trim() : '';

    // 빈 셀이면 스킵
    if (!value) {
      continue;
    }

    paymentMethods.push(value);
  }

  return paymentMethods;
}
