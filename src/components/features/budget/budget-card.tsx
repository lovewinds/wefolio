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
    container: 'gain-soft rounded-2xl border border-hairline p-4',
    containerCompact: 'gain-soft rounded-2xl border border-hairline p-3',
    label: 'text-xs font-semibold uppercase tracking-wide text-gain',
    labelText: '수입',
    amount: 'text-3xl font-semibold tracking-tight text-gain',
    amountCompact: 'text-2xl font-semibold tracking-tight text-gain',
    sub: 'text-xs text-gain',
  },
  expense: {
    container: 'loss-soft rounded-2xl border border-hairline p-4',
    containerCompact: 'loss-soft rounded-2xl border border-hairline p-3',
    label: 'text-xs font-semibold uppercase tracking-wide text-loss',
    labelText: '지출',
    amount: 'text-3xl font-semibold tracking-tight text-loss',
    amountCompact: 'text-2xl font-semibold tracking-tight text-loss',
    sub: 'text-xs text-loss',
  },
  balance: {
    container: 'accent-soft rounded-2xl border border-hairline p-4',
    containerCompact: 'accent-soft rounded-2xl border border-hairline p-3',
    label: 'text-xs font-semibold uppercase tracking-wide text-ink-subtle',
    labelText: '잔액',
    amount: 'text-2xl font-semibold tracking-tight text-accent',
    amountCompact: 'text-xl font-semibold tracking-tight text-accent',
    amountNegative: 'text-2xl font-semibold tracking-tight text-loss',
    amountNegativeCompact: 'text-xl font-semibold tracking-tight text-loss',
    sub: 'text-xs text-ink-subtle',
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
