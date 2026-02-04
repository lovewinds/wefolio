'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { MonthSelector } from '@/components/features/navigation';
import { SummaryCardGroup } from '@/components/features/summary';
import { IncomeExpenseChart, CategoryBreakdownChart } from '@/components/features/charts';
import { RecentTransactions } from '@/components/features/transaction';
import { PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';
import type { DashboardData } from '@/types';

interface MonthlySummaryViewProps {
  initialData: DashboardData;
  initialYear: number;
  initialMonth: number;
}

export function MonthlySummaryView({
  initialData,
  initialYear,
  initialMonth,
}: MonthlySummaryViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isFetching, setIsFetching] = useState(false);

  const {
    selectedYear,
    selectedMonth,
    navigationUnit,
    handlePrevMonth,
    handleNextMonth,
    toggleNavigationUnit,
    canMovePrev,
    canMoveNext,
    updateRangeFromData,
  } = useMonthNavigation({
    initialDate: { year: initialYear, month: initialMonth },
    allowFutureNavigation: false,
  });

  // On month change (not initial load), fetch via client
  useEffect(() => {
    if (selectedYear === initialYear && selectedMonth === initialMonth) return;

    const loadData = async () => {
      try {
        setIsFetching(true);
        const result = await apiClient.dashboard.getMonthly(selectedYear, selectedMonth);
        setData(result);
      } catch {
        // Keep previous data on error
      } finally {
        setIsFetching(false);
      }
    };
    loadData();
  }, [selectedYear, selectedMonth, initialYear, initialMonth]);

  useEffect(() => {
    updateRangeFromData(data.availableRange ?? null, data.transactions);
  }, [data, updateRangeFromData]);

  const { stats, transactions, expenseByParentCategory, incomeByParentCategory } = data;
  const { totalIncome, totalExpense, balance } = stats;
  const categoryChartData = {
    expense: expenseByParentCategory ?? [],
    income: incomeByParentCategory ?? [],
  };

  const actions = (
    <>
      <Link
        href={`/summary/monthly/detail?year=${selectedYear}&month=${selectedMonth}`}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        상세 보기
      </Link>
      <Link
        href={`/transactions/new?year=${selectedYear}&month=${selectedMonth}`}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        거래 추가
      </Link>
    </>
  );

  return (
    <PageContainer isFetching={isFetching}>
      <section className="mb-8">
        <MonthSelector
          year={selectedYear}
          month={selectedMonth}
          navigationUnit={navigationUnit}
          titleSuffix="요약"
          canPrev={canMovePrev}
          canNext={canMoveNext}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToggleNavigationUnit={toggleNavigationUnit}
          actions={actions}
        />
        <SummaryCardGroup totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
        <CategoryBreakdownChart dataByType={categoryChartData} />
      </div>

      <RecentTransactions transactions={transactions} />
    </PageContainer>
  );
}
