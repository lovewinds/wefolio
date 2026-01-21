'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardData, type DashboardData } from '@/lib/mock-data';
import {
  DashboardHeader,
  MonthlySummary,
  IncomeExpenseChart,
  ExpenseByCategoryChart,
  RecentTransactions,
} from '@/components/features/dashboard';

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatMonthDisplay(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => getCurrentYearMonth().year);
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth().month);

  const currentMonthDisplay = formatMonthDisplay(selectedYear, selectedMonth);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(prev => {
      if (prev === 1) {
        setSelectedYear(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(prev => {
      if (prev === 12) {
        setSelectedYear(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-rose-600 dark:text-rose-400">{error ?? 'Failed to load data'}</div>
      </div>
    );
  }

  const { stats, transactions, expenseByCategory } = data;
  const { totalIncome, totalExpense, balance } = stats;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <DashboardHeader />

        <MonthlySummary
          currentMonth={currentMonthDisplay}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
          <ExpenseByCategoryChart data={expenseByCategory} />
        </div>

        <RecentTransactions transactions={transactions} />
      </main>
    </div>
  );
}
