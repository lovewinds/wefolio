'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { LNB } from '@/components/features/navigation';
import { MultiRowForm, RecentTransactions } from '@/components/features/transaction';
import { Card } from '@/components/ui';
import { fetchDashboardData, type DashboardTransaction } from '@/lib/mock-data';
import { getTodayString } from '@/lib/date-utils';

function TransactionNewContent() {
  const searchParams = useSearchParams();
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);

  const defaultDate =
    year && month
      ? `${year}-${month.padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`
      : getTodayString();

  useEffect(() => {
    const loadTransactions = async () => {
      const now = new Date();
      const y = year ? parseInt(year, 10) : now.getFullYear();
      const m = month ? parseInt(month, 10) : now.getMonth() + 1;
      const data = await fetchDashboardData(y, m);
      setTransactions(data.transactions);
    };
    loadTransactions();
  }, [year, month]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <main className="ml-16 px-8 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">거래 추가</h1>

        <div className="grid gap-6 lg:grid-cols-1">
          <Card>
            <h2 className="mb-6 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              새 거래 입력
            </h2>
            <MultiRowForm defaultDate={defaultDate} />
          </Card>

          <RecentTransactions transactions={transactions} />
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
