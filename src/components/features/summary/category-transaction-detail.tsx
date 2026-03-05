import { formatAmount } from '@/lib/format-utils';
import type { DashboardTransaction, CategoryExpense } from '@/types';

interface CategoryTransactionDetailProps {
  label: string;
  isParent: boolean;
  parentLabel?: string;
  categoryType: 'income' | 'expense';
  transactions: DashboardTransaction[];
  categoryExpenses: CategoryExpense[];
  onClose: () => void;
}

export function CategoryTransactionDetail({
  label,
  isParent,
  parentLabel,
  categoryType,
  transactions,
  categoryExpenses,
  onClose,
}: CategoryTransactionDetailProps) {
  // Filter transactions based on whether parent or child category was clicked
  let filtered: DashboardTransaction[];
  if (isParent) {
    // Find all child category labels under this parent
    const childLabels = new Set(
      categoryExpenses.filter(ce => ce.parentLabel === label).map(ce => ce.label)
    );
    // Also include the parent label itself (for categories with no children)
    childLabels.add(label);
    filtered = transactions.filter(
      t => t.type === categoryType && (childLabels.has(t.category) || t.category === label)
    );
  } else {
    filtered = transactions.filter(t => t.type === categoryType && t.category === label);
  }

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const total = sorted.reduce((sum, t) => sum + t.amount, 0);

  const title = isParent
    ? label
    : parentLabel && parentLabel !== label
      ? `${parentLabel} > ${label}`
      : label;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</span>
          <span
            className={`text-sm font-medium ${
              categoryType === 'expense'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            합계 {formatAmount(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="닫기"
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Transaction list */}
      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          거래 내역이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
          {sorted.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {t.date.slice(5, 10).replace('-', '/')}
                </span>
                {isParent && (
                  <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {t.category}
                  </span>
                )}
                {t.description && (
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {t.description}
                  </span>
                )}
              </div>
              <span
                className={`shrink-0 text-sm font-medium ${
                  categoryType === 'expense'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatAmount(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
