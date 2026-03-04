import { formatAmount } from '@/lib/format-utils';

type CardType = 'income' | 'expense' | 'balance';

interface SummaryCardProps {
  type: CardType;
  amount: number;
  ratio?: number;
  simplify?: boolean;
  compact?: boolean;
}

const cardStyles: Record<
  CardType,
  {
    container: string;
    containerCompact: string;
    label: string;
    labelText: string;
    amount: string;
    amountCompact: string;
    amountNegative?: string;
    amountNegativeCompact?: string;
    sub: string;
  }
> = {
  income: {
    container:
      'rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40',
    containerCompact:
      'rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/40',
    label:
      'text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80',
    labelText: '수입',
    amount: 'text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300',
    amountCompact: 'text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300',
    sub: 'text-xs text-emerald-700/70 dark:text-emerald-300/70',
  },
  expense: {
    container:
      'rounded-2xl border border-rose-200/60 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/40',
    containerCompact:
      'rounded-2xl border border-rose-200/60 bg-rose-50/80 p-3 dark:border-rose-900/60 dark:bg-rose-950/40',
    label: 'text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80',
    labelText: '지출',
    amount: 'text-3xl font-semibold tracking-tight text-rose-700 dark:text-rose-300',
    amountCompact: 'text-2xl font-semibold tracking-tight text-rose-700 dark:text-rose-300',
    sub: 'text-xs text-rose-700/70 dark:text-rose-300/70',
  },
  balance: {
    container:
      'rounded-2xl border border-blue-200/50 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30',
    containerCompact:
      'rounded-2xl border border-blue-200/50 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/30',
    label: 'text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
    labelText: '잔액',
    amount: 'text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-400',
    amountCompact: 'text-xl font-semibold tracking-tight text-blue-600 dark:text-blue-400',
    amountNegative: 'text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400',
    amountNegativeCompact: 'text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-400',
    sub: 'text-xs text-zinc-500 dark:text-zinc-400',
  },
};

export function SummaryCard({
  type,
  amount,
  ratio,
  simplify = false,
  compact = false,
}: SummaryCardProps) {
  const styles = cardStyles[type];
  const isNegative = type === 'balance' && amount < 0;

  const amountClass = compact
    ? (isNegative && styles.amountNegativeCompact) || styles.amountCompact
    : (isNegative && styles.amountNegative) || styles.amount;

  const containerClass = compact ? styles.containerCompact : styles.container;

  const subText =
    type === 'balance'
      ? '수입 - 지출'
      : ratio !== undefined
        ? `전체의 ${Math.round(ratio)}%`
        : null;

  return (
    <div className={containerClass}>
      {!simplify && <p className={styles.label}>{styles.labelText}</p>}
      <p className={`${simplify ? 'mt-0' : compact ? 'mt-1' : 'mt-2'} ${amountClass}`}>
        {formatAmount(amount)}
      </p>
      {!simplify && subText && (
        <p className={`${compact ? 'mt-0' : 'mt-1'} ${styles.sub}`}>{subText}</p>
      )}
    </div>
  );
}
