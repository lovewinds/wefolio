import { parseLocalDate } from '@/lib/date-utils';
import type { DashboardYearMonth, DashboardMonthRange } from '@/types';

// Type aliases for convenience
export type YearMonth = DashboardYearMonth;
export type MonthRange = DashboardMonthRange;

/**
 * Get current year and month
 */
export function getCurrentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Format year/month for display in Korean locale
 */
export function formatMonthDisplay(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

/**
 * Convert YearMonth to a comparable month index
 */
export function toMonthIndex({ year, month }: YearMonth): number {
  return year * 12 + (month - 1);
}

/**
 * Convert month index back to YearMonth
 */
export function fromMonthIndex(index: number): YearMonth {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month };
}

/**
 * Check if target date is within the given range
 */
export function isWithinRange(target: YearMonth, range: MonthRange): boolean {
  const index = toMonthIndex(target);
  return index >= toMonthIndex(range.min) && index <= toMonthIndex(range.max);
}

/**
 * Clamp target date to the given range
 */
export function clampToRange(target: YearMonth, range: MonthRange): YearMonth {
  const index = toMonthIndex(target);
  if (index < toMonthIndex(range.min)) return range.min;
  if (index > toMonthIndex(range.max)) return range.max;
  return target;
}

/**
 * Merge two ranges, taking the wider bounds
 */
export function mergeRanges(current: MonthRange | null, next: MonthRange): MonthRange {
  if (!current) return next;

  const min = toMonthIndex(next.min) < toMonthIndex(current.min) ? next.min : current.min;
  const max = toMonthIndex(next.max) > toMonthIndex(current.max) ? next.max : current.max;

  return { min, max };
}

/**
 * Check if two ranges are the same
 */
export function isSameRange(a: MonthRange, b: MonthRange): boolean {
  return toMonthIndex(a.min) === toMonthIndex(b.min) && toMonthIndex(a.max) === toMonthIndex(b.max);
}

/**
 * Shift date by month or year
 */
export function shiftDate(target: YearMonth, unit: 'month' | 'year', direction: 1 | -1): YearMonth {
  if (unit === 'year') {
    return { year: target.year + direction, month: target.month };
  }

  const nextMonth = target.month + direction;
  if (nextMonth === 0) {
    return { year: target.year - 1, month: 12 };
  }
  if (nextMonth === 13) {
    return { year: target.year + 1, month: 1 };
  }
  return { year: target.year, month: nextMonth };
}

/**
 * Parse transaction date string to Date object
 */
export function parseTransactionDate(value: string): Date | null {
  // YYYYMMDD format
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day));
  }

  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseLocalDate(value);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Get the date range from transactions
 */
export function getTransactionRange(transactions: { date: string }[]): MonthRange | null {
  if (transactions.length === 0) return null;

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const transaction of transactions) {
    const parsed = parseTransactionDate(transaction.date);
    if (!parsed) continue;
    if (!minDate || parsed < minDate) minDate = parsed;
    if (!maxDate || parsed > maxDate) maxDate = parsed;
  }

  if (!minDate || !maxDate) return null;

  return {
    min: { year: minDate.getUTCFullYear(), month: minDate.getUTCMonth() + 1 },
    max: { year: maxDate.getUTCFullYear(), month: maxDate.getUTCMonth() + 1 },
  };
}

/**
 * Parse year or month from query string with validation
 */
export function parseYearMonthFromQuery(
  value: string | null,
  max: number,
  min: number
): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}
