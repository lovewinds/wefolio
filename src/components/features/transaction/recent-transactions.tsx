import Link from 'next/link';
import { formatAmount } from '@/lib/format-utils';
import type { DashboardTransaction } from '@/types';

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  limit?: number;
  detailHref?: string;
}

export function RecentTransactions({
  transactions,
  limit = 5,
  detailHref,
}: RecentTransactionsProps) {
  const visibleTransactions = transactions.slice(0, limit);

  return (
    <div className="mt-3 rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">최근 거래 내역</h3>
        {detailHref && (
          <Link
            href={detailHref}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {visibleTransactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            거래 내역이 없습니다.
          </p>
        ) : (
          visibleTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
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
    </div>
  );
}
