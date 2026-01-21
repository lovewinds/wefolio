'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { LNB } from '@/components/features/layout';
import { TransactionForm } from '@/components/features/transaction';
import { IncomeExpenseChart, ExpenseByCategoryChart } from '@/components/features/dashboard';
import { Card } from '@/components/ui';
import type { CategoryExpense } from '@/types';

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  expenseByCategory: CategoryExpense[];
}

function TransactionNewContent() {
  const searchParams = useSearchParams();
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultDate =
    year && month
      ? `${year}-${month.padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`
      : new Date().toISOString().split('T')[0];

  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const y = year || now.getFullYear();
      const m = month || now.getMonth() + 1;

      const response = await fetch(`/api/dashboard?year=${y}&month=${m}`);
      const result = await response.json();

      if (result.success) {
        setData({
          totalIncome: result.data.stats.totalIncome,
          totalExpense: result.data.stats.totalExpense,
          expenseByCategory: result.data.expenseByCategory,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <main className="ml-16 px-8 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">거래 추가</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {loading ? (
              <Card>
                <div className="flex h-64 items-center justify-center">
                  <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
                </div>
              </Card>
            ) : data ? (
              <>
                <IncomeExpenseChart
                  totalIncome={data.totalIncome}
                  totalExpense={data.totalExpense}
                />
                <ExpenseByCategoryChart data={data.expenseByCategory} />
              </>
            ) : null}
          </div>

          <Card>
            <h2 className="mb-6 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              새 거래 입력
            </h2>
            <TransactionForm defaultDate={defaultDate} />
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function TransactionNewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
          <div className="ml-16 flex min-h-screen items-center justify-center">
            <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
          </div>
        </div>
      }
    >
      <TransactionNewContent />
    </Suspense>
  );
}
