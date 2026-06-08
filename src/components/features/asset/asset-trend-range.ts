import type { YearMonth, MonthRange } from '@/lib/year-month-utils';

export function computeAssetTrendRange(
  periodMonths: number,
  endDate: YearMonth,
  availableRange: MonthRange | null
) {
  if (periodMonths === 0 && availableRange) {
    return {
      startYear: availableRange.min.year,
      startMonth: availableRange.min.month,
      endYear: endDate.year,
      endMonth: endDate.month,
    };
  }

  let startYear = endDate.year;
  let startMonth = endDate.month - (periodMonths - 1);
  while (startMonth < 1) {
    startMonth += 12;
    startYear--;
  }

  return {
    startYear,
    startMonth,
    endYear: endDate.year,
    endMonth: endDate.month,
  };
}
