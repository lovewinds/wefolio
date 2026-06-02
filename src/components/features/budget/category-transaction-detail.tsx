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

function TransactionRow({
  t,
  showCategory,
  categoryType,
}: {
  t: DashboardTransaction;
  showCategory: boolean;
  categoryType: 'income' | 'expense';
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 w-9 text-center text-xs text-ink-faint">
          {t.date.slice(5, 10).replace('-', '/')}
        </span>
        {showCategory && (
          <span className="shrink-0 rounded-md bg-surface-soft px-1.5 py-0.5 text-xs text-ink-subtle">
            {t.category}
          </span>
        )}
        <span className="truncate text-sm text-ink-muted">{t.description ?? '-'}</span>
      </div>
      <span
        className={`shrink-0 text-sm font-medium ${
          categoryType === 'expense' ? 'text-loss' : 'text-gain'
        }`}
      >
        {formatAmount(t.amount)}
      </span>
    </div>
  );
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
    const childLabels = new Set(
      categoryExpenses.filter(ce => ce.parentLabel === label).map(ce => ce.label)
    );
    childLabels.add(label);
    filtered = transactions.filter(
      t => t.type === categoryType && (childLabels.has(t.category) || t.category === label)
    );
  } else {
    filtered = transactions.filter(t => t.type === categoryType && t.category === label);
  }

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const title = isParent
    ? label
    : parentLabel && parentLabel !== label
      ? `${parentLabel} > ${label}`
      : label;

  // Subcategory stats (only for parent categories)
  const subcategoryStats = isParent
    ? categoryExpenses.filter(ce => ce.parentLabel === label).sort((a, b) => b.value - a.value)
    : [];
  const totalValue = subcategoryStats.reduce((s, sc) => s + sc.value, 0) || 1;
  const maxValue = subcategoryStats[0]?.value ?? 1;

  // Grouped transactions for parent view
  const groupOrder = subcategoryStats.map(s => s.label);
  const grouped = new Map<string, DashboardTransaction[]>();
  if (isParent) {
    for (const cat of groupOrder) grouped.set(cat, []);
    for (const t of sorted) {
      if (!grouped.has(t.category)) grouped.set(t.category, []);
      grouped.get(t.category)!.push(t);
    }
  }

  const amountClass = categoryType === 'expense' ? 'text-loss' : 'text-gain';

  return (
    <div className="rounded-2xl border border-hairline bg-surface shadow-[var(--shadow-1)]">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-hairline-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-ink truncate">{title}</span>
          {sorted.length > 0 && (
            <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-xs text-ink-subtle">
              {sorted.length}건
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`text-sm font-medium ${amountClass}`}>
            합계 {formatAmount(sorted.reduce((s, t) => s + t.amount, 0))}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-soft hover:text-ink-muted"
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
      </div>

      {/* Body: 2-column when parent with subcategories, single column otherwise */}
      {isParent && subcategoryStats.length >= 2 ? (
        <div className="grid grid-cols-1 divide-y divide-hairline-soft md:grid-cols-[1fr_1fr] md:divide-x md:divide-y-0">
          {/* Left: Subcategory breakdown */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-ink-faint uppercase tracking-wide">
              소분류 비중
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-center">
              {subcategoryStats.map(sc => {
                const pct = Math.round((sc.value / maxValue) * 100);
                const totalPct = Math.round((sc.value / totalValue) * 100);
                return (
                  <>
                    <div key={`bar-${sc.id}`} className="space-y-0.5 min-w-0">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-muted">{sc.label}</span>
                        <span className="text-ink-faint">{totalPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-soft overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: sc.color ?? '#71717a' }}
                        />
                      </div>
                    </div>
                    <span
                      key={`amt-${sc.id}`}
                      className={`text-sm font-medium text-right whitespace-nowrap ${amountClass}`}
                    >
                      {formatAmount(sc.value)}
                    </span>
                  </>
                );
              })}
            </div>
          </div>

          {/* Right: Transaction list grouped by subcategory */}
          <div className="max-h-72 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-ink-faint">
                거래 내역이 없습니다.
              </div>
            ) : (
              [...grouped.entries()].map(([cat, txns]) => {
                if (txns.length === 0) return null;
                const subtotal = txns.reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center px-4 py-1.5 bg-surface-soft">
                      <span className="text-xs font-semibold text-ink-subtle uppercase tracking-wide">
                        {cat}
                      </span>
                      <span className={`text-xs font-medium ${amountClass}`}>
                        {formatAmount(subtotal)}
                      </span>
                    </div>
                    <div className="divide-y divide-hairline-soft">
                      {txns.map(t => (
                        <TransactionRow
                          key={t.id}
                          t={t}
                          showCategory={false}
                          categoryType={categoryType}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-ink-faint">거래 내역이 없습니다.</div>
      ) : (
        /* Flat list */
        <div className="divide-y divide-hairline-soft max-h-72 overflow-y-auto">
          {sorted.map(t => (
            <TransactionRow key={t.id} t={t} showCategory={isParent} categoryType={categoryType} />
          ))}
        </div>
      )}
    </div>
  );
}
