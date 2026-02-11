'use client';

import type { SavedTransaction } from './types';

interface SavedTransactionsListProps {
  transactions: SavedTransaction[];
}

export function SavedTransactionsList({ transactions }: SavedTransactionsListProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        이번 세션 저장 내역 ({transactions.length}건)
      </h3>
      <div className="space-y-2">
        {transactions.map(tx => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${
                  tx.type === 'expense'
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-emerald-500 dark:text-emerald-400'
                }`}
              >
                {tx.type === 'expense' ? '지출' : '수입'}
              </span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{tx.categoryName}</span>
              {tx.description && (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">{tx.description}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {tx.user && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{tx.user}</span>
              )}
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tx.amount.toLocaleString()}원
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
