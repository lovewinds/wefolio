'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  type YearMonth,
  type MonthRange,
  getCurrentYearMonth,
  formatMonthDisplay,
  toMonthIndex,
  shiftDate,
  isWithinRange,
  clampToRange,
  mergeRanges,
  isSameRange,
  getTransactionRange,
  parseYearMonthFromQuery,
} from '@/lib/year-month-utils';

export interface UseMonthNavigationOptions {
  initialDate?: YearMonth;
  initialFromQuery?: { year: string | null; month: string | null };
  allowFutureNavigation?: boolean;
}

export interface UseMonthNavigationReturn {
  selectedDate: YearMonth;
  selectedYear: number;
  selectedMonth: number;
  currentMonthDisplay: string;

  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  setSelectedDate: (date: YearMonth) => void;

  canMovePrev: boolean;
  canMoveNext: boolean;

  availableRange: MonthRange | null;
  updateRangeFromData: (range: MonthRange | null, transactions?: { date: string }[]) => void;
}

function computeInitialDate(
  initialDate: YearMonth | undefined,
  initialFromQuery: { year: string | null; month: string | null } | undefined,
  fallback: YearMonth
): YearMonth {
  // Priority: initialDate > query params > current date
  if (initialDate) {
    return initialDate;
  }

  if (initialFromQuery) {
    const queryYear = parseYearMonthFromQuery(initialFromQuery.year, 9999, 2000);
    const queryMonth = parseYearMonthFromQuery(initialFromQuery.month, 12, 1);
    if (queryYear && queryMonth) {
      return { year: queryYear, month: queryMonth };
    }
  }

  return fallback;
}

export function useMonthNavigation(
  options: UseMonthNavigationOptions = {}
): UseMonthNavigationReturn {
  const { initialDate, initialFromQuery, allowFutureNavigation = false } = options;

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);

  const [selectedDate, setSelectedDate] = useState<YearMonth>(() =>
    computeInitialDate(initialDate, initialFromQuery, currentYearMonth)
  );
  const [availableRange, setAvailableRange] = useState<MonthRange | null>(null);

  const fallbackRange = useMemo(
    () => ({ min: currentYearMonth, max: currentYearMonth }),
    [currentYearMonth]
  );
  const effectiveRange = availableRange ?? fallbackRange;

  const { year: selectedYear, month: selectedMonth } = selectedDate;
  const currentMonthDisplay = formatMonthDisplay(selectedYear, selectedMonth);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(prev => {
      const next = shiftDate(prev, 'month', -1);
      return isWithinRange(next, effectiveRange) ? next : prev;
    });
  }, [effectiveRange]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(prev => {
      const next = shiftDate(prev, 'month', 1);
      if (allowFutureNavigation) {
        return next;
      }
      return isWithinRange(next, effectiveRange) ? next : prev;
    });
  }, [effectiveRange, allowFutureNavigation]);

  const canMovePrev = isWithinRange(shiftDate(selectedDate, 'month', -1), effectiveRange);

  const canMoveNext = allowFutureNavigation
    ? true
    : isWithinRange(shiftDate(selectedDate, 'month', 1), effectiveRange);

  const updateRangeFromData = useCallback(
    (range: MonthRange | null, transactions?: { date: string }[]) => {
      const rangeFromData = range ?? (transactions ? getTransactionRange(transactions) : null);

      if (rangeFromData) {
        const nextRange = range ? rangeFromData : mergeRanges(availableRange, rangeFromData);

        if (!availableRange || !isSameRange(availableRange, nextRange)) {
          setAvailableRange(nextRange);
          // Only clamp if future navigation is not allowed
          if (!allowFutureNavigation) {
            setSelectedDate(prev => clampToRange(prev, nextRange));
          } else {
            // Still clamp past navigation
            setSelectedDate(prev => {
              const minIndex = toMonthIndex(nextRange.min);
              const currentIndex = toMonthIndex(prev);
              if (currentIndex < minIndex) {
                return nextRange.min;
              }
              return prev;
            });
          }
        }
        return;
      }

      if (!availableRange) {
        setSelectedDate(currentYearMonth);
      }
    },
    [availableRange, currentYearMonth, allowFutureNavigation]
  );

  return {
    selectedDate,
    selectedYear,
    selectedMonth,
    currentMonthDisplay,
    handlePrevMonth,
    handleNextMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
    availableRange,
    updateRangeFromData,
  };
}
