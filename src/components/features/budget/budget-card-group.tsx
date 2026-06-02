import { formatAmount } from '@/lib/format-utils';
import { SummaryCard } from './budget-card';

interface SummaryCardGroupProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  simplify?: boolean;
  vertical?: boolean;
  inline?: boolean;
}

export function SummaryCardGroup({
  totalIncome,
  totalExpense,
  balance,
  simplify = false,
  vertical = false,
  inline = false,
}: SummaryCardGroupProps) {
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;
  const expenseRatio = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 50;
  const balanceTone =
    balance < 0
      ? {
          label: '초과 지출',
          container: 'loss-soft border-hairline text-ink',
          amount: 'text-loss',
          sub: 'text-loss',
        }
      : {
          label: balance === 0 ? '수지 균형' : '월간 잔액',
          container: 'accent-soft border-hairline text-ink',
          amount: 'text-accent',
          sub: 'text-accent',
        };

  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard type="income" amount={totalIncome} compact simplify />
        <SummaryCard type="expense" amount={totalExpense} compact simplify />
        <SummaryCard type="balance" amount={balance} compact simplify />
      </div>
    );
  }

  if (vertical) {
    return (
      <div className="grid grid-cols-1 gap-2">
        <SummaryCard type="income" amount={totalIncome} ratio={incomeRatio} compact />
        <SummaryCard type="expense" amount={totalExpense} ratio={expenseRatio} compact />
        <SummaryCard type="balance" amount={balance} compact />
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div
        className={`min-w-0 rounded-xl border p-5 shadow-[var(--shadow-1)] sm:p-6 ${balanceTone.container}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{balanceTone.label}</p>
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted">
            수입 - 지출
          </span>
        </div>
        <p
          className={`mt-3 min-w-0 break-words text-3xl font-semibold tracking-normal [overflow-wrap:anywhere] sm:text-4xl ${balanceTone.amount}`}
        >
          {formatAmount(balance)}
        </p>
        <p className={`mt-2 text-sm ${balanceTone.sub}`}>이번 달 현금흐름 결과</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <MetricCard
          label="총수입"
          amount={totalIncome}
          ratio={incomeRatio}
          tone="income"
          simplify={simplify}
        />
        <MetricCard
          label="총지출"
          amount={totalExpense}
          ratio={expenseRatio}
          tone="expense"
          simplify={simplify}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  amount,
  ratio,
  tone,
  simplify,
}: {
  label: string;
  amount: number;
  ratio: number;
  tone: 'income' | 'expense';
  simplify: boolean;
}) {
  const toneClass =
    tone === 'income'
      ? {
          container: 'border-hairline bg-surface',
          label: 'text-gain',
          amount: 'text-gain',
          bar: 'bg-gain',
        }
      : {
          container: 'border-hairline bg-surface',
          label: 'text-loss',
          amount: 'text-loss',
          bar: 'bg-loss',
        };

  return (
    <div
      className={`min-w-0 rounded-xl border p-4 shadow-[var(--shadow-1)] ${toneClass.container}`}
    >
      {!simplify && <p className={`text-sm font-semibold ${toneClass.label}`}>{label}</p>}
      <p
        className={`mt-2 min-w-0 break-words text-2xl font-semibold tracking-normal [overflow-wrap:anywhere] ${toneClass.amount}`}
      >
        {formatAmount(amount)}
      </p>
      {!simplify && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-ink-subtle">
            <span>현금흐름 비중</span>
            <span>{Math.round(ratio)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div
              className={`h-full rounded-full ${toneClass.bar}`}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
