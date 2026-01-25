/**
 * 날짜 유틸리티 함수
 * 모든 날짜를 UTC 자정(00:00:00.000Z)으로 저장하여 타임존 일관성 보장
 */

/**
 * 날짜 문자열(YYYY-MM-DD)을 UTC 자정 Date로 변환
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Date를 날짜 문자열(YYYY-MM-DD)로 변환 (UTC 기준)
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 해당 월의 시작일과 종료일을 UTC로 반환
 */
export function getMonthRangeUTC(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

/**
 * Date에서 년/월/일 추출 (UTC 기준)
 */
export function getDatePartsUTC(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (로컬 기준)
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
