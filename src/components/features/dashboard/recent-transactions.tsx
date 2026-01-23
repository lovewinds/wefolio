'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatAmount, type DashboardTransaction } from '@/lib/mock-data';

type TransactionTypeFilter = 'all' | 'income' | 'expense';
type SortOrder = 'none' | 'asc' | 'desc';

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  limit?: number;
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.amount - b.amount);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.amount - a.amount);
    }

    return result.slice(0, limit);
  }, [transactions, typeFilter, categoryFilter, sortOrder, limit]);

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">최근 거래 내역</h3>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TransactionTypeFilter)}
            className="rounded-full border-0 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 outline-none transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <option value="all">전체</option>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-full border-0 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 outline-none transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <option value="all">전체 카테고리</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            className="rounded-full border-0 bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 outline-none transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <option value="none">정렬 없음</option>
            <option value="asc">금액 오름차순</option>
            <option value="desc">금액 내림차순</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            조건에 맞는 거래 내역이 없습니다.
          </p>
        ) : (
          filteredTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                  }`}
                >
                  {transaction.category.charAt(0)}
                </span>
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    {transaction.category}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{transaction.date}</p>
                </div>
              </div>
              <p
                className={`font-semibold ${
                  transaction.type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatAmount(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
