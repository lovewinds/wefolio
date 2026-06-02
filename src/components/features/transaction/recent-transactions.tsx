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
    <div className="mt-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-1)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">최근 거래 내역</h3>
        {detailHref && (
          <Link href={detailHref} className="text-sm text-ink-subtle hover:text-ink-muted">
            전체 보기 →
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {visibleTransactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-subtle">거래 내역이 없습니다.</p>
        ) : (
          visibleTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b border-hairline-soft pb-2 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    transaction.type === 'income' ? 'gain-soft text-gain' : 'loss-soft text-loss'
                  }`}
                >
                  {transaction.category.charAt(0)}
                </span>
                <div>
                  <p className="font-medium text-ink">{transaction.category}</p>
                  <p className="text-sm text-ink-subtle">{transaction.date}</p>
                </div>
              </div>
              <p
                className={`font-semibold ${
                  transaction.type === 'income' ? 'text-gain' : 'text-loss'
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
