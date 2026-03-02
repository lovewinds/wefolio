'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MonthSelector } from '@/components/features/navigation';
import { SequentialTransactionForm } from '@/components/features/transaction-input';
import { PageContainer } from '@/components/ui';
import { useMonthNavigation } from '@/hooks';

function TransactionInputContent() {
  const searchParams = useSearchParams();

  const {
    selectedYear,
    selectedMonth,
    handlePrevMonth,
    handleNextMonth,
    setSelectedDate,
    canMovePrev,
    canMoveNext,
  } = useMonthNavigation({
    initialFromQuery: {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    },
    allowFutureNavigation: true,
  });

  const actions = (
    <Link
      href={`/summary/monthly/detail?year=${selectedYear}&month=${selectedMonth}`}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
        <path d="m15 18-6-6 6-6" />
      </svg>
      상세 목록
    </Link>
  );

  return (
    <PageContainer>
      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        titleSuffix="거래 입력"
        canPrev={canMovePrev}
        canNext={canMoveNext}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onYearChange={y => setSelectedDate({ year: y, month: selectedMonth })}
        onMonthChange={m => setSelectedDate({ year: selectedYear, month: m })}
        actions={actions}
      />

      <SequentialTransactionForm
        key={`${selectedYear}-${selectedMonth}`}
        year={selectedYear}
        month={selectedMonth}
      />
    </PageContainer>
  );
}

export default function TransactionInputPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
      }
    >
      <TransactionInputContent />
    </Suspense>
  );
}
