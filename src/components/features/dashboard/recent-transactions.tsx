import { Card } from '@/components/ui/card';
import { formatAmount, type DashboardTransaction } from '@/lib/mock-data';

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  limit?: number;
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  return (
    <Card className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        최근 거래 내역
      </h3>
      <div className="space-y-3">
        {transactions.slice(0, limit).map(transaction => (
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
        ))}
      </div>
    </Card>
  );
}
