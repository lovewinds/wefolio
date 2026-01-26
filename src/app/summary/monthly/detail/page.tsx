'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchDashboardData, type DashboardData } from '@/lib/mock-data';
import { MonthSelector } from '@/components/features/dashboard';
import { MonthlyDetailTable } from '@/components/features/transaction';
import { LNB } from '@/components/features/layout';
import { useMonthNavigation } from '@/hooks';

function MonthlyDetailContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    initialFromQuery: {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    },
    allowFutureNavigation: true,
  });

  const loadData = useCallback(async () => {
    try {
      setIsFetching(true);
      const dashboardData = await fetchDashboardData(selectedYear, selectedMonth);
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsFetching(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data) return;
    updateRangeFromData(data.availableRange ?? null, data.transactions);
  }, [data, updateRangeFromData]);

  if (!data && isFetching) {
    return (
      <main className="ml-16 flex min-h-screen items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="ml-16 flex min-h-screen items-center justify-center">
        <div className="text-rose-600 dark:text-rose-400">{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ml-16 flex min-h-screen items-center justify-center">
        <div className="text-rose-600 dark:text-rose-400">Failed to load data</div>
      </main>
    );
  }

  const { transactions } = data;

  const actions = (
    <>
      <Link
        href="/summary/monthly"
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        요약 보기
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
    <main
      className={`ml-16 px-8 py-8 transition-opacity duration-150 ${
        isFetching ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        navigationUnit={navigationUnit}
        titleSuffix="상세"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToggleNavigationUnit={toggleNavigationUnit}
        actions={actions}
      />

      <MonthlyDetailTable
        transactions={transactions}
        year={selectedYear}
        month={selectedMonth}
        onDataChange={loadData}
      />
    </main>
  );
}

export default function MonthlyDetailPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <Suspense
        fallback={
          <main className="ml-16 flex min-h-screen items-center justify-center">
            <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
          </main>
        }
      >
        <MonthlyDetailContent />
      </Suspense>
    </div>
  );
}
