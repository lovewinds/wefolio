'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardData, type DashboardData } from '@/lib/mock-data';
import {
  MonthlySummary,
  IncomeExpenseChart,
  ExpenseByCategoryChart,
  RecentTransactions,
} from '@/components/features/dashboard';
import { LNB } from '@/components/features/layout';

type YearMonth = {
  year: number;
  month: number;
};

type MonthRange = {
  min: YearMonth;
  max: YearMonth;
};

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatMonthDisplay(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

function toMonthIndex({ year, month }: YearMonth) {
  return year * 12 + (month - 1);
}

function isWithinRange(target: YearMonth, range: MonthRange) {
  const index = toMonthIndex(target);
  return index >= toMonthIndex(range.min) && index <= toMonthIndex(range.max);
}

function clampToRange(target: YearMonth, range: MonthRange): YearMonth {
  const index = toMonthIndex(target);
  if (index < toMonthIndex(range.min)) return range.min;
  if (index > toMonthIndex(range.max)) return range.max;
  return target;
}

function shiftDate(target: YearMonth, unit: 'month' | 'year', direction: 1 | -1): YearMonth {
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

function parseTransactionDate(value: string) {
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getTransactionRange(transactions: DashboardData['transactions']): MonthRange | null {
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
    min: { year: minDate.getFullYear(), month: minDate.getMonth() + 1 },
    max: { year: maxDate.getFullYear(), month: maxDate.getMonth() + 1 },
  };
}

function mergeRanges(current: MonthRange | null, next: MonthRange): MonthRange {
  if (!current) return next;

  const min = toMonthIndex(next.min) < toMonthIndex(current.min) ? next.min : current.min;
  const max = toMonthIndex(next.max) > toMonthIndex(current.max) ? next.max : current.max;

  return { min, max };
}

function isSameRange(current: MonthRange, next: MonthRange) {
  return (
    toMonthIndex(current.min) === toMonthIndex(next.min) &&
    toMonthIndex(current.max) === toMonthIndex(next.max)
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<YearMonth>(() => getCurrentYearMonth());
  const [availableRange, setAvailableRange] = useState<MonthRange | null>(null);
  const [navigationUnit, setNavigationUnit] = useState<'month' | 'year'>('month');

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const fallbackRange = useMemo(
    () => ({ min: currentYearMonth, max: currentYearMonth }),
    [currentYearMonth]
  );
  const effectiveRange = availableRange ?? fallbackRange;

  const { year: selectedYear, month: selectedMonth } = selectedDate;
  const currentMonthDisplay = formatMonthDisplay(selectedYear, selectedMonth);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate(prev => {
      const next = shiftDate(prev, navigationUnit, -1);
      return isWithinRange(next, effectiveRange) ? next : prev;
    });
  }, [effectiveRange, navigationUnit]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(prev => {
      const next = shiftDate(prev, navigationUnit, 1);
      return isWithinRange(next, effectiveRange) ? next : prev;
    });
  }, [effectiveRange, navigationUnit]);

  const canMovePrev = isWithinRange(shiftDate(selectedDate, navigationUnit, -1), effectiveRange);
  const canMoveNext = isWithinRange(shiftDate(selectedDate, navigationUnit, 1), effectiveRange);
  const toggleNavigationUnit = useCallback(() => {
    setNavigationUnit(prev => (prev === 'month' ? 'year' : 'month'));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await fetchDashboardData(selectedYear, selectedMonth);
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (!data) return;

    const rangeFromData = data.availableRange ?? getTransactionRange(data.transactions);
    if (rangeFromData) {
      const nextRange = data.availableRange
        ? rangeFromData
        : mergeRanges(availableRange, rangeFromData);
      if (!availableRange || !isSameRange(availableRange, nextRange)) {
        setAvailableRange(nextRange);
        setSelectedDate(prev => clampToRange(prev, nextRange));
      }
      return;
    }

    if (!availableRange) {
      setSelectedDate(currentYearMonth);
    }
  }, [availableRange, currentYearMonth, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <LNB />
        <main className="ml-16 flex min-h-screen items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <LNB />
        <main className="ml-16 flex min-h-screen items-center justify-center">
          <div className="text-rose-600 dark:text-rose-400">{error ?? 'Failed to load data'}</div>
        </main>
      </div>
    );
  }

  const { stats, transactions, expenseByCategory, expenseByParentCategory } = data;
  const { totalIncome, totalExpense, balance } = stats;
  // 계층 구조 데이터가 있으면 사용, 없으면 기존 데이터 사용
  const categoryChartData = expenseByParentCategory ?? expenseByCategory;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <main className="ml-16 px-8 py-8">
        <MonthlySummary
          currentMonth={currentMonthDisplay}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          year={selectedYear}
          month={selectedMonth}
          navigationUnit={navigationUnit}
          onToggleNavigationUnit={toggleNavigationUnit}
          canPrev={canMovePrev}
          canNext={canMoveNext}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
          <ExpenseByCategoryChart data={categoryChartData} />
        </div>

        <RecentTransactions transactions={transactions} />
      </main>
    </div>
  );
}
