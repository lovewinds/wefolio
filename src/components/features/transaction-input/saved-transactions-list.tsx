'use client';

import type { SavedTransaction } from './types';

interface SavedTransactionsListProps {
  transactions: SavedTransaction[];
  editingId: string | null;
  onEdit: (tx: SavedTransaction) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
    >
      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474zM4.75 14.25h6.5a.75.75 0 0 0 0-1.5h-6.5a.75.75 0 0 0 0 1.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
    >
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
    >
      <path
        fillRule="evenodd"
        d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SavedTransactionsList({
  transactions,
  editingId,
  onEdit,
  onDelete,
  onCancelEdit,
}: SavedTransactionsListProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        이번 세션 저장 내역 ({transactions.length}건)
      </h3>
      <div className="space-y-2">
        {transactions.map(tx => {
          const isEditing = tx.id === editingId;

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-2.5 transition-opacity ${
                isEditing
                  ? 'border-blue-200 bg-blue-50/50 opacity-60 dark:border-blue-800 dark:bg-blue-950/20'
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`shrink-0 text-xs font-medium ${
                    tx.type === 'expense'
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-emerald-500 dark:text-emerald-400'
                  }`}
                >
                  {tx.type === 'expense' ? '지출' : '수입'}
                </span>
                <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                  {tx.categoryName}
                </span>
                {tx.description && (
                  <span className="hidden truncate text-sm text-zinc-400 dark:text-zinc-500 sm:inline">
                    {tx.description}
                  </span>
                )}
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {tx.user && (
                  <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:inline">
                    {tx.user}
                  </span>
                )}
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tx.amount.toLocaleString()}원
                </span>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    title="편집 취소"
                    className="rounded p-0.5 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
                  >
                    <XIcon />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      title="수정"
                      className="rounded p-0.5 text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tx.id)}
                      title="삭제"
                      className="rounded p-0.5 text-zinc-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400"
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
